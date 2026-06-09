from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.database import Base

class FlashcardSet(Base):
    __tablename__ = "flashcard_sets"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    visibility = Column(String(50), nullable=True)
    document_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())

class Flashcard(Base):
    __tablename__ = "flashcards"
    
    id = Column(Integer, primary_key=True)
    set_id = Column(Integer, ForeignKey("flashcard_sets.id", ondelete="CASCADE"))
    term = Column(Text, nullable=False)
    definition = Column(Text, nullable=False)
    term_image_url = Column(Text, nullable=True)
    definition_image_url = Column(Text, nullable=True)
    position = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
