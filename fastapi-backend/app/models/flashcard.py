from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class FlashcardSet(Base):
    __tablename__ = "flashcard_sets"
    
    id = Column(Integer, primary_key=True)
    university_id = Column(Integer, ForeignKey("universities.id", ondelete="CASCADE"))
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class Flashcard(Base):
    __tablename__ = "flashcards"
    
    id = Column(Integer, primary_key=True)
    flashcard_set_id = Column(Integer, ForeignKey("flashcard_sets.id", ondelete="CASCADE"))
    front_text = Column(Text, nullable=False)
    back_text = Column(Text, nullable=False)
