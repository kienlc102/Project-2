from fastapi import APIRouter
from app.api.endpoints import users, documents, quiz, subjects, flashcard

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(documents.router, prefix="/document", tags=["Documents"])
api_router.include_router(quiz.router, prefix="/quiz", tags=["Quiz"])
api_router.include_router(subjects.router, prefix="/subject", tags=["Subject"])
api_router.include_router(flashcard.router, prefix="/flashcard", tags=["Flashcard"])
