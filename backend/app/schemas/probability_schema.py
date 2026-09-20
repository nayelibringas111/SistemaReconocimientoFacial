from pydantic import BaseModel, Field


class ProbabilityRequest(BaseModel):
    similitud: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Valor de similitud entre 0 y 1."
    )


class ProbabilityResponse(BaseModel):
    similitud: float
    probabilidad: float