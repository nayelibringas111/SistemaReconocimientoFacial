import cv2
import numpy as np

from insightface.app import FaceAnalysis


class EmbeddingService:

    def __init__(self):
        # El modelo NO se carga al iniciar FastAPI.
        # Se cargará solamente cuando sea necesario.
        self.app = None

    def _cargar_modelo(self):

        if self.app is not None:
            return

        print("")
        print("==============================================")
        print(" CARGANDO MODELO DE RECONOCIMIENTO FACIAL")
        print(" Modelo: buffalo_l")
        print("==============================================")

        self.app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"]
        )

        self.app.prepare(
            ctx_id=0,
            det_size=(640, 640)
        )

        print("✅ Modelo buffalo_l cargado correctamente.")
        print("==============================================")
        print("")

    def obtener_embedding(
        self,
        imagen: np.ndarray
    ):

        self._cargar_modelo()

        rostros = self.app.get(imagen)

        if not rostros:
            return None

        rostro = rostros[0]

        return rostro.embedding

    def obtener_embedding_desde_archivo(
        self,
        ruta: str
    ):

        imagen = cv2.imread(ruta)

        if imagen is None:
            raise ValueError(
                "No se pudo leer la imagen."
            )

        return self.obtener_embedding(imagen)