from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Any
from uuid import UUID
import json

class QuizGenerateRequest(BaseModel):
    document_ids: List[UUID] = Field(..., description="List of document IDs to generate quiz from")
    num_questions: int = Field(default=10, ge=1, le=50, description="Number of questions to generate")
    difficulty: str = Field(default="medium", description="Difficulty level of the quiz (easy, medium, hard)")
    additional_context: Optional[str] = Field(default=None, description="Any additional context or topic focus")

class QuizOption(BaseModel):
    key: str = Field(..., description="Option key like A, B, C, D")
    text: str = Field(..., description="Option text content")
    model_config = ConfigDict(from_attributes=True)

class QuizQuestion(BaseModel):
    # 1. SỬA LỖI TÊN: Dùng validation_alias để Pydantic biết lấy dữ liệu từ 'question_text'
    question: str = Field(..., validation_alias="question_text", description="The question text")
    
    options: List[QuizOption] = Field(..., description="List of options")
    correct_answer: str = Field(..., description="The correct option key (e.g., A)")
    explanation: str = Field(..., description="Explanation for the correct answer")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # 2. SỬA LỖI KIỂU DỮ LIỆU: Tự động parse chuỗi JSON từ DB thành List
    @field_validator('options', mode='before')
    @classmethod
    def parse_options(cls, v: Any) -> Any:
        if isinstance(v, str): # Nếu DB trả về chuỗi JSON
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [] # Trả về mảng rỗng nếu chuỗi bị lỗi để tránh crash
        return v # Nếu nó đã là list rồi (ví dụ lúc gọi API AI) thì giữ nguyên

class QuizGenerateResponse(BaseModel):
    questions: List[QuizQuestion]
    model_config = ConfigDict(from_attributes=True)

class QuizCreateSuccessResponse(BaseModel):
    success: bool
    message: str
    quiz_id: int
    quiz_title: str
    

# ─── Submit schemas ───────────────────────────────────────────────

class QuizSubmitAnswer(BaseModel):
    questionIndex: int = Field(..., description="0-based index of the question")
    selectedKey: Optional[str] = Field(default=None, description="Selected option key (A/B/C/D)")
    textAnswer: Optional[str] = Field(default=None)

class QuizSubmitRequest(BaseModel):
    questions: List[QuizQuestion] = Field(..., description="Full question list (from generate response)")
    answers: List[QuizSubmitAnswer] = Field(..., description="User answers")

class QuizSubmitResult(BaseModel):
    question_index: int
    is_correct: bool
    selected_key: Optional[str]
    correct_key: str
    explanation: str

class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    percentage: int
    results: List[QuizSubmitResult]
