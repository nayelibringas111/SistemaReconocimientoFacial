import { useEffect, useState } from 'react'
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react'

import api from '../services/api'

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
  activo: boolean
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarUsuarios = async () => {
    try {
      setCargando(true)
      setError('')

      const respuesta = await api.get<Usuario[]>(
        '/api/usuarios'
      )

      setUsuarios(respuesta.data)
    } catch (error: any) {
      console.error(error)

      setError(
        error.response?.data?.detail ||
        'No se pudieron cargar los usuarios.'
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const administradores = usuarios.filter(
    (usuario) =>
      usuario.rol === 'administrador'
  ).length

  const operadores = usuarios.filter(
    (usuario) =>
      usuario.rol === 'operador'
  ).length

  const activos = usuarios.filter(
    (usuario) => usuario.activo
  ).length

  return (
    <div className="configuration-page">

      {/* ENCABEZADO */}

      <header className="configuration-header">

        <div>
          <span className="configuration-section-label">
            SEGURIDAD DEL SISTEMA
          </span>

          <h1>
            Usuarios
          </h1>

          <p>
            Consulta y administra los usuarios
            autorizados para acceder al sistema.
          </p>
        </div>

        <div className="configuration-header-status">
          <span className="configuration-status-dot"></span>

          <span className="configuration-status-text">
            Control de acceso activo
          </span>
        </div>

      </header>

      {/* RESUMEN */}

      <section className="configuration-grid">

        <article className="configuration-card">

          <div className="configuration-card-header">

            <div className="configuration-card-icon">
              <Users size={20} />
            </div>

            <span className="configuration-badge">
              TOTAL
            </span>

          </div>

          <span className="configuration-category">
            USUARIOS
          </span>

          <h2>
            {usuarios.length}
          </h2>

          <p>
            Usuarios registrados en el sistema.
          </p>

        </article>

        <article className="configuration-card">

          <div className="configuration-card-header">

            <div className="configuration-card-icon">
              <ShieldCheck size={20} />
            </div>

            <span className="configuration-badge">
              ADMIN
            </span>

          </div>

          <span className="configuration-category">
            ADMINISTRADORES
          </span>

          <h2>
            {administradores}
          </h2>

          <p>
            Usuarios con permisos administrativos.
          </p>

        </article>

        <article className="configuration-card">

          <div className="configuration-card-header">

            <div className="configuration-card-icon">
              <UserCheck size={20} />
            </div>

            <span className="configuration-badge">
              ACTIVOS
            </span>

          </div>

          <span className="configuration-category">
            CUENTAS ACTIVAS
          </span>

          <h2>
            {activos}
          </h2>

          <p>
            Cuentas habilitadas actualmente.
          </p>

        </article>

      </section>

      {/* TABLA DE USUARIOS */}

      <section
        className="configuration-card"
        style={{
          marginTop: '24px',
        }}
      >

        <div className="configuration-card-header">

          <div>
            <span className="configuration-category">
              CONTROL DE ACCESO
            </span>

            <h2>
              Usuarios registrados
            </h2>
          </div>

          <Users size={22} />

        </div>

        {cargando && (
          <p>
            Cargando usuarios...
          </p>
        )}

        {error && (
          <p
            style={{
              color: '#b42318',
              marginTop: '16px',
            }}
          >
            {error}
          </p>
        )}

        {!cargando && !error && (
          <>
            <div
              style={{
                overflowX: 'auto',
                marginTop: '20px',
              }}
            >

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >

                <thead>

                  <tr>

                    <th style={estiloCelda}>
                      Nombre
                    </th>

                    <th style={estiloCelda}>
                      Correo
                    </th>

                    <th style={estiloCelda}>
                      Rol
                    </th>

                    <th style={estiloCelda}>
                      Estado
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {usuarios.map((usuario) => (

                    <tr key={usuario.id}>

                      <td style={estiloCelda}>
                        {usuario.nombre}
                      </td>

                      <td style={estiloCelda}>
                        {usuario.email}
                      </td>

                      <td style={estiloCelda}>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >

                          <ShieldCheck size={16} />

                          {usuario.rol ===
                          'administrador'
                            ? 'Administrador'
                            : 'Operador'}

                        </span>

                      </td>

                      <td style={estiloCelda}>

                        {usuario.activo ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >

                            <UserCheck size={16} />

                            Activo

                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >

                            <UserX size={16} />

                            Inactivo

                          </span>
                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div
              style={{
                marginTop: '18px',
                fontSize: '14px',
                opacity: 0.7,
              }}
            >
              Administradores: {administradores}
              {' · '}
              Operadores: {operadores}
            </div>

          </>
        )}

      </section>

    </div>
  )
}

const estiloCelda: React.CSSProperties = {
  padding: '14px 12px',
  textAlign: 'left',
  borderBottom:
    '1px solid rgba(15, 92, 85, 0.12)',
}

export default Usuarios