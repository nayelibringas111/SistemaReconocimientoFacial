import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema Reconocimiento Facial"
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")  # <- Esta es la línea que falta

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()