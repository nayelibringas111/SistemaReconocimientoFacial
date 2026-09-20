from pydantic import BaseModel, EmailStr
from typing import Optional


class PersonaBase(BaseModel):
    nombre: str
    email: Optional[EmailStr] = None


class PersonaCreate(PersonaBase):
    pass


class PersonaResponse(PersonaBase):
    id: int
    activo: bool

    class Config:
        from_attributes = True