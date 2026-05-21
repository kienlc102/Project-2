from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "My FastAPI App"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    GOOGLE_API: str

    class Config:
        env_file = ".env"

settings = Settings()