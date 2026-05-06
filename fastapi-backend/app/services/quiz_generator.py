import json
import logging
import typing_extensions as typing
from typing import List
from uuid import UUID
import google.generativeai as genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document, DocumentChunk
from app.schemas.quiz import QuizGenerateRequest, QuizGenerateResponse, QuizQuestion

logger = logging.getLogger(__name__)

# Configure Google Gemini API
genai.configure(api_key=settings.GOOGLE_API)
model = genai.GenerativeModel('gemini-2.5-flash-lite')

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
            )
        )
        response_text = response.text.strip()
        
        # Parse JSON - Lúc này kết quả trả về gần như 100% là JSON chuẩn
        quiz_data = json.loads(response_text)
        
        # Normalize data to prevent Pydantic validation errors (giữ nguyên logic phòng hờ của bạn)
        for q in quiz_data:
            if 'options' in q:
                for opt in q['options']:
                    if 'text' not in opt:
                        text_val = opt.pop('text_content', opt.pop('content', opt.pop('text_answer', None)))
                        if text_val is None:
                            for k, v in list(opt.items()):
                                if k != 'key':
                                    text_val = v
                                    break
                        opt['text'] = str(text_val) if text_val is not None else ''
        
        # Convert to Pydantic models
        questions = [QuizQuestion(**q) for q in quiz_data]

        return QuizGenerateResponse(questions=questions)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from Gemini: {response_text}")
        raise ValueError("Lỗi khi xử lý kết quả từ AI: Cấu trúc JSON không hợp lệ.")
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        raise Exception(f"Lỗi khi gọi Google API: {str(e)}")