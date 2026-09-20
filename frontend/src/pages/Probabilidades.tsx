import { useEffect, useState } from 'react'
import {
  ChartNoAxesCombined,
  Target,
  TrendingUp,
  RefreshCw,
  BrainCircuit,
  Play,
  CheckCircle2,
} from 'lucide-react'

import api from '../services/api'

import ProbabilityChart from '../components/ProbabilityChart'

import type {
  RegistroReconocimiento,
  PersonaProbabilidad,
} from '../types/facial'

interface MetricasModelo {
  accuracy: number | null
  precision: number | null
  recall: number | null
  f1_score: number | null
  total_registros: number
}

interface ModeloResponse {
  success: boolean
  modelo_entrenado: boolean
  probabilidades_calibradas: boolean
  metodo_calibracion: string | null
  metricas: MetricasModelo
}

interface EntrenamientoResponse {
  success: boolean
  mensaje: string
  modelo_entrenado: boolean
  probabilidades_calibradas: boolean
  metodo_calibracion: string
  datos_demostrativos: boolean
  metricas: MetricasModelo
  registros_utilizados: number
  registros_guardados: number
}

function Probabilidades() {
  const [personas, setPersonas] =
    useState<PersonaProbabilidad[]>([])

  const [cargando, setCargando] =
    useState(true)

  const [metricas, setMetricas] =
    useState<MetricasModelo>({
      accuracy: null,
      precision: null,
      recall: null,
      f1_score: null,
      total_registros: 0,
    })

  const [modeloEntrenado, setModeloEntrenado] =
    useState(false)

  const [probabilidadesCalibradas, setProbabilidadesCalibradas] =
    useState(false)

  const [metodoCalibracion, setMetodoCalibracion] =
    useState<string | null>(null)

  const [entrenando, setEntrenando] =
    useState(false)

  const [mensajeEntrenamiento, setMensajeEntrenamiento] =
    useState('')

  const [errorEntrenamiento, setErrorEntrenamiento] =
    useState('')

  const cargarMetricas = async () => {
    try {
      const respuesta =
        await api.get<ModeloResponse>(
          '/api/modelos/metricas'
        )

      setModeloEntrenado(
        respuesta.data.modelo_entrenado
      )

      setProbabilidadesCalibradas(
        respuesta.data.probabilidades_calibradas
      )

      setMetodoCalibracion(
        respuesta.data.metodo_calibracion
      )

      setMetricas(
        respuesta.data.metricas
      )
    } catch (error) {
      console.error(
        'Error cargando métricas del modelo:',
        error
      )
    }
  }

  const cargarDatos = async () => {
    try {
      setCargando(true)

      const respuesta =
        await api.get(
          '/api/reconocimiento/historial'
        )

      const registros: RegistroReconocimiento[] =
        respuesta.data.resultados || []

      const agrupados =
        new Map<number, RegistroReconocimiento[]>()

      registros
        .filter(
          (registro) =>
            registro.persona_id !== null &&
            registro.persona_nombre !== null
        )
        .forEach((registro) => {
          const id =
            registro.persona_id as number

          if (!agrupados.has(id)) {
            agrupados.set(id, [])
          }

          agrupados
            .get(id)!
            .push(registro)
        })

      const resultados:
        PersonaProbabilidad[] = []

      for (
        const [
          personaId,
          registrosPersona,
        ] of agrupados
      ) {
        const promedio =
          registrosPersona.reduce(
            (suma, registro) =>
              suma + registro.similitud,
            0
          ) /
          registrosPersona.length

        const mejor =
          Math.max(
            ...registrosPersona.map(
              (registro) =>
                registro.similitud
            )
          )

        const umbral =
          registrosPersona[0].umbral

        let probabilidad:
          number | undefined =
          undefined

        try {
          const respuestaProbabilidad =
            await api.post(
              '/api/probabilidades/prediccion',
              {
                similitud: promedio,
              }
            )

          probabilidad =
            respuestaProbabilidad.data
              .probabilidad
        } catch (error) {
          console.error(
            'No se pudo calcular la probabilidad:',
            error
          )
        }

        resultados.push({
          persona_id: personaId,

          persona_nombre:
            registrosPersona[0]
              .persona_nombre!,

          promedio,

          mejor,

          umbral,

          probabilidad,
        })
      }

      setPersonas(resultados)
    } catch (error) {
      console.error(
        'Error cargando probabilidades:',
        error
      )
    } finally {
      setCargando(false)
    }
  }

  const actualizarTodo = async () => {
    await Promise.all([
      cargarDatos(),
      cargarMetricas(),
    ])
  }

  const entrenarModelo = async () => {
    try {
      setEntrenando(true)
      setMensajeEntrenamiento('')
      setErrorEntrenamiento('')

      const respuesta =
        await api.post<EntrenamientoResponse>(
          '/api/modelos/entrenar'
        )

      const datos =
        respuesta.data

      setModeloEntrenado(
        datos.modelo_entrenado
      )

      setProbabilidadesCalibradas(
        datos.probabilidades_calibradas
      )

      setMetodoCalibracion(
        datos.metodo_calibracion
      )

      setMetricas(
        datos.metricas
      )

      setMensajeEntrenamiento(
        datos.mensaje
      )

      await cargarDatos()
    } catch (error: any) {
      console.error(
        'Error entrenando modelo:',
        error
      )

      setErrorEntrenamiento(
        error.response?.data?.detail ||
        'No se pudo entrenar el modelo.'
      )
    } finally {
      setEntrenando(false)
    }
  }

  useEffect(() => {
    actualizarTodo()
  }, [])

  const datosGrafico =
    personas
      .filter(
        (persona) =>
          persona.probabilidad !== undefined
      )
      .map((persona) => ({
        nombre:
          persona.persona_nombre,

        similitud:
          persona.promedio,

        probabilidad:
          persona.probabilidad!,
      }))

  const porcentaje = (
    valor: number | null
  ) => {
    if (valor === null) {
      return '—'
    }

    return `${(
      valor * 100
    ).toFixed(2)}%`
  }

  return (
    <div className="probability-page">

      {/* CABECERA */}

      <div className="dashboard-header">

        <div>

          <span className="section-label">
            ANÁLISIS FACIAL
          </span>

          <h1>
            Probabilidades
          </h1>

          <p>
            Similitud obtenida para cada persona
            registrada y análisis probabilístico
            de los resultados.
          </p>

        </div>

        <button
          className="probability-refresh"
          onClick={actualizarTodo}
          disabled={cargando || entrenando}
        >

          <RefreshCw
            size={17}
            className={
              cargando
                ? 'refresh-spin'
                : ''
            }
          />

          Actualizar

        </button>

      </div>

      {/* MODELO ML */}

      <section className="probability-card">

        <div className="probability-card-header">

          <div>

            <span className="section-label">
              MACHINE LEARNING
            </span>

            <h2>
              Modelo de probabilidades
            </h2>

            <span className="probability-person-id">
              Evaluación y calibración del modelo
            </span>

          </div>

          <div className="probability-header-icon">

            <BrainCircuit
              size={21}
            />

          </div>

        </div>

        <div className="probability-person-stats">

          <div className="probability-person-stat">

            <CheckCircle2
              size={19}
            />

            <div>

              <span>
                Estado del modelo
              </span>

              <strong>
                {modeloEntrenado
                  ? 'Entrenado'
                  : 'Pendiente'}
              </strong>

            </div>

          </div>

          <div className="probability-person-stat">

            <ChartNoAxesCombined
              size={19}
            />

            <div>

              <span>
                Accuracy
              </span>

              <strong>
                {porcentaje(
                  metricas.accuracy
                )}
              </strong>

            </div>

          </div>

          <div className="probability-person-stat">

            <Target
              size={19}
            />

            <div>

              <span>
                Precision
              </span>

              <strong>
                {porcentaje(
                  metricas.precision
                )}
              </strong>

            </div>

          </div>

          <div className="probability-person-stat">

            <TrendingUp
              size={19}
            />

            <div>

              <span>
                Recall
              </span>

              <strong>
                {porcentaje(
                  metricas.recall
                )}
              </strong>

            </div>

          </div>

          <div className="probability-person-stat">

            <ChartNoAxesCombined
              size={19}
            />

            <div>

              <span>
                F1-score
              </span>

              <strong>
                {porcentaje(
                  metricas.f1_score
                )}
              </strong>

            </div>

          </div>

          <div className="probability-person-stat">

            <BrainCircuit
              size={19}
            />

            <div>

              <span>
                Registros
              </span>

              <strong>
                {metricas.total_registros}
              </strong>

            </div>

          </div>

        </div>

        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >

          <div>

            <span className="probability-person-id">

              {probabilidadesCalibradas
                ? `Probabilidades calibradas mediante ${
                    metodoCalibracion || 'sigmoid'
                  }.`
                : 'Las probabilidades todavía no han sido calibradas.'}

            </span>

          </div>

          <button
            className="probability-refresh"
            onClick={entrenarModelo}
            disabled={entrenando}
          >

            <Play
              size={17}
            />

            {entrenando
              ? 'Entrenando...'
              : 'Entrenar modelo'}

          </button>

        </div>

        {mensajeEntrenamiento && (

          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
            }}
          >

            <CheckCircle2
              size={17}
            />

            <span>
              {mensajeEntrenamiento}
            </span>

          </div>

        )}

        {errorEntrenamiento && (

          <div
            style={{
              marginTop: '16px',
              color: '#b42318',
              fontSize: '14px',
            }}
          >

            {errorEntrenamiento}

          </div>

        )}

      </section>

      {/* RESULTADOS */}

      {cargando ? (

        <section className="probability-card">

          <div className="probability-empty">

            <RefreshCw
              size={25}
              className="refresh-spin"
            />

            <span>
              Cargando resultados...
            </span>

          </div>

        </section>

      ) : personas.length === 0 ? (

        <section className="probability-card">

          <div className="probability-empty">

            <ChartNoAxesCombined
              size={28}
            />

            <h2>
              Sin resultados
            </h2>

            <p>
              Todavía no existen personas
              identificadas para analizar.
            </p>

          </div>

        </section>

      ) : (

        <>

          {/* GRÁFICO */}

          {datosGrafico.length > 0 && (

            <section className="probability-card">

              <div className="probability-card-header">

                <div>

                  <span className="section-label">
                    ANÁLISIS COMPARATIVO
                  </span>

                  <h2>
                    Similitud y probabilidad
                  </h2>

                  <span className="probability-person-id">
                    Comparación de resultados registrados
                  </span>

                </div>

                <div className="probability-header-icon">

                  <ChartNoAxesCombined
                    size={21}
                  />

                </div>

              </div>

              <ProbabilityChart
                datos={datosGrafico}
              />

            </section>

          )}

          {/* PERSONAS */}

          <div className="probability-person-list">

            {personas.map((persona) => {

              const promedioPorcentaje =
                persona.promedio * 100

              const mejorPorcentaje =
                persona.mejor * 100

              const umbralPorcentaje =
                persona.umbral * 100

              const probabilidadPorcentaje =
                persona.probabilidad !== undefined
                  ? persona.probabilidad * 100
                  : null

              const superaUmbral =
                promedioPorcentaje >=
                umbralPorcentaje

              return (

                <section
                  className="probability-card"
                  key={persona.persona_id}
                >

                  {/* ENCABEZADO */}

                  <div className="probability-card-header">

                    <div>

                      <span className="section-label">
                        PERSONA REGISTRADA
                      </span>

                      <h2>
                        {persona.persona_nombre}
                      </h2>

                      <span className="probability-person-id">
                        ID {persona.persona_id}
                      </span>

                    </div>

                    <div className="probability-header-icon">

                      <Target
                        size={21}
                      />

                    </div>

                  </div>

                  {/* ESTADÍSTICAS */}

                  <div className="probability-person-stats">

                    <div className="probability-person-stat">

                      <ChartNoAxesCombined
                        size={19}
                      />

                      <div>

                        <span>
                          Similitud promedio
                        </span>

                        <strong>
                          {promedioPorcentaje.toFixed(2)}%
                        </strong>

                      </div>

                    </div>

                    <div className="probability-person-stat">

                      <TrendingUp
                        size={19}
                      />

                      <div>

                        <span>
                          Mejor similitud
                        </span>

                        <strong>
                          {mejorPorcentaje.toFixed(2)}%
                        </strong>

                      </div>

                    </div>

                    <div className="probability-person-stat">

                      <Target
                        size={19}
                      />

                      <div>

                        <span>
                          Umbral
                        </span>

                        <strong>
                          {umbralPorcentaje.toFixed(0)}%
                        </strong>

                      </div>

                    </div>

                    <div className="probability-person-stat">

                      <ChartNoAxesCombined
                        size={19}
                      />

                      <div>

                        <span>
                          Probabilidad
                        </span>

                        <strong>
                          {probabilidadPorcentaje !== null
                            ? `${probabilidadPorcentaje.toFixed(2)}%`
                            : 'Pendiente'}
                        </strong>

                      </div>

                    </div>

                  </div>

                  {/* COMPARACIÓN */}

                  <div className="probability-comparison">

                    <div className="probability-comparison-labels">

                      <span>
                        Similitud promedio
                      </span>

                      <strong>
                        {promedioPorcentaje.toFixed(2)}%
                      </strong>

                    </div>

                    <div className="probability-large-bar">

                      <div
                        style={{
                          width:
                            `${Math.min(
                              promedioPorcentaje,
                              100
                            )}%`,
                        }}
                      />

                    </div>

                    <div className="probability-bar-labels">

                      <span>
                        0%
                      </span>

                      <span>
                        Umbral:{' '}
                        {umbralPorcentaje.toFixed(0)}%
                      </span>

                      <span>
                        100%
                      </span>

                    </div>

                    <div className="probability-status">

                      <Target
                        size={14}
                      />

                      {superaUmbral
                        ? 'Supera el umbral de coincidencia'
                        : 'No alcanza el umbral de coincidencia'}

                    </div>

                    {/* PROBABILIDAD */}

                    {probabilidadPorcentaje !== null && (

                      <div
                        className="probability-comparison"
                        style={{
                          marginTop: '18px',
                        }}
                      >

                        <div className="probability-comparison-labels">

                          <span>
                            Probabilidad calculada
                          </span>

                          <strong>
                            {probabilidadPorcentaje.toFixed(2)}%
                          </strong>

                        </div>

                        <div className="probability-large-bar">

                          <div
                            style={{
                              width:
                                `${Math.min(
                                  probabilidadPorcentaje,
                                  100
                                )}%`,
                            }}
                          />

                        </div>

                      </div>

                    )}

                  </div>

                </section>

              )
            })}

          </div>

        </>

      )}

    </div>
  )
}

export default Probabilidades