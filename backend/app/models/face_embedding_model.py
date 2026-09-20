from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, LargeBinary
from sqlalchemy.sql import func

from app.database.connection import Base


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True, index=True)

    persona_id = Column(
        Integer,
        ForeignKey("personas.id"),
        nullable=False
    )

    embedding = Column(
        LargeBinary,
        nullable=False
    )

    modelo = Column(
        String(100),
        nullable=False,
        default="buffalo_l"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )