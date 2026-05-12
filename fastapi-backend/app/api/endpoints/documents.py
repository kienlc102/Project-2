import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from app.db.database import get_db
# Đảm bảo import đầy đủ các models
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.models.subject import Subject
from app.models.university import University 
from app.services.document_processor import (
    calculate_hash, 
    extract_text, 
    chunk_document, 
    generate_embedding
)
from app.services.ai_generator import generate_flashcards_and_quiz
router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/universities")
async def list_universities(
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(University)
    if search:
        wildcard = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(University.university_code).like(wildcard) |
            func.lower(University.university_name).like(wildcard)
        )

    universities = query.order_by(University.university_name).limit(limit).all()
    return [
        {
            "id": uni.id,
            "university_code": uni.university_code,
            "university_name": uni.university_name,
        }
        for uni in universities
    ]

@router.get("/subjects")
async def list_subjects(
    university_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    query = db.query(Subject)
    if university_id is not None:
        query = query.filter(Subject.university_id == university_id)

    if search:
        wildcard = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(Subject.subject_code).like(wildcard) |
            func.lower(Subject.subject_name).like(wildcard)
        )

    subjects = query.order_by(Subject.subject_code).limit(limit).all()
    return [
        {
            "id": subject.id,
            "subject_code": subject.subject_code,
            "subject_name": subject.subject_name,
            "university_id": subject.university_id,
        }
        for subject in subjects
    ]

