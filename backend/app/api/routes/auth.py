from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from app.database.connection import get_db
from app.models.usuario_model import Usuario
from app.schemas.auth_schema import (
    LoginRequest,
    LoginResponse,
    UsuarioResponse
)
from app.core.security import (
    crear_token_acceso,
    obtener_usuario_actual
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Autenticación"]
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ============================================================
# ESQUEMA PARA REGISTRO
# ============================================================

class RegistroUsuarioRequest(BaseModel):
    nombre: str
    email: EmailStr
    password: str


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=LoginResponse
)
def login(
    datos: LoginRequest,
    db: Session = Depends(get_db)
):

    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.email == datos.email
        )
        .first()
    )

    if usuario is None:

        raise HTTPException(
            status_code=401,
            detail=(
                "Correo o contraseña incorrectos."
            )
        )

    if not usuario.activo:

        raise HTTPException(
            status_code=403,
            detail=(
                "El usuario está desactivado."
            )
        )

    if not pwd_context.verify(
        datos.password,
        usuario.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Correo o contraseña incorrectos."
            )
        )

    token = crear_token_acceso(
        {
            "sub": str(usuario.id),
            "email": usuario.email,
            "rol": usuario.rol
        }
    )

    return {
        "success": True,
        "mensaje": (
            "Inicio de sesión correcto."
        ),
        "token": token,
        "usuario": usuario
    }


# ============================================================
# REGISTRO DE USUARIO
# REGISTRO PÚBLICO
# EL USUARIO NUEVO SIEMPRE SERÁ OPERADOR
# ============================================================

@router.post(
    "/registro",
    response_model=UsuarioResponse
)
def registrar_usuario(
    datos: RegistroUsuarioRequest,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Limpiar datos
    # --------------------------------------------------------

    nombre = datos.nombre.strip()
    email = datos.email.strip().lower()
    password = datos.password

    # --------------------------------------------------------
    # Validar nombre
    # --------------------------------------------------------

    if len(nombre) < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "El nombre debe tener "
                "al menos 2 caracteres."
            )
        )

    # --------------------------------------------------------
    # Validar contraseña
    # --------------------------------------------------------

    if len(password) < 8:

        raise HTTPException(
            status_code=400,
            detail=(
                "La contraseña debe tener "
                "al menos 8 caracteres."
            )
        )

    # --------------------------------------------------------
    # Verificar correo existente
    # --------------------------------------------------------

    usuario_existente = (
        db.query(Usuario)
        .filter(
            Usuario.email == email
        )
        .first()
    )

    if usuario_existente is not None:

        raise HTTPException(
            status_code=400,
            detail=(
                "Ya existe una cuenta "
                "con ese correo."
            )
        )

    # --------------------------------------------------------
    # Crear contraseña segura
    # --------------------------------------------------------

    password_hash = pwd_context.hash(
        password
    )

    # --------------------------------------------------------
    # Crear nuevo usuario
    # --------------------------------------------------------
    # Los registros públicos siempre
    # empiezan como operador.

    nuevo_usuario = Usuario(
        nombre=nombre,
        email=email,
        password_hash=password_hash,
        rol="operador",
        activo=True
    )

    db.add(
        nuevo_usuario
    )

    db.commit()

    db.refresh(
        nuevo_usuario
    )

    return nuevo_usuario


# ============================================================
# USUARIO ACTUAL
# ============================================================

@router.get(
    "/me",
    response_model=UsuarioResponse
)
def usuario_actual(
    usuario: Usuario = Depends(
        obtener_usuario_actual
    )
):

    return usuario