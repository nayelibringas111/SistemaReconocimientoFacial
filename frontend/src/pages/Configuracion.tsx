import { useEffect, useState } from 'react'
import { Target, Cpu, Save, CheckCircle2 } from 'lucide-react'

function Configuracion() {
  const [umbral, setUmbral] = useState<number | ''>(75)
  const [guardado, setGuardado] = useState(false)

  // Cargar el valor guardado al entrar a Configuración
  useEffect(() => {
    const valorGuardado = localStorage.getItem(
      'umbralReconocimiento'
    )

    if (valorGuardado !== null) {
      const valor = Number(valorGuardado)

      if (
        !isNaN(valor) &&
        valor >= 0 &&
        valor <= 100
      ) {
        setUmbral(valor)
      }
    }
  }, [])

  // Cambiar el porcentaje escribiendo en el campo
  const handleUmbralChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const valorTexto = event.target.value

    // Permitir que el campo quede completamente vacío
    if (valorTexto === '') {
      setUmbral('')
      setGuardado(false)
      return
    }

    const valor = Number(valorTexto)

    // Solo aceptar valores entre 0 y 100
    if (
      !isNaN(valor) &&
      valor >= 0 &&
      valor <= 100
    ) {
      setUmbral(valor)
      setGuardado(false)
    }
  }

  // Guardar configuración
  const guardarCambios = () => {
    // No guardar si el campo está vacío
    if (umbral === '') {
      return
    }

    localStorage.setItem(
      'umbralReconocimiento',
      String(umbral)
    )

    setGuardado(true)

    setTimeout(() => {
      setGuardado(false)
    }, 2500)
  }

  // Valor seguro para mostrar la barra
  const porcentaje =
    umbral === '' ? 0 : umbral

  return (
    <div className="configuration-page">

      {/* =====================================================
          ENCABEZADO
      ====================================================== */}

      <header className="configuration-header">

        <div>

          <span className="configuration-section-label">
            CONFIGURACIÓN DEL SISTEMA
          </span>

          <h1>
            Configuración
          </h1>

          <p>
            Administra y consulta los parámetros principales
            del sistema de reconocimiento facial.
          </p>

        </div>

        <div className="configuration-header-status">

          <span className="configuration-status-dot"></span>

          <span className="configuration-status-text">
            Sistema operativo
          </span>

        </div>

      </header>


      {/* =====================================================
          GRID DE PARÁMETROS
      ====================================================== */}

      <section className="configuration-grid">


        {/* =================================================
            TARJETA 1 — UMBRAL
        ================================================== */}

        <article className="configuration-card">

          <div className="configuration-card-header">

            <div className="configuration-card-icon">
              <Target size={20} />
            </div>

            <span className="configuration-badge">
              CONFIGURABLE
            </span>

          </div>


          <span className="configuration-category">
            UMBRAL DE COINCIDENCIA
          </span>


          <h2>
            Umbral de coincidencia
          </h2>


          <p>
            Nivel mínimo requerido para determinar si un
            rostro corresponde a una persona registrada.
          </p>


          <div className="configuration-value">

            <div className="configuration-input-row">

              <input
                type="number"
                min="0"
                max="100"
                value={umbral}
                onChange={handleUmbralChange}
                aria-label="Umbral de coincidencia"
              />

              <span className="configuration-input-percent">
                %
              </span>

            </div>


            <span className="configuration-value-description">
              Nivel de coincidencia requerido
            </span>


            <div className="configuration-progress">

              <span
                style={{
                  width: `${porcentaje}%`,
                }}
              ></span>

            </div>


            <div className="configuration-range-labels">

              <span>
                0%
              </span>

              <span>
                100%
              </span>

            </div>

          </div>

        </article>


        {/* =================================================
            TARJETA 2 — MODELO FACIAL
        ================================================== */}

        <article className="configuration-card">

          <div className="configuration-card-header">

            <div className="configuration-card-icon">
              <Cpu size={20} />
            </div>

            <span className="configuration-badge">
              ACTIVO
            </span>

          </div>


          <span className="configuration-category">
            MODELO FACIAL
          </span>


          <h2>
            Modelo utilizado
          </h2>


          <p>
            Modelo de inteligencia artificial encargado de
            generar las representaciones faciales.
          </p>


          <div className="configuration-value">

            <strong className="configuration-model">
              InsightFace
            </strong>

            <span className="configuration-version">
              buffalo_l
            </span>

            <div className="configuration-divider"></div>

            <span className="configuration-model-description">
              Modelo de reconocimiento facial
            </span>

          </div>

        </article>

      </section>


      {/* =====================================================
          BOTÓN DE ACCIÓN
      ====================================================== */}

      <div className="configuration-actions">

        {guardado && (
          <div className="configuration-saved-message">

            <CheckCircle2 size={16} />

            Cambios guardados correctamente

          </div>
        )}

        <button
          className="btn-primary"
          onClick={guardarCambios}
        >

          <Save size={16} />

          Guardar cambios

        </button>

      </div>

    </div>
  )
}

export default Configuracion