from passlib.context import CryptContext

from app.database.connection import SessionLocal
from app.models.usuario_model import Usuario


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def crear_usuario_operador():

    db = SessionLocal()

    try:
        email = "operador@sistema.com"

        usuario_existente = (
            db.query(Usuario)
            .filter(Usuario.email == email)
            .first()
        )

        if usuario_existente:
            print("El usuario operador ya existe.")
            return

        password = "Operador123*"

        password_hash = pwd_context.hash(password)

        usuario = Usuario(
            nombre="Operador",
            email=email,
            password_hash=password_hash,
            rol="operador",
            activo=True
        )

        db.add(usuario)
        db.commit()
        db.refresh(usuario)

        print("")
        print("====================================")
        print("USUARIO OPERADOR CREADO")
        print("====================================")
        print(f"ID: {usuario.id}")
        print(f"Nombre: {usuario.nombre}")
        print(f"Correo: {usuario.email}")
        print(f"Rol: {usuario.rol}")
        print("Contraseña: Operador123*")
        print("====================================")

    finally:
        db.close()


if __name__ == "__main__":
    crear_usuario_operador()