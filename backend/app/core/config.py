import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema Reconocimiento Facial"
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")  # <- Esta es la línea que falta

    # Clave para firmar los tokens JWT (la usa app/core/security.py).
    # En Render debe definirse como variable de entorno SECRET_KEY.
    # Generar una con: python -c "import secrets; print(secrets.token_urlsafe(48))"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")

    # Umbral de similitud para aceptar una coincidencia facial
    # (la usa app/api/routes/recognition.py). Rango 0.0 - 1.0.
    #
    # La similitud se deriva de la distancia euclidiana entre los
    # vectores de face-api.js:
    #
    #     similitud = 1 - distancia / 1.2
    #
    # Equivalencias:
    #     similitud 0.50  <->  distancia 0.60  (umbral clásico de dlib)
    #     similitud 0.58  <->  distancia 0.50
    #     similitud 0.62  <->  distancia 0.45
    #
    # Medido con fotos reales sobre este mismo modelo:
    #     misma persona       -> similitud 0.86 - 0.96
    #     personas distintas  -> similitud 0.39 - 0.58
    #
    # El par de personas distintas más parecido dio 0.581, por eso el
    # umbral clásico (0.50) produce falsos positivos y NO se usa aquí.
    #
    #   0.68 -> muy estricto (rechazará algunas caras válidas)
    #   0.62 -> equilibrado  (valor por defecto, recomendado)
    #   0.50 -> permisivo    (umbral clásico: confunde caras parecidas)
    #
    # IMPORTANTE: calíbralo con las caras reales de tu sistema.
    # Registra varias personas, prueba reconocimientos y revisa el
    # historial: si hay confusiones, sube el valor; si rechaza a gente
    # válida, bájalo. Se ajusta con la variable de entorno
    # FACE_THRESHOLD, sin tocar el código.
    FACE_THRESHOLD: float = float(os.getenv("FACE_THRESHOLD", "0.62"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()