import os

from dotenv import load_dotenv


load_dotenv()


class Settings:

    APP_NAME: str = os.getenv(
        "APP_NAME",
        "Sistema Inteligente de Reconocimiento Facial"
    )

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/reconocimiento_facial"
    )

    FACE_THRESHOLD: float = float(
        os.getenv(
            "FACE_THRESHOLD",
            "0.75"
        )
    )

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "clave-secreta-desarrollo"
    )


settings = Settings()