import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Target,
} from 'lucide-react'

import SimilarityBar from './SimilarityBar'
import type { ResultadoReconocimiento } from '../types/facial'

interface FaceResultCardProps {
  resultado: ResultadoReconocimiento | null
  onNuevoAnalisis: () => void
}

function FaceResultCard({
  resultado,
  onNuevoAnalisis,
}: FaceResultCardProps) {
  if (!resultado) {
    return (
      <div className="recognition-empty">
        <div className="recognition-empty-icon">
          <Target size={30} />
        </div>

        <h3>Esperando análisis</h3>

        <p>
          Captura un rostro para iniciar el proceso de identificación.
        </p>
      </div>
    )
  }

  return (
    <div className="recognition-result">

      <div
        className={
          resultado.coincide
            ? 'match-status success'
            : 'match-status failure'
        }
      >
        <div className="match-status-icon">
          {resultado.coincide ? (
            <CheckCircle2 size={24} />
          ) : (
            <XCircle size={24} />
          )}
        </div>

        <div>
          <strong>
            {resultado.coincide
              ? 'Rostro identificado'
              : 'Sin coincidencia'}
          </strong>

          <span>
            {resultado.coincide
              ? resultado.persona_nombre
                ? resultado.persona_nombre
                : `Persona ID ${resultado.persona_id}`
              : 'No se encontró una coincidencia suficiente.'}
          </span>
        </div>
      </div>

      {resultado.similitud !== undefined && (
        <SimilarityBar
          similitud={resultado.similitud}
        />
      )}

      <div className="recognition-data">

        <div>
          <span>Persona identificada</span>

          <strong>
            {resultado.persona_nombre
              ? resultado.persona_nombre
              : resultado.persona_id
                ? `ID ${resultado.persona_id}`
                : 'No identificada'}
          </strong>
        </div>

        <div>
          <span>ID de registro</span>

          <strong>
            {resultado.persona_id
              ? resultado.persona_id
              : '—'}
          </strong>
        </div>

        <div>
          <span>Umbral configurado</span>

          <strong>
            {resultado.umbral !== undefined
              ? resultado.umbral.toFixed(2)
              : '—'}
          </strong>
        </div>

        <div>
          <span>Decisión</span>

          <strong
            className={
              resultado.coincide
                ? 'decision-success'
                : 'decision-failure'
            }
          >
            {resultado.coincide
              ? 'Coincidencia'
              : 'No coincide'}
          </strong>
        </div>

        <div>
          <span>Probabilidad calibrada</span>

          <strong>
            {resultado.probabilidad_calibrada !== null &&
            resultado.probabilidad_calibrada !== undefined
              ? `${(
                  resultado.probabilidad_calibrada * 100
                ).toFixed(2)}%`
              : 'Pendiente'}
          </strong>
        </div>

      </div>

      <button
        type="button"
        className="recognition-new"
        onClick={onNuevoAnalisis}
      >
        <RotateCcw size={17} />
        Realizar nuevo análisis
      </button>

    </div>
  )
}

export default FaceResultCard