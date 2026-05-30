import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.subject import Subject
from app.models.university import University
from app.models.quiz import Quiz
from app.schemas.subject import SubjectFeatured, SubjectDetail   

router = APIRouter()

@router.get("/featured", response_model=list[SubjectFeatured])
def get_featured_subjects(db: Session = Depends(get_db)):
    subjects = db.query(Subject).all()
    response: list = []
    for subject in subjects:
        university = db.query(University).filter(University.id == subject.university_id).first()
        response.append(
            SubjectFeatured(
                id=subject.id,
                subject_code=subject.subject_code,
                subject_name=subject.subject_name,
                university_code=university.university_code,
                university_name=university.university_name
            )
        )
    return response

@router.get("/{subject_id}", response_model=SubjectDetail)
def get_subject_detail(subject_id: int, db: Session = Depends(get_db)): 
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    university = db.query(University).filter(University.id == subject.university_id).first()
    return SubjectDetail(
        subject_code=subject.subject_code,
        subject_name=subject.subject_name,
        university_code=university.university_code,
        university_name=university.university_name,
        created_at=subject.created_at
    )