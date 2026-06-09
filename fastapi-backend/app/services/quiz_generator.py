import json
import logging
import typing_extensions as typing
from typing import List
from uuid import UUID
import google.generativeai as genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document, DocumentChunk
from app.schemas.quiz import QuizGenerateRequest, QuizGenerateResponse, QuizQuestion, QuizOption

logger = logging.getLogger(__name__)

# Configure Google Gemini API
if settings.GOOGLE_API:
    genai.configure(api_key=settings.GOOGLE_API)
model = genai.GenerativeModel('gemini-2.0-flash')

# 1. Khai báo Schema cho Gemini (Structured Outputs)
class OptionSchema(typing.TypedDict):
    key: str
    text: str

class QuestionSchema(typing.TypedDict):
    question: str
    options: list[OptionSchema]
    correct_answer: str
    explanation: str


def get_document_content(db: Session, document_ids: List[UUID]) -> str:
    content_parts = []
    
    documents = db.query(Document).filter(Document.id.in_(document_ids)).all()
    
    for doc in documents:
        content_parts.append(f"--- Bắt đầu tài liệu: {doc.file_name} ---")
        if doc.ocr_content:
            content_parts.append(doc.ocr_content)
        else:
            chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.chunk_index).all()
            if chunks:
                for chunk in chunks:
                    content_parts.append(chunk.content)
            else:
                content_parts.append("Tài liệu không có nội dung.")
        content_parts.append(f"--- Kết thúc tài liệu: {doc.file_name} ---\n")
        
    return "\n".join(content_parts)


def generate_quiz_from_documents(db: Session, request: QuizGenerateRequest) -> QuizGenerateResponse:
    # Fetch content from documents
    context_text = get_document_content(db, request.document_ids)
    
    if not context_text.strip():
        raise ValueError("Không tìm thấy nội dung từ các tài liệu đã chọn.")

    # Prepare the prompt for Gemini
    prompt = f"""
    Bạn là một chuyên gia tạo đề thi trắc nghiệm. Hãy tạo một bài trắc nghiệm dựa trên nội dung tài liệu sau đây.
    
    Số lượng câu hỏi yêu cầu: {request.num_questions}
    Độ khó: {request.difficulty}
    Yêu cầu thêm: {request.additional_context or 'Không có'}
    
    QUAN TRỌNG: Trả về ĐÚNG định dạng JSON là một mảng các đối tượng, mỗi đối tượng gồm:
    - "question": chuỗi câu hỏi
    - "options": mảng 4 phần tử, mỗi phần tử có "key" (A/B/C/D) và "text" (nội dung lựa chọn)
    - "correct_answer": key của đáp án đúng ("A", "B", "C" hoặc "D")
    - "explanation": chuỗi giải thích đáp án
    
    Nội dung tài liệu:
    {context_text}
    """

    # Call Google Gemini API
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                response_schema=list[QuestionSchema], # 2. Ép buộc Gemini tuân thủ chính xác Schema này
                temperature=0.2,                      # 3. Giảm nhiệt độ để kết quả ổn định và bớt tính "sáng tạo bay bổng"
                max_output_tokens=8192                # 4. Tăng giới hạn token để tránh JSON bị cắt cụt giữa chừng
            ),
            request_options={"timeout": 300}
        )
        response_text = response.text.strip()

        # Clean up markdown code fences if model returns them
        if response_text.startswith("```json"):
            response_text = response_text[7:].strip()
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:].strip()
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()

        # Fallback: extract first JSON array from the response
        if not response_text.startswith("["):
            import re
            match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if match:
                response_text = match.group(0)

        quiz_data = json.loads(response_text)
        
        # Build QuizQuestion objects explicitly to handle any field-name variation from AI
        questions = []
        for q in quiz_data:
            raw_options = q.get('options', [])
            if isinstance(raw_options, str):
                try:
                    raw_options = json.loads(raw_options)
                except Exception:
                    raw_options = []
            # Normalize each option's text field
            options = []
            for opt in raw_options:
                if not isinstance(opt, dict):
                    continue
                if 'text' not in opt:
                    # Try alternate key names, then fall back to first non-key value
                    text_val = opt.pop('text_content', opt.pop('content', opt.pop('text_answer', None)))
                    if text_val is None:
                        for k, v in list(opt.items()):
                            if k != 'key':
                                text_val = v
                                break
                    opt['text'] = str(text_val) if text_val is not None else ''
                options.append(QuizOption(key=str(opt.get('key', '')), text=str(opt.get('text', ''))))
            questions.append(QuizQuestion(
                question=q.get('question', q.get('question_text', '')),
                options=options,
                correct_answer=str(q.get('correct_answer', q.get('answer', ''))),
                explanation=q.get('explanation') or None
            ))

        return QuizGenerateResponse(questions=questions)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from Gemini: {response_text}")
        raise ValueError("Lỗi khi xử lý kết quả từ AI: Cấu trúc JSON không hợp lệ.")
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        raise Exception(f"Lỗi khi gọi Google API: {str(e)}")