from pydantic import BaseModel


class FaceEmbeddingCreate(BaseModel):
    persona_id: int
    modelo: str = "buffalo_l"