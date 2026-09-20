from typing import List

from pydantic import BaseModel, Field, field_validator


# Dimensión del vector que produce face-api.js en el navegador.
DIMENSION_EMBEDDING = 128

# Nombre del modelo que genera los vectores.
NOMBRE_MODELO = "face-api-128"


class FaceEmbeddingCreate(BaseModel):
    persona_id: int
    modelo: str = NOMBRE_MODELO


class EmbeddingRequest(BaseModel):
    """
    Cuerpo que envía el frontend.

    El vector facial se calcula en el navegador con face-api.js,
    así que aquí solo llega la lista de números, nunca la imagen.
    """

    embedding: List[float] = Field(
        ...,
        description=(
            "Vector facial de "
            f"{DIMENSION_EMBEDDING} dimensiones "
            "generado en el navegador."
        )
    )

    modelo: str = Field(
        default=NOMBRE_MODELO,
        description="Modelo que generó el vector."
    )

    @field_validator("embedding")
    @classmethod
    def validar_dimension(
        cls,
        valor: List[float]
    ) -> List[float]:

        if len(valor) != DIMENSION_EMBEDDING:
            raise ValueError(
                f"El vector facial debe tener "
                f"{DIMENSION_EMBEDDING} dimensiones, "
                f"se recibieron {len(valor)}."
            )

        # Un vector de puros ceros no tiene norma y rompería
        # el cálculo de similitud coseno.
        if not any(valor):
            raise ValueError(
                "El vector facial está vacío o es inválido."
            )

        return valor
