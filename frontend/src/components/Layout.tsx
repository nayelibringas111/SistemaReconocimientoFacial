import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UserPlus,
  ScanFace,
  History,
  ChartNoAxesCombined,
  Settings,
  Sun,
  Moon,
  LogOut,
  Users,
} from 'lucide-react'
import { useState } from 'react'

function Layout() {
  const [modoOscuro, setModoOscuro] = useState(
    localStorage.getItem('modoOscuro') === 'true'
  )

  const navigate = useNavigate()

  const usuarioGuardado = localStorage.getItem('usuario')

  let usuario: {
    nombre?: string
    rol?: string
  } = {}

  try {
    usuario = usuarioGuardado
      ? JSON.parse(usuarioGuardado)
      : {}
  } catch {
    usuario = {}
  }

  const esAdministrador = usuario.rol === 'administrador'

  const cambiarModo = () => {
    const nuevoModo = !modoOscuro
    setModoOscuro(nuevoModo)
    localStorage.setItem('modoOscuro', String(nuevoModo))
  }

  const cerrarSesion = () => {
    localStorage.removeItem('autenticado')
    localStorage.removeItem('usuario')
    localStorage.removeItem('token')

    navigate('/login', { replace: true })
  }

  return (
    <div className={modoOscuro ? 'app dark' : 'app'}>

      <aside className="sidebar">

        {/* LOGO */}
        <div className="logo">
          <div className="logo-icon">
            <ScanFace size={25} strokeWidth={1.7} />
          </div>

          <div className="aurea-brand">
            <h2>
              AUREA <span>IV</span>
            </h2>

            <small>IDENTIDAD INTELIGENTE</small>
          </div>
        </div>

        {/* MENÚ PRINCIPAL */}
        <nav className="menu">

          <NavLink to="/" end>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/registro">
            <UserPlus size={20} />
            <span>Registro facial</span>
          </NavLink>

          <NavLink to="/reconocimiento">
            <ScanFace size={20} />
            <span>Reconocimiento</span>
          </NavLink>

          <NavLink to="/historial">
            <History size={20} />
            <span>Historial</span>
          </NavLink>

          <NavLink to="/probabilidades">
            <ChartNoAxesCombined size={20} />
            <span>Probabilidades</span>
          </NavLink>

          {/* SOLO ADMINISTRADOR */}
          {esAdministrador && (
            <NavLink to="/usuarios">
              <Users size={20} />
              <span>Usuarios</span>
            </NavLink>
          )}

        </nav>

        {/* PARTE INFERIOR */}
        <div className="sidebar-bottom">

          {/* SOLO ADMINISTRADOR */}
          {esAdministrador && (
            <NavLink
              to="/configuracion"
              className="settings-button"
            >
              <Settings size={20} />
              <span>Configuración</span>
            </NavLink>
          )}

          <button
            className="theme-button"
            onClick={cambiarModo}
          >
            {modoOscuro ? (
              <>
                <Sun size={20} />
                <span>Modo claro</span>
              </>
            ) : (
              <>
                <Moon size={20} />
                <span>Modo oscuro</span>
              </>
            )}
          </button>

          <button
            className="theme-button"
            onClick={cerrarSesion}
          >
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>

        </div>

      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">

        <header className="topbar">

          <div className="topbar-brand">
            <span className="topbar-label">
              AUREA IV · IDENTIDAD INTELIGENTE
            </span>

            <h1>Reconocimiento Facial</h1>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            Sistema activo
          </div>

        </header>

        <section className="page-content">
          <Outlet />
        </section>

      </main>

    </div>
  )
}

export default Layout