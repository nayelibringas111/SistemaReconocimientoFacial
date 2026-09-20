import numpy as np


# Distancia euclidiana a partir de la cual dos rostros se consideran
# completamente distintos. Sirve para convertir la distancia en un
# puntaje de similitud entre 0 y 1.
#
# Medido sobre los vectores de face-api.js (128 dimensiones):
#   misma persona        -> distancia 0.05 - 0.45
#   personas distintas   -> distancia 0.50 - 0.85
# El valor 1.2 deja margen de sobra por encima del peor caso.
DISTANCIA_MAXIMA = 1.2


class SimilarityService:

    @staticmethod
    def distancia_euclidiana(
        embedding_a: np.ndarray,
        embedding_b: np.ndarray
    ) -> float:
        """
        Distancia euclidiana entre dos vectores faciales.

        Es la métrica con la que face-api.js / dlib están calibrados:
        el umbral clásico de coincidencia es 0.6.

        No se usa similitud coseno para decidir porque estos vectores
        no están centrados en el origen: dos personas DISTINTAS dan
        coseno 0.84 - 0.94, así que el coseno casi no separa.
        """

        a = np.asarray(embedding_a, dtype=np.float32)
        b = np.asarray(embedding_b, dtype=np.float32)

        return float(np.linalg.norm(a - b))

    @staticmethod
    def similitud_desde_distancia(
        distancia: float
    ) -> float:
        """
        Convierte una distancia euclidiana en un puntaje de similitud
        entre 0 y 1 (1 = idéntico), que es lo que esperan el frontend
        y el modelo de probabilidad calibrada.

        La conversión es lineal y decreciente, así que conserva el
        orden: a menor distancia, mayor similitud.

            distancia 0.0  -> similitud 1.00
            distancia 0.6  -> similitud 0.50   (umbral clásico)
            distancia 1.2  -> similitud 0.00
        """

        similitud = 1.0 - (float(distancia) / DISTANCIA_MAXIMA)

        # Se acota a [0, 1]: probability_service.predecir() lo exige.
        return float(min(1.0, max(0.0, similitud)))

    @staticmethod
    def similitud_coseno(
        embedding_a: np.ndarray,
        embedding_b: np.ndarray
    ) -> float:

        embedding_a = np.asarray(
            embedding_a,
            dtype=np.float32
        )

        embedding_b = np.asarray(
            embedding_b,
            dtype=np.float32
        )

        norma_a = np.linalg.norm(embedding_a)
        norma_b = np.linalg.norm(embedding_b)

        if norma_a == 0 or norma_b == 0:
            raise ValueError(
                "No se puede calcular la similitud con un embedding vacío."
            )

        similitud = np.dot(
            embedding_a,
            embedding_b
        ) / (norma_a * norma_b)

        return float(similitud)

    @staticmethod
    def es_coincidencia(
        similitud: float,
        umbral: float
    ) -> bool:
        return similitud >= umbral