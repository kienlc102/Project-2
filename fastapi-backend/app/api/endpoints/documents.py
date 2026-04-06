import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form
from sqlalchemy.orm import Session

from app.db.database import get_db
# Đảm bảo import đầy đủ các models
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.services.document_processor import (
    calculate_hash, 
    extract_text, 
    chunk_document, 
    generate_embedding
)

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    owner_id: int = Form(...),
    group_id: Optional[int] = Form(default=None),
    db: Session = Depends(get_db)
):
    # ---------------------------------------------------------
    # 0. KIỂM TRA TÍNH HỢP LỆ CỦA DỮ LIỆU ĐẦU VÀO (FAIL FAST)
    # ---------------------------------------------------------
    user_exists = db.query(User).filter(User.id == owner_id).first()
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng với ID {owner_id}."
        )

    # ---------------------------------------------------------
    # 1. LỚP KIỂM TRA 1: HASH CHECK (Trùng lặp 100% byte)
    # ---------------------------------------------------------
    # Đọc file vào RAM (chưa lưu xuống ổ cứng)
    file_bytes = await file.read()
    file_hash = calculate_hash(file_bytes)
    
    existing_doc = db.query(Document).filter(Document.hash_value == file_hash).first()
    if existing_doc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tài liệu giống hệt 100% đã tồn tại (Mã tài liệu: {existing_doc.id}). Hệ thống từ chối lưu."
        )

    # ---------------------------------------------------------
    # 2. XỬ LÝ TRÊN RAM: BÓC TÁCH VÀ CHIA NHỎ VĂN BẢN
    # ---------------------------------------------------------
    try:
        ocr_text = extract_text(file_bytes, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi bóc tách văn bản: {str(e)}")

    chunks = chunk_document(ocr_text)
    if not chunks:
        raise HTTPException(status_code=400, detail="Tài liệu trống, không trích xuất được văn bản.")

    # ---------------------------------------------------------
    # 3. LỚP KIỂM TRA 2: SEMANTIC CHECK (Trùng lặp ngữ nghĩa)
    # ---------------------------------------------------------
    embeddings = [generate_embedding(chunk) for chunk in chunks]
    first_chunk_vector = embeddings[0]
    
    SIMILARITY_THRESHOLD = 0.15 
    
    similar_chunk = db.query(DocumentChunk).filter(
        DocumentChunk.embedding.cosine_distance(first_chunk_vector) < SIMILARITY_THRESHOLD
    ).first()

    if similar_chunk:
        # Nếu phát hiện nội dung na ná nhau -> CHẶN NGAY LẬP TỨC
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Nội dung tài liệu này tương tự với một tài liệu đã có trên hệ thống. Hệ thống từ chối lưu.",
            upload_status = False
        )

    # =========================================================
    # 4. CHẮC CHẮN AN TOÀN -> BẮT ĐẦU GHI XUỐNG Ổ CỨNG VÀ DB
    # =========================================================
    # Lưu file vật lý
    file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Lưu Database (Document)
    new_doc = Document(
        owner_id=owner_id,
        group_id=group_id,
        file_name=file.filename,
        file_path=file_path,
        file_size=len(file_bytes),
        mime_type=file.content_type,
        hash_value=file_hash,
        ocr_content=ocr_text,
        status="active" # Chắc chắn là active vì đã pass qua lớp chặn trùng lặp
    )
    db.add(new_doc)
    db.flush() 

    # Lưu Database (Chunks)
    chunk_records = []
    for idx, (chunk_text, embedding_vector) in enumerate(zip(chunks, embeddings)):
        chunk_record = DocumentChunk(
            document_id=new_doc.id, 
            chunk_index=idx,
            content=chunk_text,
            embedding=embedding_vector
        )
        chunk_records.append(chunk_record)

    db.bulk_save_objects(chunk_records)
    db.commit()

    return {
        "message": "Upload và kiểm duyệt tài liệu thành công. Không có trùng lặp.",
        "document_id": new_doc.id,
        "file_name": new_doc.file_name,
        "total_chunks_processed": len(chunks),
        "upload_status": True
    }