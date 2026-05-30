from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Nhớ import Base từ file cấu hình database của bạn
from app.db.database import Base 


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True)
    university_id = Column(Integer, ForeignKey("universities.id", ondelete="CASCADE", onupdate="CASCADE"))
    subject_name = Column(String(255), nullable=False)
    subject_code = Column(String(50))
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    university = relationship("University", back_populates="subjects")
    documents = relationship("Document", back_populates="subject") # Một môn học có nhiều tài liệu