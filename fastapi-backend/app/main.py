from fastapi import FastAPI
from app.core.config import settings
from app.api.router import api_router

# Import Base và engine từ database
from app.db.database import Base, engine
# Import các models để Base nhận diện được trước khi tạo bảng
from app.models import user 
from app.models import User, Group, Document

# Lệnh này sẽ tạo các bảng trong DB (Trong thực tế thường dùng Alembic để migrate DB)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Template with PostgreSQL"}