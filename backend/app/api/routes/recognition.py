from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

import cv2
import numpy as np

from app.database.connection import get_db
from app.core.config import settings
from app.core.security import obtener_usuario_actual

from app.models.persona_model import Persona
from app.models.recognition_model import RecognitionLog
from app.models.usuario_model import Usuario

from app.services.embedding_service import EmbeddingService
from app.services.face_embedding_service import FaceEmbeddingService
from app.services.similarity_service import SimilarityService
from app.services.probability_service import ProbabilityService


router = APIRouter(
    prefix="/api/reconocimiento",
    tags=["Reconocimiento"]
)

embedding_service = EmbeddingService()
face_embedding_service = FaceEmbeddingService()
probability_service = ProbabilityService()


@router.post("")
async def reconocer_rostro(
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):

    # =========================================================
    # 1. LEER IMAGEN
    # =========================================================

    contenido = await imagen.read()

    if not contenido:
        raise HTTPException(
            status_code=400,
            detail="La imagen está vacía."
        )

    # =========================================================
    # 2. CONVERTIR IMAGEN
    # =========================================================

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

    # =========================================================
    # 3. OBTENER EMBEDDING FACIAL
    # =========================================================

    embedding = (
        embedding_service.obtener_embedding(
            imagen_cv
        )
    )

    if embedding is None:

        return {
            "success": False,
            "mensaje": (
                "No se detectó ningún rostro."
            ),
            "rostro_detectado": False,
            "coincide": False,
            "probabilidad_calibrada": None
        }

    # =========================================================
    # 4. BUSCAR MEJOR COINCIDENCIA
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
    # 5. SIMILITUD Y UMBRAL
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
    # 6. PROBABILIDAD CALIBRADA
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
    # 7. OBTENER PERSONA
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
    # 8. DISTANCIA
    # =========================================================

    distancia = 1 - similitud

    # =========================================================
    # 9. GUARDAR HISTORIAL
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
    # 10. RESPUESTA
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