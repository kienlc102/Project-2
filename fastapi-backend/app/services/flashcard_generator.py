import json
import logging
import typing_extensions as typing
import google.generativeai as genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.flashcard import FlashcardGenerateRequest, FlashcardGenerateResponse, FlashcardItem
from app.services.quiz_generator import get_document_content

logger = logging.getLogger(__name__)

# Configure Google Gemini API
genai.configure(api_key=settings.GOOGLE_API)
model = genai.GenerativeModel('gemini-2.5-flash')

class FlashcardSchema(typing.TypedDict):
    front: str
    back: str

def generate_flashcards_from_documents(db: Session, request: FlashcardGenerateRequest) -> FlashcardGenerateResponse:
    # Fetch content from documents
    context_text = get_document_content(db, request.document_ids)
    
    if not context_text.strip():
        raise ValueError("Không tìm thấy nội dung từ các tài liệu đã chọn.")

    # Prepare the prompt for Gemini
    prompt = f"""
    Bạn là một hệ thống AI tạo flashcard. Nhiệm vụ của bạn là phân tích tài liệu và xuất ra danh sách các flashcard.
    TUYỆT ĐỐI TUÂN THỦ CÁC QUY TẮC SAU:
    1. Chỉ trả về dữ liệu dưới định dạng JSON, không thêm bất kỳ văn bản, lời giải thích, hay lời xin lỗi nào.
    2. Mỗi flashcard phải có 'front' (thuật ngữ/câu hỏi, tối đa 20 từ) và 'back' (định nghĩa chi tiết, tối đa 50 từ).
    3. KHÔNG ĐƯỢC trích dẫn số trang hay nguồn tài liệu vào thẻ flashcard.
    
    Số lượng flashcard yêu cầu: {request.num_flashcards}
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
                response_schema=list[FlashcardSchema],
                temperature=0.2,
                max_output_tokens=8192
            ),
            request_options={"timeout": 300}
        )
        response_text = response.text.strip()
        
        # Clean markdown if AI accidentally wraps JSON
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        flashcard_data = json.loads(response_text)
        
        # Convert to Pydantic models
        flashcards = [FlashcardItem(**f) for f in flashcard_data]

        return FlashcardGenerateResponse(flashcards=flashcards)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from Gemini: {response_text}")
        raise ValueError("Lỗi khi xử lý kết quả từ AI: Cấu trúc JSON không hợp lệ.")
    except Exception as e:
        logger.error(f"Error generating flashcards: {e}")
        raise Exception(f"Lỗi khi gọi Google API: {str(e)}")
