from fastapi import APIRouter
from app.api.endpoints import users, documents

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(documents.router, prefix="/document", tags=["Documents"])