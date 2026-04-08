from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router

# Import Base và engine từ database
from app.db.database import Base, engine
# Import các models để Base nhận diện được trước khi tạo bảng
# CÁCH IMPORT MỚI ĐÚNG CHUẨN
from app.models.user import User
from app.models.group import Group # Thay đổi tên file tương ứng nếu của bạn khác
from app.models.document import Document, DocumentChunk, DocumentMetadata
from app.models.university import University
from app.models.subject import Subject
# Lệnh này sẽ tạo các bảng trong DB (Trong thực tế thường dùng Alembic để migrate DB)
Base.metadata.create_all(bind=engine)



app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Template with PostgreSQL"}