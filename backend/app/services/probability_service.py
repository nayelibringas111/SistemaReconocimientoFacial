import numpy as np

from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV


class ProbabilityService:
    """
    Servicio para entrenar y calcular probabilidades calibradas
    a partir de la similitud facial.
    """

    # El modelo queda compartido dentro del proceso de FastAPI.
    _modelo_calibrado = None
    _entrenado = False

    def __init__(self):
        pass

    def entrenar(
        self,
        similitudes: list[float],
        resultados: list[int]
    ):
        if not similitudes or not resultados:
            raise ValueError(
                "Se necesitan datos para entrenar el modelo."
            )

        if len(similitudes) != len(resultados):
            raise ValueError(
                "Las similitudes y los resultados "
                "deben tener la misma cantidad de elementos."
            )

        X = np.array(
            similitudes,
            dtype=float
        ).reshape(-1, 1)

        y = np.array(
            resultados,
            dtype=int
        )

        # Debemos tener las dos clases:
        # 0 = no coincidencia
        # 1 = coincidencia
        clases = np.unique(y)

        if len(clases) < 2:
            raise ValueError(
                "El entrenamiento necesita ejemplos "
                "de coincidencia y no coincidencia."
            )

        # Cantidad de ejemplos disponibles por clase.
        cantidades_por_clase = [
            int(np.sum(y == clase))
            for clase in clases
        ]

        minimo_por_clase = min(
            cantidades_por_clase
        )

        # Usamos validación cruzada para calibrar
        # las probabilidades.
        cv = min(
            3,
            minimo_por_clase
        )

        if cv < 2:
            raise ValueError(
                "Se necesitan al menos 2 ejemplos "
                "por clase para realizar la calibración."
            )

        # Modelo base de clasificación.
        modelo_base = LogisticRegression(
            random_state=42,
            max_iter=1000
        )

        # Calibración real mediante método Sigmoid.
        modelo_calibrado = CalibratedClassifierCV(
            estimator=modelo_base,
            method="sigmoid",
            cv=cv
        )

        modelo_calibrado.fit(
            X,
            y
        )

        ProbabilityService._modelo_calibrado = (
            modelo_calibrado
        )

        ProbabilityService._entrenado = True

        return modelo_calibrado

    def predecir(
        self,
        similitud: float
    ) -> float:

        if ProbabilityService._modelo_calibrado is None:
            raise ValueError(
                "El modelo de probabilidades "
                "todavía no ha sido entrenado."
            )

        if not 0.0 <= similitud <= 1.0:
            raise ValueError(
                "La similitud debe estar entre 0 y 1."
            )

        X = np.array(
            [[float(similitud)]],
            dtype=float
        )

        probabilidades = (
            ProbabilityService
            ._modelo_calibrado
            .predict_proba(X)
        )

        clases = (
            ProbabilityService
            ._modelo_calibrado
            .classes_
        )

        # Buscamos la probabilidad de la clase 1,
        # que representa una coincidencia.
        indices_clase_positiva = np.where(
            clases == 1
        )[0]

        if len(indices_clase_positiva) == 0:
            raise ValueError(
                "El modelo no contiene la clase positiva."
            )

        indice = int(
            indices_clase_positiva[0]
        )

        probabilidad = float(
            probabilidades[0][indice]
        )

        # Garantizar que esté entre 0 y 1.
        probabilidad = max(
            0.0,
            min(
                1.0,
                probabilidad
            )
        )

        return probabilidad

    @classmethod
    def esta_entrenado(cls) -> bool:
        return cls._entrenado