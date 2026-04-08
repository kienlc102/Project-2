import uuid
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255))
    full_name = Column(String(255))
    is_verified = Column(Boolean, nullable=False, default=False)
    provider = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    groups_created = relationship("Group", back_populates="creator")
    documents = relationship("Document", back_populates="owner")