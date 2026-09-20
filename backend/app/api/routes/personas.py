from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.persona_model import Persona
from app.schemas.persona_schema import (
    PersonaCreate,
    PersonaResponse
)
from app.core.security import obtener_usuario_actual
from app.models.usuario_model import Usuario


router = APIRouter(
    prefix="/api/personas",
    tags=["Personas"]
)


@router.get("")
def listar_personas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    personas = db.query(Persona).all()

    return personas


@router.post(
    "",
    response_model=PersonaResponse
)
def crear_persona(
    persona: PersonaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    nueva_persona = Persona(
        nombre=persona.nombre,
        email=persona.email
    )

    db.add(nueva_persona)
    db.commit()
    db.refresh(nueva_persona)

    return nueva_persona