import uuid
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from typing import Optional

from app.db.database import Base

class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'duplicated_warning', 'deleted')", name="documents_status_check"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    hash_value = Column(String(100))
    ocr_content = Column(Text)
    status = Column(String(50), server_default="active")
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="documents")
    group = relationship("Group", back_populates="documents")
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