@router.get("/search")
async def search_documents(
    keyword: str = Query(..., min_length=1, description="Từ khóa tìm kiếm tài liệu và môn học"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Tìm kiếm tài liệu theo tên file hoặc nội dung (OCR content), 
    và tìm kiếm môn học theo mã hoặc tên.
    """
    wildcard = f"%{keyword.strip().lower()}%"
    
    # Tìm kiếm tài liệu
    documents_query = db.query(Document).filter(
        (func.lower(Document.file_name).like(wildcard)) |
        (func.lower(Document.ocr_content).like(wildcard))
    ).filter(Document.status == "active").order_by(Document.id.desc()).limit(limit).all()
    
    documents = [
        {
            "id": str(doc.id),
            "file_name": doc.file_name,
            "doc_type": doc.doc_type,
            "subject_id": doc.subject_id,
            "file_size": doc.file_size
        }
        for doc in documents_query
    ]
    
    # Tìm kiếm môn học
    subjects_query = db.query(Subject).filter(
        (func.lower(Subject.subject_code).like(wildcard)) |
        (func.lower(Subject.subject_name).like(wildcard))
    ).order_by(Subject.subject_code).limit(limit).all()
    
    subjects = [
        {
            "id": subject.id,
            "subject_code": subject.subject_code,
            "subject_name": subject.subject_name,
            "university_id": subject.university_id
        }
        for subject in subjects_query
    ]
    
    return {
        "documents": documents,
        "subjects": subjects
    }

@router.get("/featured")
async def get_featured_documents(
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    featured = db.query(Document).filter(Document.status == "active").order_by(Document.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(doc.id),
            "file_name": doc.file_name,
            "doc_type": doc.doc_type,
            "subject_id": doc.subject_id,
            "file_size": doc.file_size
        }
        for doc in featured
    ]

@router.get("/{doc_id}")
async def get_document_detail(
    doc_id: str,
    db: Session = Depends(get_db)
):
    """
    Lấy chi tiết một tài liệu bao gồm thông tin metadata và preview.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài liệu không tìm thấy."
        )
    
    # Lấy thông tin môn học nếu có
    subject_info = None
    if doc.subject_id:
        subject = db.query(Subject).filter(Subject.id == doc.subject_id).first()
        if subject:
            subject_info = {
                "id": subject.id,
                "subject_code": subject.subject_code,
                "subject_name": subject.subject_name,
                "university_id": subject.university_id
            }
    
    # Lấy preview (200 ký tự đầu của nội dung OCR)
    preview = doc.ocr_content[:200] if doc.ocr_content else "Không có nội dung"
    
    # Lấy flashcard/quiz AI đã tạo cho tài liệu này
    flashcard_row = db.execute(
        text("SELECT id FROM flashcard_sets WHERE document_id = :doc_id ORDER BY id DESC LIMIT 1"),
        {"doc_id": doc_id}
    ).fetchone()
    quiz_row = db.execute(
        text("SELECT id FROM quizzes WHERE document_id = :doc_id ORDER BY id DESC LIMIT 1"),
        {"doc_id": doc_id}
    ).fetchone()

    return {
        "id": str(doc.id),
        "file_name": doc.file_name,
        "file_size": doc.file_size,
        "doc_type": doc.doc_type,
        "mime_type": doc.mime_type,
        "created_at": doc.created_at,
        "subject": subject_info,
        "preview": preview,
        "total_content_length": len(doc.ocr_content) if doc.ocr_content else 0,
        "file_path": doc.file_path,
        "ai_flashcard_set_id": flashcard_row[0] if flashcard_row else None,
        "ai_quiz_id": quiz_row[0] if quiz_row else None
    }

@router.get("/subject/{subject_id}")
async def get_subject_detail(
    subject_id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy chi tiết môn học, thông tin trường, và các tài liệu liên quan.
    """
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Môn học không tồn tại."
        )

    university = db.query(University).filter(University.id == subject.university_id).first()
    documents = db.query(Document).filter(
        Document.subject_id == subject_id,
        Document.status == "active"
    ).order_by(Document.id.desc()).limit(50).all()

    document_counts = {
        "lecture": 0,
        "exercise": 0,
        "exam": 0,
        "other": 0,
    }
    for doc in documents:
        if doc.doc_type in document_counts:
            document_counts[doc.doc_type] += 1
        else:
            document_counts["other"] += 1

    return {
        "id": subject.id,
        "subject_code": subject.subject_code,
        "subject_name": subject.subject_name,
        "description": subject.description,
        "created_at": subject.created_at,
        "university": {
            "id": university.id if university else None,
            "university_code": university.university_code if university else None,
            "university_name": university.university_name if university else None,
        },
        "documents": [
            {
                "id": str(doc.id),
                "file_name": doc.file_name,
                "doc_type": doc.doc_type,
                "file_size": doc.file_size,
                "subject_id": doc.subject_id,
            }
            for doc in documents
        ],
        "document_counts": document_counts,
    }

@router.get("/download/{doc_id}")
async def download_document(
    doc_id: str,
    db: Session = Depends(get_db)
):
    """
    Tải về tài liệu theo ID.
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài liệu không tìm thấy."
        )
    
    # Kiểm tra file có tồn tại không
    if not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File không tìm thấy trên hệ thống."
        )
    
    return FileResponse(
        path=doc.file_path,
        media_type=doc.mime_type or 'application/octet-stream',
        filename=doc.file_name
    )

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    owner_id: int = Form(...),
    group_id: Optional[int] = Form(default=None),
    university_code: str = Form(...), # Bắt buộc
    subject_code: str = Form(...),    # Bắt buộc
    subject_name: str = Form(...),
    doc_type: str = Form(default="other"),
    db: Session = Depends(get_db)
):
    # ---------------------------------------------------------
    # 0. KIỂM TRA TÍNH HỢP LỆ CỦA DỮ LIỆU ĐẦU VÀO 
    # ---------------------------------------------------------
    user_exists = db.query(User).filter(User.id == owner_id).first()
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng với ID {owner_id}."
        )

    valid_doc_types = ["lecture", "exercise", "exam", "other"]
    if doc_type not in valid_doc_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loại tài liệu không hợp lệ. Chỉ chấp nhận: {', '.join(valid_doc_types)}"
        )

    # ---------------------------------------------------------
    # XỬ LÝ TRƯỜNG ĐẠI HỌC (GET OR CREATE)
    # ---------------------------------------------------------
    clean_uni_code = university_code.strip()
    existing_uni = db.query(University).filter(
        func.lower(University.university_code) == clean_uni_code.lower()
    ).first()

    if existing_uni:
        final_university_id = existing_uni.id
    else:
        new_uni = University(
            university_code=clean_uni_code,
            university_name=clean_uni_code,
        )
        db.add(new_uni)
        db.flush()
        final_university_id = new_uni.id

    # ---------------------------------------------------------
    # XỬ LÝ MÔN HỌC (GET OR CREATE - CÓ GẮN VỚI UNIVERSITY)
    # ---------------------------------------------------------
    clean_sub_code = subject_code.strip()
    
    # Tìm môn học theo Mã VÀ Trường Đại học
    existing_subject = db.query(Subject).filter(
        func.lower(Subject.subject_code) == clean_sub_code.lower(),
        Subject.university_id == final_university_id
    ).first()

    if existing_subject:
        final_subject_id = existing_subject.id
    else:
        # Tạo môn học mới và gắn với trường đại học
        new_subject = Subject(
            subject_code=clean_sub_code,
            university_id=final_university_id, # Gắn foreign key ở đây
            subject_name=subject_name.strip()
        )
        db.add(new_subject)
        db.flush() 
        final_subject_id = new_subject.id

    # ---------------------------------------------------------
    # 1. LỚP KIỂM TRA 1: HASH CHECK (Trùng lặp 100% byte)
    # ---------------------------------------------------------
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
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nội dung tài liệu này tương tự với một tài liệu đã có trên hệ thống. Hệ thống từ chối lưu."
        ) 

    # =========================================================
    # 4. CHẮC CHẮN AN TOÀN -> BẮT ĐẦU GHI XUỐNG Ổ CỨNG VÀ DB
    # =========================================================
    file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Lưu Database (Document)
    new_doc = Document(
        owner_id=owner_id,
        group_id=group_id,
        subject_id=final_subject_id, # Đã có sẵn ID từ bước xử lý phía trên
        doc_type=doc_type,    
        file_name=file.filename,
        file_path=file_path,
        file_size=len(file_bytes),
        mime_type=file.content_type,
        hash_value=file_hash,
        ocr_content=ocr_text,
        status="active" 
    )
    db.add(new_doc)
    db.flush() 

    # Lưu Database (Chunks)
    chunk_records = []
    for idx, (chunk_text, embedding_vector) in enumerate(zip(chunks, embeddings)):
        chunk_records.append(
            DocumentChunk(
                document_id=new_doc.id, 
                chunk_index=idx,
                content=chunk_text,
                embedding=embedding_vector
            )
        )

    db.bulk_save_objects(chunk_records)
    
    # Chỉ gọi db.commit() một lần duy nhất ở đây cho TẤT CẢ
    db.commit() 

    # =========================================================
    # 5. GỌI AI (Google Gemini) TẠO FLASHCARD + QUIZ TỰ ĐỘNG
    # =========================================================
    ai_result = None
    flashcard_set_id = None
    quiz_id = None

    try:
        ai_result = await generate_flashcards_and_quiz(ocr_text, file.filename)
    except Exception as e:
        print(f"[Upload] Lỗi khi gọi AI Generator: {e}")

    if ai_result:
        try:
            # --- Tạo Flashcard Set ---
            flashcard_set_row = db.execute(
                text("""
                    INSERT INTO flashcard_sets (user_id, title, description, visibility, document_id)
                    VALUES (:user_id, :title, :description, 'public', :document_id)
                    RETURNING id
                """),
                {
                    "user_id": owner_id,
                    "title": ai_result.get("flashcard_title", f"Tóm tắt: {file.filename}")[:255],
                    "description": ai_result.get("flashcard_description", "Tự động tạo bởi AI từ tài liệu"),
                    "document_id": str(new_doc.id)
                }
            ).fetchone()
            flashcard_set_id = flashcard_set_row[0] if flashcard_set_row else None

            if flashcard_set_id and ai_result.get("flashcards"):
                for idx, card in enumerate(ai_result["flashcards"]):
                    db.execute(
                        text("""
                            INSERT INTO flashcards (set_id, term, definition, position)
                            VALUES (:set_id, :term, :definition, :position)
                        """),
                        {
                            "set_id": flashcard_set_id,
                            "term": card.get("term", "")[:500],
                            "definition": card.get("definition", "")[:1000],
                            "position": idx
                        }
                    )

            # --- Tạo Quiz ---
            quiz_row = db.execute(
                text("""
                    INSERT INTO quizzes (user_id, title, description, visibility, document_id)
                    VALUES (:user_id, :title, :description, 'public', :document_id)
                    RETURNING id
                """),
                {
                    "user_id": owner_id,
                    "title": ai_result.get("quiz_title", f"Quiz: {file.filename}")[:255],
                    "description": ai_result.get("quiz_description", "Tự động tạo bởi AI từ tài liệu"),
                    "document_id": str(new_doc.id)
                }
            ).fetchone()
            quiz_id = quiz_row[0] if quiz_row else None

            if quiz_id and ai_result.get("questions"):
                for q_idx, question in enumerate(ai_result["questions"]):
                    q_row = db.execute(
                        text("""
                            INSERT INTO quiz_questions (quiz_id, question_text, question_type, position)
                            VALUES (:quiz_id, :question_text, 'multiple_choice', :position)
                            RETURNING id
                        """),
                        {
                            "quiz_id": quiz_id,
                            "question_text": question.get("question", "")[:1000],
                            "position": q_idx
                        }
                    ).fetchone()
                    question_id = q_row[0] if q_row else None

                    if question_id and question.get("options"):
                        correct_idx = question.get("correct_index", 0)
                        for o_idx, option_text in enumerate(question["options"]):
                            db.execute(
                                text("""
                                    INSERT INTO quiz_options (question_id, option_text, is_correct, position)
                                    VALUES (:question_id, :option_text, :is_correct, :position)
                                """),
                                {
                                    "question_id": question_id,
                                    "option_text": option_text[:500],
                                    "is_correct": (o_idx == correct_idx),
                                    "position": o_idx
                                }
                            )

            db.commit()
            print(f"[Upload] AI đã tạo flashcard_set_id={flashcard_set_id}, quiz_id={quiz_id}")

        except Exception as e:
            db.rollback()
            print(f"[Upload] Lỗi khi lưu AI content vào DB: {e}")
            flashcard_set_id = None
            quiz_id = None

    return {
        "message": "Upload và kiểm duyệt tài liệu thành công.",
        "document_id": new_doc.id,
        "file_name": new_doc.file_name,
        "university_id": final_university_id,
        "subject_id": new_doc.subject_id, 
        "doc_type": new_doc.doc_type,    
        "total_chunks_processed": len(chunks),
        "upload_status": True,
        "ai_generated": {
            "flashcard_set_id": flashcard_set_id,
            "quiz_id": quiz_id
        } if (flashcard_set_id or quiz_id) else None
    }


