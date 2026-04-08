from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Nhớ import Base từ file cấu hình database của bạn
from app.db.database import Base

class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True)
    university_name = Column(String(255), nullable=False)
    university_code = Column(String(50), unique=True)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship: Một trường có nhiều môn học (1-N)
    subjects = relationship("Subject", back_populates="university", cascade="all, delete-orphan")