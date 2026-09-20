from pydantic import BaseModel
from typing import Optional


class RecognitionRequest(BaseModel):
    persona_id: Optional[int] = None
    similitud: float
    distancia: Optional[float] = None
    umbral: float
    coincide: bool
    probabilidad_calibrada: Optional[float] = None


class RecognitionResponse(RecognitionRequest):
    id: int

    class Config:
        from_attributes = True
        