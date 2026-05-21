# fastapi-service

Đây là FastAPI backend service — phiên bản cải tiến, tách ra khỏi `fastapi-backend/` (do người khác quản lý).

## Khác biệt so với fastapi-backend/

| Tính năng | fastapi-backend | fastapi-service |
|-----------|----------------|-----------------|
| Quiz/GenAI FastAPI | Có (do main thêm) | Không (dùng Node.js quiz-service port 5003) |
| Embedding (asyncio) | Không | Có — không block event loop |
| SentenceTransformer cache | Global var | `@lru_cache` — load 1 lần |
| App lifespan preload | Không | Có — preload model lúc khởi động |
| NeonDB SSL | Không | Có — tự phát hiện |
| Config keys | `GOOGLE_API` | `GEMINI_API_KEY` + `GROQ_API_KEY` |
| run_server.py | Không | Có — tránh lỗi port Windows |

## Cài đặt

```bash
# 1. Tạo .env từ template
cp .env.example .env
# Điền DATABASE_URL, GEMINI_API_KEY, GROQ_API_KEY vào .env

# 2. Dùng lại venv từ fastapi-backend (tránh cài lại packages)
# Windows PowerShell:
..\fastapi-backend\.venv\Scripts\activate

# 3. Chạy service (port 8000)
python run.py

# Hoặc dùng run_server.py (tránh lỗi zombie socket trên Windows):
python run_server.py
```

## Ports

| Service | Port |
|---------|------|
| fastapi-service | **8000** |

## API Endpoints

- `GET /api/v1/document/universities` — danh sách trường
- `POST /api/v1/document/upload` — upload tài liệu
- `GET /api/v1/subject/...` — thông tin môn học
- `GET/POST /api/v1/users/...` — người dùng
