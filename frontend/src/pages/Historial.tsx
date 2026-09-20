import { useEffect, useState } from 'react'
import {
  History as HistoryIcon,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Activity,
  Clock3,
  Users,
  ScanFace,
  ChartNoAxesCombined,
} from 'lucide-react'

import api from '../services/api'


interface RegistroHistorial {
  id: number
  persona_id: number | null
  persona_nombre: string | null
  similitud: number
  distancia: number | null
  umbral: number
  coincide: boolean
  probabilidad_calibrada: number | null
  created_at: string
}


function Historial() {

  const [registros, setRegistros] =
    useState<RegistroHistorial[]>([])

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState('')

  const [busqueda, setBusqueda] =
    useState('')

  const [filtro, setFiltro] =
    useState('todos')


  const cargarHistorial = async () => {

    try {

      setCargando(true)

      setError('')

      const respuesta =
        await api.get(
          '/api/reconocimiento/historial'
        )

      setRegistros(
        respuesta.data.resultados || []
      )

    } catch (error) {

      console.error(error)

      setError(
        'No se pudo cargar el historial.'
      )

    } finally {

      setCargando(false)

    }

  }


  useEffect(() => {

    cargarHistorial()

  }, [])


  // -------------------------------------------------------
  // ESTADÍSTICAS
  // -------------------------------------------------------

  const total =
    registros.length


  const coincidencias =
    registros.filter(
      (registro) =>
        registro.coincide
    ).length


  const noCoincidencias =
    registros.filter(
      (registro) =>
        !registro.coincide
    ).length


  const personasIdentificadas =
    new Set(
      registros
        .filter(
          (registro) =>
            registro.coincide &&
            registro.persona_id !== null
        )
        .map(
          (registro) =>
            registro.persona_id
        )
    ).size


  // -------------------------------------------------------
  // FILTROS
  // -------------------------------------------------------

  const registrosFiltrados =
    registros.filter((registro) => {

      const nombre =
        registro.persona_nombre
          ?.toLowerCase() || ''


      const id =
        registro.persona_id
          ?.toString() || ''


      const textoBusqueda =
        busqueda.toLowerCase()


      const coincideBusqueda =
        nombre.includes(textoBusqueda) ||
        id.includes(textoBusqueda)


      if (!coincideBusqueda) {
        return false
      }


      if (
        filtro === 'coincidencias' &&
        !registro.coincide
      ) {
        return false
      }


      if (
        filtro === 'no-coincidencias' &&
        registro.coincide
      ) {
        return false
      }


      return true

    })


  // -------------------------------------------------------
  // FORMATO DE FECHA
  // -------------------------------------------------------

  const formatearFecha =
    (fecha: string) => {

      const fechaLocal =
        new Date(fecha)

      return fechaLocal.toLocaleString(
        'es-PE',
        {
          dateStyle: 'short',
          timeStyle: 'short',
        }
      )

    }


  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (

    <div className="history-page">


      {/* CABECERA */}

      <div className="dashboard-header">

        <div>

          <span className="section-label">
            CONTROL Y SEGUIMIENTO
          </span>


          <h1>
            Historial de reconocimientos
          </h1>


          <p>
            Consulta los análisis realizados,
            las personas identificadas y los
            resultados obtenidos por el sistema.
          </p>

        </div>


        <div className="history-status">

          <Activity size={18} />

          <span>
            Registro activo
          </span>

        </div>

      </div>


      {/* ESTADÍSTICAS */}

      <div className="history-stats">


        <div className="history-stat-card">

          <div className="history-stat-icon">

            <HistoryIcon size={21} />

          </div>


          <div>

            <span>
              Total de análisis
            </span>

            <strong>
              {total}
            </strong>

          </div>

        </div>


        <div className="history-stat-card">

          <div className="history-stat-icon success">

            <CheckCircle2 size={21} />

          </div>


          <div>

            <span>
              Coincidencias
            </span>

            <strong>
              {coincidencias}
            </strong>

          </div>

        </div>


        <div className="history-stat-card">

          <div className="history-stat-icon warning">

            <XCircle size={21} />

          </div>


          <div>

            <span>
              No coincidencias
            </span>

            <strong>
              {noCoincidencias}
            </strong>

          </div>

        </div>


        <div className="history-stat-card">

          <div className="history-stat-icon">

            <Users size={21} />

          </div>


          <div>

            <span>
              Personas identificadas
            </span>

            <strong>
              {personasIdentificadas}
            </strong>

          </div>

        </div>

      </div>


      {/* TABLA */}

      <section className="history-card">


        <div className="history-card-header">


          <div>

            <span className="section-label">
              REGISTROS
            </span>


            <h2>
              Actividad reciente
            </h2>

          </div>


          <button
            className="history-refresh"
            onClick={cargarHistorial}
            disabled={cargando}
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


        {/* HERRAMIENTAS */}

        <div className="history-tools">


          <div className="history-search">

            <Search size={18} />


            <input
              type="text"
              placeholder="Buscar por persona o ID..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
            />

          </div>


          <select
            value={filtro}
            onChange={(e) =>
              setFiltro(
                e.target.value
              )
            }
            className="history-filter"
          >

            <option value="todos">
              Todos los resultados
            </option>

            <option value="coincidencias">
              Solo coincidencias
            </option>

            <option value="no-coincidencias">
              Solo no coincidencias
            </option>

          </select>

        </div>


        {/* ERROR */}

        {error && (

          <div className="history-error">

            <XCircle size={18} />

            {error}

          </div>

        )}


        {/* CARGANDO */}

        {cargando ? (

          <div className="history-empty">

            <RefreshCw
              size={28}
              className="refresh-spin"
            />

            <h3>
              Cargando historial...
            </h3>

            <p>
              Consultando los registros
              del sistema.
            </p>

          </div>

        ) : registrosFiltrados.length === 0 ? (

          <div className="history-empty">

            <div className="history-empty-icon">

              <ScanFace size={28} />

            </div>


            <h3>
              No hay registros
            </h3>


            <p>
              No se encontraron reconocimientos
              que coincidan con la búsqueda.
            </p>

          </div>

        ) : (

          <div className="history-table-wrapper">

            <table className="history-table">


              <thead>

                <tr>

                  <th>
                    FECHA Y HORA
                  </th>

                  <th>
                    PERSONA
                  </th>

                  <th>
                    SIMILITUD
                  </th>

                  <th>
                    DISTANCIA
                  </th>

                  <th>
                    UMBRAL
                  </th>

                  <th>
                    PROBABILIDAD
                  </th>

                  <th>
                    RESULTADO
                  </th>

                </tr>

              </thead>


              <tbody>

                {registrosFiltrados.map(
                  (registro) => (

                    <tr
                      key={registro.id}
                    >


                      {/* FECHA */}

                      <td>

                        <div className="history-date">

                          <Clock3 size={16} />

                          <span>
                            {
                              formatearFecha(
                                registro.created_at
                              )
                            }
                          </span>

                        </div>

                      </td>


                      {/* PERSONA */}

                      <td>

                        <div className="history-person">

                          <div className="history-person-icon">

                            <ScanFace
                              size={17}
                            />

                          </div>


                          <div>

                            <strong>

                              {registro.persona_nombre
                                || 'No identificada'}

                            </strong>


                            <span>

                              {registro.persona_id
                                ? `ID ${registro.persona_id}`
                                : 'Sin registro'}

                            </span>

                          </div>

                        </div>

                      </td>


                      {/* SIMILITUD */}

                      <td>

                        <div className="history-similarity">

                          <strong>

                            {
                              (
                                registro.similitud *
                                100
                              ).toFixed(2)
                            }%

                          </strong>


                          <div className="history-mini-bar">

                            <div
                              style={{
                                width:
                                  `${Math.max(
                                    0,
                                    Math.min(
                                      registro.similitud *
                                      100,
                                      100
                                    )
                                  )}%`,
                              }}
                            />

                          </div>

                        </div>

                      </td>


                      {/* DISTANCIA */}

                      <td>

                        <span className="history-threshold">

                          {registro.distancia !== null
                            ? registro.distancia.toFixed(4)
                            : '—'}

                        </span>

                      </td>


                      {/* UMBRAL */}

                      <td>

                        <span className="history-threshold">

                          {
                            registro.umbral.toFixed(2)
                          }

                        </span>

                      </td>


                      {/* PROBABILIDAD */}

                      <td>

                        <div
                          className="history-probability"
                        >

                          <div
                            className="history-probability-value"
                          >

                            <ChartNoAxesCombined
                              size={15}
                            />

                            <strong>

                              {
                                registro.probabilidad_calibrada !== null
                                  ? `${(
                                      registro.probabilidad_calibrada *
                                      100
                                    ).toFixed(2)}%`
                                  : 'Pendiente'
                              }

                            </strong>

                          </div>


                          {registro.probabilidad_calibrada !== null && (

                            <div
                              className="history-mini-bar"
                            >

                              <div
                                style={{
                                  width:
                                    `${Math.max(
                                      0,
                                      Math.min(
                                        registro.probabilidad_calibrada *
                                        100,
                                        100
                                      )
                                    )}%`,
                                }}
                              />

                            </div>

                          )}

                        </div>

                      </td>


                      {/* RESULTADO */}

                      <td>

                        {registro.coincide ? (

                          <span className="history-badge success">

                            <CheckCircle2
                              size={15}
                            />

                            Coincidencia

                          </span>

                        ) : (

                          <span className="history-badge failure">

                            <XCircle
                              size={15}
                            />

                            No coincide

                          </span>

                        )}

                      </td>


                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  )
}


export default Historial