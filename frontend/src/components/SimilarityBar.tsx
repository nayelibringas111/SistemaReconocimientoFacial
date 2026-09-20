interface SimilarityBarProps {
  similitud: number
}

function SimilarityBar({
  similitud,
}: SimilarityBarProps) {
  const porcentaje = Math.max(
    0,
    Math.min(similitud * 100, 100)
  )

  return (
    <div className="similarity-section">

      <div className="similarity-header">
        <span>Similitud facial</span>

        <strong>
          {similitud.toFixed(4)}
        </strong>
      </div>

      <div className="similarity-bar">
        <div
          className="similarity-progress"
          style={{
            width: `${porcentaje}%`,
          }}
        />
      </div>

      <div className="similarity-labels">
        <span>0</span>
        <span>Valor de comparación</span>
        <span>1</span>
      </div>

    </div>
  )
}

export default SimilarityBar