@router.post("/generate-ai/{doc_id}")
async def generate_ai_from_document(
    doc_id: str,
    db: Session = Depends(get_db)
):
    """
    Tạo flashcard + quiz bằng AI từ tài liệu đã upload.
    Dùng khi auto-generate lúc upload thất bại (rate limit, v.v.).
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Tài liệu không tìm thấy.")

    if not doc.ocr_content or not doc.ocr_content.strip():
        raise HTTPException(status_code=400, detail="Tài liệu không có nội dung text để generate.")

    ai_result = None
    try:
        ai_result = await generate_flashcards_and_quiz(doc.ocr_content, doc.file_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi gọi AI: {str(e)}")

    if not ai_result:
        raise HTTPException(status_code=503, detail="AI đang bận (rate limit). Vui lòng thử lại sau 30 giây.")

    flashcard_set_id = None
    quiz_id = None

    try:
        # Tạo Flashcard Set
        flashcard_set_row = db.execute(
            text("""
                INSERT INTO flashcard_sets (user_id, title, description, visibility, document_id)
                VALUES (:user_id, :title, :description, 'public', :document_id)
                RETURNING id
            """),
            {
                "user_id": doc.owner_id,
                "title": ai_result.get("flashcard_title", f"Tóm tắt: {doc.file_name}")[:255],
                "description": ai_result.get("flashcard_description", "Tự động tạo bởi AI từ tài liệu"),
                "document_id": str(doc.id)
            }
        ).fetchone()
        flashcard_set_id = flashcard_set_row[0] if flashcard_set_row else None

        if flashcard_set_id and ai_result.get("flashcards"):
            for idx, card in enumerate(ai_result["flashcards"]):
                db.execute(
                    text("""
                        INSERT INTO flashcards (set_id, term, definition, position)
                        VALUES (:set_id, :term, :definition, :position)
                    """),
                    {
                        "set_id": flashcard_set_id,
                        "term": card.get("term", "")[:500],
                        "definition": card.get("definition", "")[:1000],
                        "position": idx
                    }
                )

        # Tạo Quiz
        quiz_row = db.execute(
            text("""
                INSERT INTO quizzes (user_id, title, description, visibility, document_id)
                VALUES (:user_id, :title, :description, 'public', :document_id)
                RETURNING id
            """),
            {
                "user_id": doc.owner_id,
                "title": ai_result.get("quiz_title", f"Quiz: {doc.file_name}")[:255],
                "description": ai_result.get("quiz_description", "Tự động tạo bởi AI từ tài liệu"),
                "document_id": str(doc.id)
            }
        ).fetchone()
        quiz_id = quiz_row[0] if quiz_row else None

        if quiz_id and ai_result.get("questions"):
            for q_idx, question in enumerate(ai_result["questions"]):
                q_row = db.execute(
                    text("""
                        INSERT INTO quiz_questions (quiz_id, question_text, question_type, position)
                        VALUES (:quiz_id, :question_text, 'multiple_choice', :position)
                        RETURNING id
                    """),
                    {
                        "quiz_id": quiz_id,
                        "question_text": question.get("question", "")[:1000],
                        "position": q_idx
                    }
                ).fetchone()
                question_id = q_row[0] if q_row else None

                if question_id and question.get("options"):
                    correct_idx = question.get("correct_index", 0)
                    for o_idx, option_text in enumerate(question["options"]):
                        db.execute(
                            text("""
                                INSERT INTO quiz_options (question_id, option_text, is_correct, position)
                                VALUES (:question_id, :option_text, :is_correct, :position)
                            """),
                            {
                                "question_id": question_id,
                                "option_text": option_text[:500],
                                "is_correct": (o_idx == correct_idx),
                                "position": o_idx
                            }
                        )

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu vào DB: {str(e)}")

    return {
        "message": "AI đã tạo flashcard và quiz thành công!",
        "flashcard_set_id": flashcard_set_id,
        "quiz_id": quiz_id
    }