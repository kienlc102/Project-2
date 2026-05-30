from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from uuid import UUID

class FlashcardGenerateRequest(BaseModel):
    document_ids: List[UUID] = Field(..., description="List of document IDs to generate flashcards from")
    num_flashcards: int = Field(default=10, ge=1, le=50, description="Number of flashcards to generate")
    additional_context: Optional[str] = Field(default=None, description="Any additional context or topic focus")

class FlashcardItem(BaseModel):
    front: str = Field(..., description="The term or concept on the front of the flashcard")
    back: str = Field(..., description="The definition or explanation on the back of the flashcard")
    
    model_config = ConfigDict(from_attributes=True)

class FlashcardGenerateResponse(BaseModel):
    flashcards: List[FlashcardItem]
    model_config = ConfigDict(from_attributes=True)

class FlashcardCreateSuccessResponse(BaseModel):
    success: bool
    message: str
    flashcard_set_id: int
    flashcard_set_title: str
