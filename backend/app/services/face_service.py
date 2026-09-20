import cv2
import numpy as np


class FaceService:

    def __init__(self):
        self.detector = cv2.CascadeClassifier(
            cv2.data.haarcascades +
            "haarcascade_frontalface_default.xml"
        )

    def detectar_rostros(self, imagen: np.ndarray):
        gris = cv2.cvtColor(imagen, cv2.COLOR_BGR2GRAY)

        rostros = self.detector.detectMultiScale(
            gris,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(80, 80)
        )

        return rostros

    def hay_rostro(self, imagen: np.ndarray) -> bool:
        rostros = self.detectar_rostros(imagen)

        return len(rostros) > 0