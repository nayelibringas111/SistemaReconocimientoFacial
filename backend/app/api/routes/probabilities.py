from fastapi import APIRouter, HTTPException, Depends

from app.schemas.probability_schema import (
    ProbabilityRequest,
    ProbabilityResponse
)

from app.services.probability_service import (
    ProbabilityService
)

from app.core.security import (
    obtener_usuario_actual
)

from app.models.usuario_model import Usuario


router = APIRouter(
    prefix="/api/probabilidades",
    tags=["Probabilidades"]
)

probability_service = ProbabilityService()


@router.post(
    "/prediccion",
    response_model=ProbabilityResponse
)
def predecir_probabilidad(
    datos: ProbabilityRequest,
    usuario: Usuario = Depends(
        obtener_usuario_actual
    )
):

    try:

        probabilidad = (
            probability_service.predecir(
                datos.similitud
            )
        )

        return {
            "similitud": datos.similitud,
            "probabilidad": probabilidad
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )