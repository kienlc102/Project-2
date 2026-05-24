from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.flashcard import (
    FlashcardGenerateRequest, FlashcardGenerateResponse, FlashcardCreateSuccessResponse, FlashcardItem
)
from app.services.flashcard_generator import generate_flashcards_from_documents
from app.models.flashcard import FlashcardSet, Flashcard
from app.models.document import Document
from app.models.subject import Subject
from app.models.university import University

router = APIRouter()

@router.get("/featured", response_model=list[FlashcardCreateSuccessResponse])
def get_featured_flashcard_sets(db: Session = Depends(get_db)):
    limit = 10
    flashcard_sets = db.query(FlashcardSet).limit(limit).all()
    response: list = []
    for fset in flashcard_sets:
        new_fset = FlashcardCreateSuccessResponse(
            success=True,
            message="Flashcard set retrieved successfully",
            flashcard_set_id=fset.id,
            flashcard_set_title=fset.title
        )
        response.append(new_fset)
    return response

@router.post("/generate", response_model=FlashcardCreateSuccessResponse)
def generate_flashcard_set(
    request: FlashcardGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate flashcards automatically from selected documents.
    """
    try:
        response = generate_flashcards_from_documents(db, request)
        document = db.query(Document).filter(Document.id == request.document_ids[0]).first()
        if not document:
            raise ValueError("Document not found")
            
        subject = db.query(Subject).filter(Subject.id == document.subject_id).first()
        university = db.query(University).filter(University.id == subject.university_id).first()
        
        # 1. Tạo và lưu FlashcardSet mới vào DB
        new_set = FlashcardSet(
            university_id=subject.university_id, 
            subject_id=subject.id,        
            title=f"Flashcard môn {subject.subject_name} - {university.university_code}",
            description="Bộ flashcard được tạo tự động từ tài liệu."  
        )
        db.add(new_set)
        db.commit()
        db.refresh(new_set)

        # 2. Lưu từng flashcard vào DB
        for f_data in response.flashcards:
            f = Flashcard(
                flashcard_set_id=new_set.id,
                front_text=f_data.front,
                back_text=f_data.back
            )
            db.add(f)

        db.commit()
        
        return FlashcardCreateSuccessResponse(
            success=True,
            message="Flashcards generated successfully",
            flashcard_set_id=new_set.id,
            flashcard_set_title=new_set.title
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get-flashcard-set-by-subject/{subject_id}")
def get_flashcard_sets_by_subject(subject_id: int, db: Session = Depends(get_db)):
    """
    Get flashcard sets by subject ID.
    """
    flashcard_sets = db.query(FlashcardSet).filter(FlashcardSet.subject_id == subject_id).all()
    result = []
    for fset in flashcard_sets:
        flashcard_count = db.query(Flashcard).filter(Flashcard.flashcard_set_id == fset.id).count()
        result.append({
            "flashcard_set_id": fset.id,
            "title": fset.title,
            "flashcard_count": flashcard_count,
            "created_at": fset.created_at
        })
    return result

@router.get("/get-flashcard-set-by-id/{id}", response_model=FlashcardGenerateResponse)
def get_flashcard_set_by_id(id: int, db: Session = Depends(get_db)):
    """
    Get a flashcard set by ID (returns the list of flashcards).
    """
    fset = db.query(FlashcardSet).filter(FlashcardSet.id == id).first()
    if not fset:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    flashcards = db.query(Flashcard).filter(Flashcard.flashcard_set_id == fset.id).all()
    
    # Map to expected response schema
    items = [FlashcardItem(front=f.front_text, back=f.back_text) for f in flashcards]
    response = FlashcardGenerateResponse(flashcards=items)
    return response

@router.get("/featured-subject/{subject_id}", response_model=list[FlashcardCreateSuccessResponse])
def get_featured_subject_flashcard_set(subject_id: int, db: Session = Depends(get_db)):
    limit = 10
    flashcard_sets = db.query(FlashcardSet).filter(FlashcardSet.subject_id == subject_id).limit(limit).all()
    response: list = []
    for fset in flashcard_sets:
        new_fset = FlashcardCreateSuccessResponse(
            success=True,
            message="Flashcard set retrieved successfully",
            flashcard_set_id=fset.id,
            flashcard_set_title=fset.title
        )
        response.append(new_fset)
    return response
