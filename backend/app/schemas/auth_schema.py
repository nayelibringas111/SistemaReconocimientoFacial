from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    rol: str
    activo: bool

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    success: bool
    mensaje: str
    token: str
    usuario: UsuarioResponse