import numpy as np


class SimilarityService:

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