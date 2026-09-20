import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import MLTrainingRecord
from app.api.routes import health, personas, recognition, probabilities, face_registration, ml_models, auth, usuarios

app = FastAPI(
    title="Sistema Inteligente de Reconocimiento Facial",
    description="API para registro y reconocimiento facial mediante Inteligencia Artificial.",
    version="1.0.0"
)

# ============================================================
# CONFIGURACIÓN CORS
# ============================================================
# Añadimos tu URL de Vercel directamente a la lista fija
# ============================================================
# CONFIGURACIÓN CORS
# ============================================================
# Solo permitimos peticiones desde tu frontend en Vercel
allow_origins = [
    "https://aurea-iv.vercel.app" 
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in allow_origins:
    allow_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# RUTAS
# ============================================================
app.include_router(health.router)
app.include_router(personas.router)
app.include_router(recognition.router)
app.include_router(probabilities.router)
app.include_router(face_registration.router)
app.include_router(ml_models.router)
app.include_router(auth.router)
app.include_router(usuarios.router)

# ============================================================
# INICIALIZAR MODELO ML AL ARRANCAR EL BACKEND
# ============================================================
@app.on_event("startup")
def cargar_modelo_ml():
    print("\n==================================================")
    print(" INICIANDO SISTEMA DE RECONOCIMIENTO FACIAL")
    print("==================================================")
    ml_models.inicializar_modelo_desde_bd()
    print("==================================================\n")

# ============================================================
# RUTA PRINCIPAL
# ============================================================
@app.get("/")
def inicio():
    return {
        "mensaje": "Sistema de Reconocimiento Facial funcionando correctamente"
    }