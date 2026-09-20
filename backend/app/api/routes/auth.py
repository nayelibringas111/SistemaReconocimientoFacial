from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import bcrypt

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


# ============================================================
# ESQUEMA PARA REGISTRO
# ============================================================

class RegistroUsuarioRequest(BaseModel):
    nombre: str
    email: EmailStr
    password: str


# ============================================================
# FUNCIONES DE CONTRASEÑA
# ============================================================

def generar_password_hash(password: str) -> str:
    """
    Genera un hash bcrypt compatible con los usuarios
    almacenados actualmente en la base de datos.
    """

    password_bytes = password.encode("utf-8")

    # bcrypt permite como máximo 72 bytes
    if len(password_bytes) > 72:
        raise HTTPException(
            status_code=400,
            detail=(
                "La contraseña no puede superar "
                "los 72 bytes."
            )
        )

    password_hash = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return password_hash.decode("utf-8")


def verificar_password(
    password: str,
    password_hash: str
) -> bool:
    """
    Verifica una contraseña contra un hash bcrypt.
    """

    password_bytes = password.encode("utf-8")

    # bcrypt tiene un límite de 72 bytes
    if len(password_bytes) > 72:
        return False

    try:
        return bcrypt.checkpw(
            password_bytes,
            password_hash.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


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

    # --------------------------------------------------------
    # Verificar contraseña
    # --------------------------------------------------------

    if not verificar_password(
        datos.password,
        usuario.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Correo o contraseña incorrectos."
            )
        )

    # --------------------------------------------------------
    # Crear token JWT
    # --------------------------------------------------------

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

    if len(password.encode("utf-8")) > 72:

        raise HTTPException(
            status_code=400,
            detail=(
                "La contraseña no puede superar "
                "los 72 bytes."
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

    password_hash = generar_password_hash(
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