from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.connection import Base


class RecognitionLog(Base):
    __tablename__ = "recognition_logs"

    id = Column(Integer, primary_key=True, index=True)

    persona_id = Column(
        Integer,
        ForeignKey("personas.id"),
        nullable=True
    )

    similitud = Column(Float, nullable=False)
    distancia = Column(Float, nullable=True)
    umbral = Column(Float, nullable=False)
    coincide = Column(Boolean, nullable=False)
    probabilidad_calibrada = Column(Float, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )