import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  ScanFace,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  Database,
  Clock3,
  CheckCircle2,
  History,
  XCircle,
} from 'lucide-react'

import api from '../services/api'

interface Persona {
  id: number
  nombre: string
  email: string | null
  activo: boolean
}

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

function Dashboard() {
  const [mensaje, setMensaje] = useState(
    'Conectando con el backend...'
  )

  const [personas, setPersonas] = useState<Persona[]>([])

  const [historial, setHistorial] = useState<
    RegistroHistorial[]
  >([])

  const [totalRostros, setTotalRostros] = useState(0)

  const [umbral, setUmbral] = useState(75)

  useEffect(() => {

    // =========================
    // ESTADO DEL BACKEND
    // =========================

    api.get('/api/health')
      .then((respuesta) => {
        setMensaje(respuesta.data.mensaje)
      })
      .catch(() => {
        setMensaje(
          'No se pudo conectar con el backend'
        )
      })

    // =========================
    // PERSONAS
    // =========================

    api.get('/api/personas')
      .then((respuesta) => {
        setPersonas(respuesta.data)
      })
      .catch((error) => {
        console.error(
          'Error al obtener personas:',
          error
        )
      })

    // =========================
    // TOTAL DE ROSTROS
    // =========================

    api.get('/api/personas/rostros/total')
      .then((respuesta) => {
        setTotalRostros(
          respuesta.data.total
        )
      })
      .catch((error) => {
        console.error(
          'Error al obtener rostros:',
          error
        )
      })

    // =========================
    // HISTORIAL
    // =========================

    api.get('/api/reconocimiento/historial')
      .then((respuesta) => {
        setHistorial(
          respuesta.data.resultados
        )
      })
      .catch((error) => {
        console.error(
          'Error al obtener historial:',
          error
        )
      })

    // =========================
    // UMBRAL CONFIGURADO
    // =========================

    const umbralGuardado =
      localStorage.getItem(
        'umbralReconocimiento'
      )

    if (umbralGuardado) {
      const valor = Number(
        umbralGuardado
      )

      if (
        !isNaN(valor) &&
        valor >= 0 &&
        valor <= 100
      ) {
        setUmbral(valor)
      }
    }

  }, [])

  const personasActivas =
    personas.filter(
      (persona) => persona.activo
    ).length

  const totalAnalisis =
    historial.length

  const coincidencias =
    historial.filter(
      (registro) => registro.coincide
    ).length

  const noCoincidencias =
    historial.filter(
      (registro) => !registro.coincide
    ).length

  return (
    <div className="dashboard">

      {/* CABECERA */}

      <div className="dashboard-header">

        <div>

          <span className="section-label">
            PANEL PRINCIPAL
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Monitoreo general del sistema inteligente de
            reconocimiento facial.
          </p>

        </div>

        <div className="system-status-card">

          <div className="status-icon">
            <Activity size={20} />
          </div>

          <div>

            <strong>
              Sistema operativo
            </strong>

            <span>
              {mensaje}
            </span>

          </div>

          <div className="online-indicator"></div>

        </div>

      </div>


      {/* ESTADÍSTICAS PRINCIPALES */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            <Users size={21} />
          </div>

          <div className="stat-info">

            <span>
              Personas registradas
            </span>

            <strong>
              {personas.length
                .toString()
                .padStart(2, '0')}
            </strong>

            <small>
              Identidades almacenadas
            </small>

          </div>

          <ArrowUpRight
            size={17}
            className="stat-arrow"
          />

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <ScanFace size={21} />
          </div>

          <div className="stat-info">

            <span>
              Rostros registrados
            </span>

            <strong>
              {totalRostros
                .toString()
                .padStart(2, '0')}
            </strong>

            <small>
              Embeddings disponibles
            </small>

          </div>

          <ArrowUpRight
            size={17}
            className="stat-arrow"
          />

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <ShieldCheck size={21} />
          </div>

          <div className="stat-info">

            <span>
              Personas activas
            </span>

            <strong>
              {personasActivas
                .toString()
                .padStart(2, '0')}
            </strong>

            <small>
              Registros habilitados
            </small>

          </div>

          <ArrowUpRight
            size={17}
            className="stat-arrow"
          />

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <Database size={21} />
          </div>

          <div className="stat-info">

            <span>
              Base de datos
            </span>

            <strong className="active-text">
              ONLINE
            </strong>

            <small>
              PostgreSQL conectado
            </small>

          </div>

          <div className="service-indicator"></div>

        </div>

      </div>


      {/* ESTADÍSTICAS DE RECONOCIMIENTO */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            <History size={21} />
          </div>

          <div className="stat-info">

            <span>
              Análisis realizados
            </span>

            <strong>
              {totalAnalisis
                .toString()
                .padStart(2, '0')}
            </strong>

            <small>
              Reconocimientos registrados
            </small>

          </div>

          <ArrowUpRight
            size={17}
            className="stat-arrow"
          />

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <CheckCircle2 size={21} />
          </div>

          <div className="stat-info">

            <span>
              Coincidencias
            </span>

            <strong>
              {coincidencias
                .toString()
                .padStart(2, '0')}
            </strong>

            <small>
              Rostros identificados
            </small>

          </div>

          <ArrowUpRight
            size={17}
            className="stat-arrow"
          />

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            <XCircle size={21} />
          </div>

          <div className="stat-info">

            <span>
              No coincidencias
            </span>

            <strong>
              {noCoincidencias
                .toString()
                .padStart(2, '0')}
            </strong>

            <small>
              Sin identificación
            </small>

          </div>

          <ArrowUpRight
            size={17}
            className="stat-arrow"
          />

        </div>

      </div>


      {/* CONTENIDO PRINCIPAL */}

      <div className="dashboard-grid">

        {/* PERSONAS */}

        <section className="dashboard-card">

          <div className="card-header">

            <div>

              <span className="section-label">
                IDENTIDADES
              </span>

              <h2>
                Personas registradas
              </h2>

            </div>

            <div className="card-header-icon">
              <Users size={20} />
            </div>

          </div>


          {personas.length === 0 ? (

            <div className="empty-state">

              <Users size={36} />

              <h3>
                No hay personas registradas
              </h3>

              <p>
                Registra una persona para comenzar
                a utilizar el sistema.
              </p>

            </div>

          ) : (

            <div className="people-list">

              {personas.map((persona) => (

                <div
                  className="person-row"
                  key={persona.id}
                >

                  <div className="person-avatar">

                    {persona.nombre
                      .charAt(0)
                      .toUpperCase()}

                  </div>


                  <div className="person-info">

                    <strong>
                      {persona.nombre}
                    </strong>

                    <span>
                      {persona.email ||
                        'Sin correo registrado'}
                    </span>

                  </div>


                  <div className="person-meta">

                    <span className="person-id">
                      ID {persona.id}
                    </span>

                    <span
                      className={
                        persona.activo
                          ? 'person-status active'
                          : 'person-status'
                      }
                    >
                      {persona.activo
                        ? 'Activo'
                        : 'Inactivo'}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* PANEL LATERAL */}

        <section className="dashboard-card">

          <div className="card-header">

            <div>

              <span className="section-label">
                SISTEMA
              </span>

              <h2>
                Estado actual
              </h2>

            </div>

            <div className="card-header-icon">
              <Activity size={20} />
            </div>

          </div>


          <div className="system-overview">

            <div className="overview-item">

              <div className="overview-icon">
                <CheckCircle2 size={18} />
              </div>

              <div>

                <strong>
                  API Backend
                </strong>

                <span>
                  FastAPI funcionando
                </span>

              </div>

              <span className="mini-status">
                ONLINE
              </span>

            </div>


            <div className="overview-item">

              <div className="overview-icon">
                <Database size={18} />
              </div>

              <div>

                <strong>
                  PostgreSQL
                </strong>

                <span>
                  Base de datos conectada
                </span>

              </div>

              <span className="mini-status">
                ONLINE
              </span>

            </div>


            <div className="overview-item">

              <div className="overview-icon">
                <ScanFace size={18} />
              </div>

              <div>

                <strong>
                  Motor facial
                </strong>

                <span>
                  InsightFace / ArcFace
                </span>

              </div>

              <span className="mini-status">
                READY
              </span>

            </div>


            <div className="overview-item">

              <div className="overview-icon">
                <Clock3 size={18} />
              </div>

              <div>

                <strong>
                  Umbral actual
                </strong>

                <span>
                  Criterio de coincidencia
                </span>

              </div>

              <strong className="threshold">
                {(umbral / 100).toFixed(2)}
              </strong>

            </div>

          </div>


          {/* ACCIONES */}

          <div className="quick-actions-title">
            Acceso rápido
          </div>


          <div className="quick-actions">

            <Link to="/registro">

              <div className="quick-icon">
                <Users size={19} />
              </div>

              <div>

                <strong>
                  Registrar persona
                </strong>

                <span>
                  Agregar nueva identidad
                </span>

              </div>

              <ArrowUpRight size={17} />

            </Link>


            <Link to="/reconocimiento">

              <div className="quick-icon">
                <ScanFace size={19} />
              </div>

              <div>

                <strong>
                  Reconocer rostro
                </strong>

                <span>
                  Iniciar identificación
                </span>

              </div>

              <ArrowUpRight size={17} />

            </Link>


            <Link to="/historial">

              <div className="quick-icon">
                <History size={19} />
              </div>

              <div>

                <strong>
                  Ver historial
                </strong>

                <span>
                  Consultar reconocimientos
                </span>

              </div>

              <ArrowUpRight size={17} />

            </Link>

          </div>

        </section>

      </div>

    </div>
  )
}

export default Dashboard