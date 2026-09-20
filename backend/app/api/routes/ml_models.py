from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import numpy as np

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)

from app.database.connection import get_db, engine, SessionLocal
from app.models.recognition_model import RecognitionLog
from app.models.ml_training_record_model import MLTrainingRecord
from app.models.usuario_model import Usuario
from app.services.probability_service import ProbabilityService
from app.core.security import obtener_usuario_actual


router = APIRouter(
    prefix="/api/modelos",
    tags=["Modelos ML"]
)


probability_service = ProbabilityService()


# ============================================================
# CREAR TABLA DE ENTRENAMIENTO SI NO EXISTE
# ============================================================

MLTrainingRecord.__table__.create(
    bind=engine,
    checkfirst=True
)


# ============================================================
# DATOS DEMOSTRATIVOS INICIALES
# ============================================================

SIMILITUDES_INICIALES = [
    0.20,
    0.30,
    0.40,
    0.50,
    0.60,
    0.70,
    0.75,
    0.80,
    0.85,
    0.90,
    0.95
]


RESULTADOS_INICIALES = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1
]


# ============================================================
# ESTADO DEL MODELO
# ============================================================

modelo_entrenado = False


metricas_modelo = {
    "accuracy": None,
    "precision": None,
    "recall": None,
    "f1_score": None,
    "total_registros": 0
}


# ============================================================
# CALCULAR MÉTRICAS
# ============================================================

def calcular_metricas(
    similitudes,
    resultados
):
    probabilidades = []
    predicciones = []

    for similitud in similitudes:

        probabilidad = probability_service.predecir(
            float(similitud)
        )

        probabilidades.append(
            probabilidad
        )

        predicciones.append(
            1 if probabilidad >= 0.5 else 0
        )

    y_real = np.array(
        resultados,
        dtype=int
    )

    y_pred = np.array(
        predicciones,
        dtype=int
    )

    accuracy = accuracy_score(
        y_real,
        y_pred
    )

    precision = precision_score(
        y_real,
        y_pred,
        zero_division=0
    )

    recall = recall_score(
        y_real,
        y_pred,
        zero_division=0
    )

    f1 = f1_score(
        y_real,
        y_pred,
        zero_division=0
    )

    return {
        "accuracy": round(
            float(accuracy),
            4
        ),
        "precision": round(
            float(precision),
            4
        ),
        "recall": round(
            float(recall),
            4
        ),
        "f1_score": round(
            float(f1),
            4
        ),
        "total_registros": len(
            similitudes
        )
    }


# ============================================================
# CARGAR MODELO DESDE POSTGRESQL
# ============================================================

def inicializar_modelo_desde_bd():

    global modelo_entrenado
    global metricas_modelo

    db = SessionLocal()

    try:

        registros = (
            db.query(RecognitionLog)
            .filter(
                RecognitionLog.similitud.isnot(None),
                RecognitionLog.coincide.isnot(None)
            )
            .order_by(
                RecognitionLog.created_at.asc()
            )
            .all()
        )

        similitudes = []
        resultados = []

        for registro in registros:

            similitudes.append(
                float(
                    registro.similitud
                )
            )

            resultados.append(
                1
                if registro.coincide
                else 0
            )

        # ----------------------------------------------------
        # No hay suficientes datos todavía
        # ----------------------------------------------------

        if len(similitudes) < 4:

            print(
                "ℹ️ Modelo ML: todavía no hay "
                "suficientes registros para reconstruirlo."
            )

            modelo_entrenado = False

            metricas_modelo = {
                "accuracy": None,
                "precision": None,
                "recall": None,
                "f1_score": None,
                "total_registros": len(
                    similitudes
                )
            }

            return

        # ----------------------------------------------------
        # Deben existir ambas clases
        # ----------------------------------------------------

        if len(set(resultados)) < 2:

            print(
                "ℹ️ Modelo ML: se necesitan "
                "coincidencias y no coincidencias."
            )

            modelo_entrenado = False

            metricas_modelo = {
                "accuracy": None,
                "precision": None,
                "recall": None,
                "f1_score": None,
                "total_registros": len(
                    similitudes
                )
            }

            return

        # ----------------------------------------------------
        # Reconstruir el modelo calibrado
        # ----------------------------------------------------

        probability_service.entrenar(
            similitudes,
            resultados
        )

        # ----------------------------------------------------
        # Calcular métricas nuevamente
        # ----------------------------------------------------

        metricas_modelo = calcular_metricas(
            similitudes,
            resultados
        )

        modelo_entrenado = True

        print(
            "✅ Modelo ML reconstruido correctamente "
            "desde PostgreSQL."
        )

        print(
            f"   Registros: {len(similitudes)}"
        )

        print(
            f"   Accuracy: "
            f"{metricas_modelo['accuracy']}"
        )

        print(
            f"   Precision: "
            f"{metricas_modelo['precision']}"
        )

        print(
            f"   Recall: "
            f"{metricas_modelo['recall']}"
        )

        print(
            f"   F1-score: "
            f"{metricas_modelo['f1_score']}"
        )

    except Exception as error:

        modelo_entrenado = False

        print(
            "⚠️ No se pudo reconstruir "
            f"el modelo ML: {error}"
        )

    finally:

        db.close()


