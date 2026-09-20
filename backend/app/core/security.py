from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.models.usuario_model import Usuario


ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()


def crear_token_acceso(
    data: dict,
    minutos_expiracion: Optional[int] = None
) -> str:

    datos = data.copy()

    if minutos_expiracion is not None:
        tiempo_expiracion = timedelta(
            minutes=minutos_expiracion
        )
    else:
        tiempo_expiracion = timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    fecha_expiracion = (
        datetime.now(timezone.utc)
        + tiempo_expiracion
    )

    datos.update({
        "exp": fecha_expiracion
    })

    token = jwt.encode(
        datos,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


def verificar_token(
    token: str
) -> Optional[dict]:

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        return None


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db)
) -> Usuario:

    token = credenciales.credentials

    payload = verificar_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    usuario_id = payload.get("sub")

    if usuario_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    try:
        usuario_id = int(usuario_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identificador de usuario inválido.",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id == usuario_id
        )
        .first()
    )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario está desactivado."
        )

    return usuario


def exigir_rol(
    *roles_permitidos: str
):
    def dependencia(
        usuario: Usuario = Depends(
            obtener_usuario_actual
        )
    ) -> Usuario:

        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción."
            )

        return usuario

    return dependencia