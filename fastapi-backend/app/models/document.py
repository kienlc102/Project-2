import uuid
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from typing import Optional

from app.db.database import Base


# ==========================================
# MODEL TÀI LIỆU VÀ CÁC THÀNH PHẦN LIÊN QUAN
# ==========================================

class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'duplicated_warning', 'deleted')", name="documents_status_check"),
        CheckConstraint("doc_type IN ('lecture', 'exercise', 'exam', 'other')", name="documents_doc_type_check"), # Ràng buộc mới cho loại tài liệu
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True) # Mới thêm
    
    file_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    hash_value = Column(String(100))
    ocr_content = Column(Text)
    doc_type = Column(String(50), server_default="other") # Mới thêm
    status = Column(String(50), server_default="active")
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="documents") # Yêu cầu User model có relationship "documents"
    group = relationship("Group", back_populates="documents") # Yêu cầu Group model có relationship "documents"
    subject = relationship("Subject", back_populates="documents") # Liên kết tới môn học
    
    metadata_info = relationship("DocumentMetadata", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentMetadata(Base):
    __tablename__ = "document_metadata"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    meta_key = Column(String(100), nullable=False)
    meta_value = Column(Text)

    document = relationship("Document", back_populates="metadata_info")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    
    embedding = Column(Vector(384))

    document = relationship("Document", back_populates="chunks")