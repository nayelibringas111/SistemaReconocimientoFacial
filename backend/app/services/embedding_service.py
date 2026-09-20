import cv2
import numpy as np
from insightface.app import FaceAnalysis


class EmbeddingService:

    def __init__(self):
        self.app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"]
        )

        self.app.prepare(
            ctx_id=0,
            det_size=(640, 640)
        )

    def obtener_embedding(self, imagen: np.ndarray):
        rostros = self.app.get(imagen)

        if not rostros:
            return None

        rostro = rostros[0]

        return rostro.embedding

    def obtener_embedding_desde_archivo(self, ruta: str):
        imagen = cv2.imread(ruta)

        if imagen is None:
            raise ValueError("No se pudo leer la imagen.")

        return self.obtener_embedding(imagen)