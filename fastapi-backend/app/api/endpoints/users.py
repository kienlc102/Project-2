from fastapi import APIRouter
from app.schemas.users import UserResponse, UserCreate

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
async def read_users():
    # Mock data
    return [{"id": 1, "username": "admin", "email": "admin@example.com"}]

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate):
    return {"id": 2, "username": user.username, "email": user.email}