# ============================================================
# ENTRENAR MODELO
# ============================================================

@router.post("/entrenar")
def entrenar_modelo(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        obtener_usuario_actual
    )
):

    global modelo_entrenado
    global metricas_modelo

    registros = (
        db.query(RecognitionLog)
        .filter(
            RecognitionLog.coincide.isnot(None)
        )
        .all()
    )

    similitudes = []
    resultados = []

    for registro in registros:

        if registro.similitud is not None:

            similitudes.append(
                float(
                    registro.similitud
                )
            )

            resultados.append(
                1
                if registro.coincide
                else 0
            )

    datos_demostrativos = False

    # --------------------------------------------------------
    # Si todavía no existen suficientes registros
    # --------------------------------------------------------

    if len(similitudes) < 4:

        similitudes = (
            SIMILITUDES_INICIALES.copy()
        )

        resultados = (
            RESULTADOS_INICIALES.copy()
        )

        datos_demostrativos = True

    # --------------------------------------------------------
    # Verificar ambas clases
    # --------------------------------------------------------

    if len(set(resultados)) < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "El entrenamiento necesita "
                "ejemplos de coincidencia "
                "y no coincidencia."
            )
        )

    try:

        # ----------------------------------------------------
        # Entrenamiento real + calibración Sigmoid
        # ----------------------------------------------------

        probability_service.entrenar(
            similitudes,
            resultados
        )

        # ----------------------------------------------------
        # Calcular métricas
        # ----------------------------------------------------

        metricas_modelo = calcular_metricas(
            similitudes,
            resultados
        )

        # ----------------------------------------------------
        # Guardar registros de entrenamiento
        # ----------------------------------------------------

        registros_guardados = 0

        for similitud, resultado in zip(
            similitudes,
            resultados
        ):

            registro_entrenamiento = (
                MLTrainingRecord(
                    similitud=float(
                        similitud
                    ),
                    calidad_imagen=None,
                    iluminacion=None,
                    resultado_real=bool(
                        resultado
                    )
                )
            )

            db.add(
                registro_entrenamiento
            )

            registros_guardados += 1

        db.commit()

        modelo_entrenado = True

        return {

            "success": True,

            "mensaje": (
                "Modelo entrenado y "
                "probabilidades calibradas "
                "correctamente."
            ),

            "modelo_entrenado": True,

            "probabilidades_calibradas": True,

            "metodo_calibracion": "sigmoid",

            "datos_demostrativos": (
                datos_demostrativos
            ),

            "metricas": metricas_modelo,

            "registros_utilizados": (
                len(similitudes)
            ),

            "registros_guardados": (
                registros_guardados
            )
        }

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ============================================================
# OBTENER MÉTRICAS
# ============================================================

@router.get("/metricas")
def obtener_metricas(
    usuario: Usuario = Depends(
        obtener_usuario_actual
    )
):

    return {

        "success": True,

        "modelo_entrenado": (
            modelo_entrenado
        ),

        "probabilidades_calibradas": (
            modelo_entrenado
        ),

        "metodo_calibracion": (
            "sigmoid"
            if modelo_entrenado
            else None
        ),

        "metricas": metricas_modelo
    }