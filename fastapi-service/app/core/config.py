import os
from pydantic_settings import BaseSettings

# Resolve .env relative to this file's location (fastapi-service/.env)
_ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "My FastAPI App"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    class Config:
        env_file = _ENV_FILE

settings = Settings()