from fastapi import (
    APIRouter,
    HTTPException,
    Depends
)

from sqlalchemy.orm import Session

import numpy as np

from app.database.connection import get_db
from app.core.security import obtener_usuario_actual

from app.models.face_embedding_model import FaceEmbedding
from app.models.persona_model import Persona
from app.models.usuario_model import Usuario

from app.schemas.face_embedding_schema import EmbeddingRequest

from app.services.face_embedding_service import FaceEmbeddingService


router = APIRouter(
    prefix="/api/personas",
    tags=["Registro Facial"]
)


face_embedding_service = FaceEmbeddingService()

MAX_EMBEDDINGS_POR_PERSONA = 5


@router.post("/{persona_id}/rostro")
def registrar_rostro(
    persona_id: int,
    datos_entrada: EmbeddingRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    # Verificar que la persona exista
    persona = (
        db.query(Persona)
        .filter(Persona.id == persona_id)
        .first()
    )

    if persona is None:
        raise HTTPException(
            status_code=404,
            detail="La persona no existe."
        )

    # Contar representaciones actuales
    total_actual = (
        db.query(FaceEmbedding)
        .filter(
            FaceEmbedding.persona_id == persona_id
        )
        .count()
    )

    # Evitar acumulación excesiva
    if total_actual >= MAX_EMBEDDINGS_POR_PERSONA:
        raise HTTPException(
            status_code=400,
            detail=(
                f"La persona ya tiene "
                f"{MAX_EMBEDDINGS_POR_PERSONA} "
                f"representaciones faciales registradas."
            )
        )

    # El vector facial llega ya calculado desde el navegador
    # (face-api.js). EmbeddingRequest valida la dimensión.
    embedding = np.array(
        datos_entrada.embedding,
        dtype=np.float32
    )

    # Guardar representación facial
    registro = face_embedding_service.guardar_embedding(
        db=db,
        persona_id=persona_id,
        embedding=embedding,
        modelo=datos_entrada.modelo
    )

    total_nuevo = total_actual + 1

    return {
        "mensaje": "Rostro registrado correctamente.",
        "persona_id": persona_id,
        "persona_nombre": persona.nombre,
        "embedding_id": registro.id,
        "modelo": registro.modelo,
        "representaciones_actuales": total_nuevo,
        "maximo_representaciones": MAX_EMBEDDINGS_POR_PERSONA
    }


@router.get("/rostros/total")
def total_rostros(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    total = db.query(FaceEmbedding).count()

    return {
        "total": total
    }


@router.get("/{persona_id}/rostros")
def rostros_de_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    persona = (
        db.query(Persona)
        .filter(Persona.id == persona_id)
        .first()
    )

    if persona is None:
        raise HTTPException(
            status_code=404,
            detail="La persona no existe."
        )

    total = (
        db.query(FaceEmbedding)
        .filter(
            FaceEmbedding.persona_id == persona_id
        )
        .count()
    )

    return {
        "persona_id": persona_id,
        "persona_nombre": persona.nombre,
        "total": total,
        "maximo": MAX_EMBEDDINGS_POR_PERSONA
    }