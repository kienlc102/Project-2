from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.quiz import (
    QuizGenerateRequest, QuizGenerateResponse, QuizCreateSuccessResponse,
    QuizSubmitRequest, QuizSubmitResponse, QuizSubmitResult
)
from app.services.quiz_generator import generate_quiz_from_documents
from app.models.quiz import Quiz, Question
from sqlalchemy import func
from app.models.document import Document
from app.models.subject import Subject
from app.models.university import University
import json

router = APIRouter()

@router.get("/featured", response_model = list[QuizCreateSuccessResponse])
def get_featured_quiz(db: Session = Depends(get_db)):
    limit = 10
    quizzes = db.query(Quiz).limit(limit).all()
    response:list = []
    for quiz in quizzes:
        new_quiz = QuizCreateSuccessResponse(
            success=True,
            message="Quiz generated successfully",
            quiz_id=quiz.id,
            quiz_title=quiz.title
        )
        response.append(new_quiz)
    return response


@router.post("/generate", response_model=QuizCreateSuccessResponse)
def generate_quiz(
    request: QuizGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a multiple-choice quiz automatically from selected documents.
    """
    try:
        response = generate_quiz_from_documents(db, request)
        document = db.query(Document).filter(Document.id == request.document_ids[0]).first()
        subject = db.query(Subject).filter(Subject.id == document.subject_id).first()
        university = db.query(University).filter(University.id == subject.university_id).first()
        # 1. Tạo và lưu Quiz mới vào DB
        new_quiz = Quiz(
            university_id=subject.university_id, 
            subject_id=subject.id,        
            title=f"Quiz môn {subject.subject_name} - {university.university_code}",
            description="Đề thi trắc nghiệm được tạo tự động từ tài liệu."  
        )
        db.add(new_quiz)
        db.commit()
        db.refresh(new_quiz)

        # 2. Lưu từng câu hỏi vào DB
        for q_data in response.questions:
            q = Question(
                quiz_id=new_quiz.id,  # Map với Quiz vừa tạo
                question_text=q_data.question,
                options=json.dumps([{"key": opt.key, "text": opt.text} for opt in q_data.options]),
                correct_answer=q_data.correct_answer,
                explanation=q_data.explanation
            )
            db.add(q)

        db.commit()
        
        return QuizCreateSuccessResponse(
            success=True,
            message="Quiz generated successfully",
            quiz_id=new_quiz.id,
            quiz_title=new_quiz.title
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit", response_model=QuizSubmitResponse)
def submit_quiz(request: QuizSubmitRequest):
    """
    Grade a quiz submission. Stateless — no DB required.
    Expects the full question list and user's answers.
    """
    score = 0
    results = []

    for ans in request.answers:
        idx = ans.questionIndex
        if idx < 0 or idx >= len(request.questions):
            continue

        q = request.questions[idx]
        correct_key = q.correct_answer
        selected_key = ans.selectedKey
        is_correct = selected_key is not None and selected_key.upper() == correct_key.upper()

        if is_correct:
            score += 1

        results.append(QuizSubmitResult(
            question_index=idx,
            is_correct=is_correct,
            selected_key=selected_key,
            correct_key=correct_key,
            explanation=q.explanation or "",
        ))

    total = len(request.questions)
    percentage = round((score / total) * 100) if total > 0 else 0

    return QuizSubmitResponse(
        score=score,
        total=total,
        percentage=percentage,
        results=results,
    )

@router.get("/get-quiz-by-subject/{subject_id}")
def get_quizzes_by_subject(subject_id: int, db: Session = Depends(get_db)):
    """
    Get quizzes by subject ID.
    """
    quizzes = db.query(Quiz).filter(Quiz.subject_id == subject_id).all()
    result = []
    for quiz in quizzes:
        question_count = db.query(Question).filter(Question.quiz_id == quiz.id).count()
        result.append({
            "quiz_id": quiz.id,
            "title": quiz.title,
            "question_count": question_count,
            "created_at": quiz.created_at
        })
    return result

@router.get("/get-quiz-by-id/{id}", response_model=QuizGenerateResponse)
def get_quiz_by_id(id: int, db: Session = Depends(get_db)):
    """
    Get a quiz by ID.
    """
    quiz = db.query(Quiz).filter(Quiz.id == id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = db.query(Question).filter(Question.quiz_id == quiz.id).all()
    response = QuizGenerateResponse(questions=questions)
    return response


@router.get("/featured-subject/{subject_id}", response_model = list[QuizCreateSuccessResponse])
def get_featured_subject_quiz(subject_id: int, db: Session = Depends(get_db)):
    limit = 10
    quizzes = db.query(Quiz).filter(Quiz.subject_id == subject_id).limit(limit).all()
    response:list = []
    for quiz in quizzes:
        new_quiz = QuizCreateSuccessResponse(
            success=True,
            message="Quiz generated successfully",
            quiz_id=quiz.id,
            quiz_title=quiz.title
        )
        response.append(new_quiz)
    return response

