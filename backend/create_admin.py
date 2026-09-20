from passlib.context import CryptContext

from app.database.connection import Base, engine, SessionLocal
from app.models.usuario_model import Usuario


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def crear_usuario_admin():
    # Crear las tablas que todavía no existan
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        email = "admin@sistema.com"

        usuario_existente = (
            db.query(Usuario)
            .filter(Usuario.email == email)
            .first()
        )

        if usuario_existente:
            print("El usuario administrador ya existe.")
            return

        password = "Admin123!"

        password_hash = pwd_context.hash(password)

        usuario = Usuario(
            nombre="Administrador",
            email=email,
            password_hash=password_hash,
            rol="administrador",
            activo=True
        )

        db.add(usuario)
        db.commit()
        db.refresh(usuario)

        print("")
        print("====================================")
        print("USUARIO ADMINISTRADOR CREADO")
        print("====================================")
        print(f"ID: {usuario.id}")
        print(f"Nombre: {usuario.nombre}")
        print(f"Correo: {usuario.email}")
        print(f"Rol: {usuario.rol}")
        print("Contraseña: Admin123!")
        print("====================================")

    finally:
        db.close()


if __name__ == "__main__":
    crear_usuario_admin()