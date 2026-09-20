from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)

from sqlalchemy.orm import Session

import cv2
import numpy as np

from app.database.connection import get_db
from app.core.security import obtener_usuario_actual

from app.models.face_embedding_model import FaceEmbedding
from app.models.persona_model import Persona
from app.models.usuario_model import Usuario

from app.services.embedding_service import EmbeddingService
from app.services.face_embedding_service import FaceEmbeddingService


router = APIRouter(
    prefix="/api/personas",
    tags=["Registro Facial"]
)


embedding_service = EmbeddingService()
face_embedding_service = FaceEmbeddingService()

MAX_EMBEDDINGS_POR_PERSONA = 5


@router.post("/{persona_id}/rostro")
async def registrar_rostro(
    persona_id: int,
    imagen: UploadFile = File(...),
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

    # Leer imagen
    contenido = await imagen.read()

    if not contenido:
        raise HTTPException(
            status_code=400,
            detail="La imagen está vacía."
        )

    datos_imagen = np.frombuffer(
        contenido,
        dtype=np.uint8
    )

    imagen_cv = cv2.imdecode(
        datos_imagen,
        cv2.IMREAD_COLOR
    )

    if imagen_cv is None:
        raise HTTPException(
            status_code=400,
            detail="No se pudo procesar la imagen."
        )

    # Generar embedding
    embedding = embedding_service.obtener_embedding(
        imagen_cv
    )

    if embedding is None:
        raise HTTPException(
            status_code=400,
            detail="No se detectó ningún rostro."
        )

    # Guardar representación facial
    registro = face_embedding_service.guardar_embedding(
        db=db,
        persona_id=persona_id,
        embedding=embedding
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