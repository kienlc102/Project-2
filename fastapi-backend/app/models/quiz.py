from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# 1. BỎ ĐOẠN NÀY:
# from sqlalchemy.ext.declarative import declarative_base
# Base = declarative_base()

# 2. THÊM ĐOẠN NÀY (Giống hệt bên file Subject):
from app.db.database import Base 

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True)
    university_id = Column(Integer, ForeignKey("universities.id", ondelete="CASCADE"))
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    # Bạn nên thêm relationship để dễ dàng truy vấn ngược/xuôi sau này
    # subject = relationship("Subject", back_populates="quizzes")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"))
    question_text = Column(Text, nullable=False)
    options = Column(JSON)
    correct_answer = Column(String(50))
    explanation = Column(Text)
    
    # quiz = relationship("Quiz", back_populates="questions")