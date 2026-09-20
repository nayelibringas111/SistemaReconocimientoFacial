from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

import numpy as np

from app.database.connection import get_db
from app.core.config import settings
from app.core.security import obtener_usuario_actual

from app.models.persona_model import Persona
from app.models.recognition_model import RecognitionLog
from app.models.usuario_model import Usuario

from app.schemas.face_embedding_schema import EmbeddingRequest

from app.services.face_embedding_service import FaceEmbeddingService
from app.services.similarity_service import SimilarityService
from app.services.probability_service import ProbabilityService


router = APIRouter(
    prefix="/api/reconocimiento",
    tags=["Reconocimiento"]
)

face_embedding_service = FaceEmbeddingService()
probability_service = ProbabilityService()


@router.post("")
def reconocer_rostro(
    datos_entrada: EmbeddingRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):

    # =========================================================
    # 1. RECIBIR EL VECTOR FACIAL
    # =========================================================
    # El rostro se detecta y se convierte en vector en el
    # navegador (face-api.js). Aquí solo llega la lista de
    # números, ya validada por EmbeddingRequest.
    # =========================================================

    embedding = np.array(
        datos_entrada.embedding,
        dtype=np.float32
    )

    # =========================================================
    # 2. BUSCAR MEJOR COINCIDENCIA
    # =========================================================

    mejor_coincidencia = (
        face_embedding_service
        .buscar_mejor_coincidencia(
            db=db,
            embedding_nuevo=embedding
        )
    )

    if mejor_coincidencia is None:

        return {
            "success": False,
            "mensaje": (
                "No existen rostros registrados "
                "para comparar."
            ),
            "rostro_detectado": True,
            "coincide": False,
            "probabilidad_calibrada": None
        }

    # =========================================================
    # 3. SIMILITUD Y UMBRAL
    # =========================================================

    similitud = float(
        mejor_coincidencia["similitud"]
    )

    umbral = float(
        settings.FACE_THRESHOLD
    )

    coincide = (
        SimilarityService.es_coincidencia(
            similitud,
            umbral
        )
    )

    # =========================================================
    # 4. PROBABILIDAD CALIBRADA
    # =========================================================

    try:

        probabilidad_calibrada = (
            probability_service.predecir(
                similitud
            )
        )

    except ValueError:

        # Si todavía no se entrenó el modelo,
        # no inventamos una probabilidad.
        probabilidad_calibrada = None

    # =========================================================
    # 5. OBTENER PERSONA
    # =========================================================

    persona_id = None
    persona_nombre = None

    if coincide:

        persona_id = (
            mejor_coincidencia["persona_id"]
        )

        persona = (
            db.query(Persona)
            .filter(
                Persona.id == persona_id
            )
            .first()
        )

        if persona:

            persona_nombre = (
                persona.nombre
            )

    # =========================================================
    # 6. DISTANCIA
    # =========================================================
    # Distancia euclidiana real entre los dos vectores faciales
    # (la métrica con la que face-api.js está calibrado).

    distancia = float(
        mejor_coincidencia["distancia"]
    )

    # =========================================================
    # 7. GUARDAR HISTORIAL
    # =========================================================

    registro_historial = RecognitionLog(
        persona_id=persona_id,
        similitud=similitud,
        distancia=distancia,
        umbral=umbral,
        coincide=coincide,
        probabilidad_calibrada=(
            probabilidad_calibrada
        )
    )

    db.add(
        registro_historial
    )

    db.commit()

    db.refresh(
        registro_historial
    )

    # =========================================================
    # 8. RESPUESTA
    # =========================================================

    return {

        "success": True,

        "mensaje": (
            "Rostro reconocido."
            if coincide
            else
            "No se encontró una "
            "coincidencia suficiente."
        ),

        "rostro_detectado": True,

        "persona_id": persona_id,

        "persona_nombre": persona_nombre,

        "similitud": similitud,

        "distancia": distancia,

        "umbral": umbral,

        "coincide": coincide,

        "probabilidad_calibrada": (
            probabilidad_calibrada
        ),

        "historial_id": (
            registro_historial.id
        ),

        "resultado": {

            "persona_id": persona_id,

            "nombre": persona_nombre,

            "similitud": similitud,

            "distancia": distancia,

            "umbral": umbral,

            "coincide": coincide,

            "probabilidad_calibrada": (
                probabilidad_calibrada
            )
        }
    }


@router.get("/historial")
def historial_reconocimiento(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        obtener_usuario_actual
    )
):

    registros = (
        db.query(
            RecognitionLog,
            Persona
        )
        .outerjoin(
            Persona,
            RecognitionLog.persona_id
            == Persona.id
        )
        .order_by(
            RecognitionLog.created_at.desc()
        )
        .all()
    )

    resultados = []

    for registro, persona in registros:

        resultados.append({

            "id": registro.id,

            "persona_id": (
                registro.persona_id
            ),

            "persona_nombre": (
                persona.nombre
                if persona
                else None
            ),

            "similitud": (
                registro.similitud
            ),

            "distancia": (
                registro.distancia
            ),

            "umbral": (
                registro.umbral
            ),

            "coincide": (
                registro.coincide
            ),

            "probabilidad_calibrada": (
                registro.probabilidad_calibrada
            ),

            "created_at": (
                registro.created_at
            )
        })

    return {
        "total": len(resultados),
        "resultados": resultados
    }