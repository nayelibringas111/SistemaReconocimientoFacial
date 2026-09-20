import numpy as np
from sqlalchemy.orm import Session

from app.models.face_embedding_model import FaceEmbedding


class FaceEmbeddingService:

    def guardar_embedding(
        self,
        db: Session,
        persona_id: int,
        embedding: np.ndarray,
        modelo: str = "buffalo_l"
    ):
        embedding_bytes = embedding.astype(
            np.float32
        ).tobytes()

        nuevo_embedding = FaceEmbedding(
            persona_id=persona_id,
            embedding=embedding_bytes,
            modelo=modelo
        )

        db.add(nuevo_embedding)
        db.commit()
        db.refresh(nuevo_embedding)

        return nuevo_embedding

    def obtener_embeddings(self, db: Session):
        embeddings = db.query(FaceEmbedding).all()

        resultados = []

        for registro in embeddings:
            embedding = np.frombuffer(
                registro.embedding,
                dtype=np.float32
            )

            resultados.append({
                "id": registro.id,
                "persona_id": registro.persona_id,
                "modelo": registro.modelo,
                "embedding": embedding
            })

        return resultados

    def buscar_similitudes(
        self,
        db: Session,
        embedding_nuevo: np.ndarray
    ):
        embeddings = self.obtener_embeddings(db)

        resultados = []

        for registro in embeddings:
            embedding_guardado = registro["embedding"]

            similitud = float(
                np.dot(embedding_nuevo, embedding_guardado)
                / (
                    np.linalg.norm(embedding_nuevo)
                    * np.linalg.norm(embedding_guardado)
                )
            )

            resultados.append({
                "id": registro["id"],
                "persona_id": registro["persona_id"],
                "modelo": registro["modelo"],
                "similitud": similitud
            })

        resultados.sort(
            key=lambda x: x["similitud"],
            reverse=True
        )

        return resultados

    def buscar_mejor_coincidencia(
        self,
        db: Session,
        embedding_nuevo: np.ndarray
    ):
        resultados = self.buscar_similitudes(
            db,
            embedding_nuevo
        )

        if not resultados:
            return None

        return resultados[0]