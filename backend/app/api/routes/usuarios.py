from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database.connection import get_db
from app.models.usuario_model import Usuario
from app.core.security import exigir_rol
from app.schemas.auth_schema import UsuarioResponse


router = APIRouter(
    prefix="/api/usuarios",
    tags=["Usuarios"]
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ============================================================
# LISTAR USUARIOS
# SOLO ADMINISTRADOR
# ============================================================

@router.get(
    "",
    response_model=list[UsuarioResponse]
)
def listar_usuarios(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        exigir_rol("administrador")
    )
):

    usuarios = (
        db.query(Usuario)
        .order_by(
            Usuario.id.asc()
        )
        .all()
    )

    return usuarios


# ============================================================
# CREAR USUARIO
# SOLO ADMINISTRADOR
# ============================================================

@router.post(
    "",
    response_model=UsuarioResponse
)
def crear_usuario(
    nombre: str,
    email: str,
    password: str,
    rol: str = "operador",
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        exigir_rol("administrador")
    )
):

    # --------------------------------------------------------
    # Validar rol
    # --------------------------------------------------------

    roles_validos = [
        "administrador",
        "operador"
    ]

    if rol not in roles_validos:

        raise HTTPException(
            status_code=400,
            detail=(
                "El rol debe ser "
                "'administrador' u 'operador'."
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
                "Ya existe un usuario "
                "con ese correo."
            )
        )

    # --------------------------------------------------------
    # Crear usuario
    # --------------------------------------------------------

    password_hash = pwd_context.hash(
        password
    )

    nuevo_usuario = Usuario(
        nombre=nombre,
        email=email,
        password_hash=password_hash,
        rol=rol,
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
# ACTUALIZAR USUARIO
# SOLO ADMINISTRADOR
# ============================================================

@router.put(
    "/{usuario_id}",
    response_model=UsuarioResponse
)
def actualizar_usuario(
    usuario_id: int,
    nombre: str | None = None,
    email: str | None = None,
    password: str | None = None,
    rol: str | None = None,
    activo: bool | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        exigir_rol("administrador")
    )
):

    usuario_objetivo = (
        db.query(Usuario)
        .filter(
            Usuario.id == usuario_id
        )
        .first()
    )

    if usuario_objetivo is None:

        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado."
        )

    # --------------------------------------------------------
    # Validar rol
    # --------------------------------------------------------

    if rol is not None:

        roles_validos = [
            "administrador",
            "operador"
        ]

        if rol not in roles_validos:

            raise HTTPException(
                status_code=400,
                detail=(
                    "El rol debe ser "
                    "'administrador' u 'operador'."
                )
            )

        usuario_objetivo.rol = rol

    # --------------------------------------------------------
    # Actualizar nombre
    # --------------------------------------------------------

    if nombre is not None:
        usuario_objetivo.nombre = nombre

    # --------------------------------------------------------
    # Actualizar correo
    # --------------------------------------------------------

    if email is not None:

        otro_usuario = (
            db.query(Usuario)
            .filter(
                Usuario.email == email,
                Usuario.id != usuario_id
            )
            .first()
        )

        if otro_usuario is not None:

            raise HTTPException(
                status_code=400,
                detail=(
                    "El correo ya está "
                    "siendo utilizado."
                )
            )

        usuario_objetivo.email = email

    # --------------------------------------------------------
    # Actualizar contraseña
    # --------------------------------------------------------

    if password is not None:

        usuario_objetivo.password_hash = (
            pwd_context.hash(
                password
            )
        )

    # --------------------------------------------------------
    # Activar / desactivar
    # --------------------------------------------------------

    if activo is not None:

        # Evitar que un administrador
        # se desactive accidentalmente
        if (
            usuario_objetivo.id
            == usuario.id
            and activo is False
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "No puedes desactivar "
                    "tu propio usuario."
                )
            )

        usuario_objetivo.activo = activo

    db.commit()

    db.refresh(
        usuario_objetivo
    )

    return usuario_objetivo


# ============================================================
# DESACTIVAR USUARIO
# SOLO ADMINISTRADOR
# ============================================================

@router.delete(
    "/{usuario_id}"
)
def desactivar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(
        exigir_rol("administrador")
    )
):

    usuario_objetivo = (
        db.query(Usuario)
        .filter(
            Usuario.id == usuario_id
        )
        .first()
    )

    if usuario_objetivo is None:

        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado."
        )

    if usuario_objetivo.id == usuario.id:

        raise HTTPException(
            status_code=400,
            detail=(
                "No puedes desactivar "
                "tu propio usuario."
            )
        )

    usuario_objetivo.activo = False

    db.commit()

    return {
        "success": True,
        "mensaje": (
            "Usuario desactivado correctamente."
        ),
        "usuario_id": usuario_id
    }