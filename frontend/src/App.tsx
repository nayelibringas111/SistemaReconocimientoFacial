import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import './styles.css'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Dashboard from './pages/Dashboard'
import RegistroFacial from './pages/RegistroFacial'
import Reconocimiento from './pages/Reconocimiento'
import Historial from './pages/Historial'
import Probabilidades from './pages/Probabilidades'
import Configuracion from './pages/Configuracion'
import Usuarios from './pages/Usuarios'
import Login from './pages/Login'

function App() {
  const autenticado =
    localStorage.getItem('autenticado') === 'true'

  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            LOGIN
        ========================== */}

        <Route
          path="/login"
          element={
            autenticado ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />

        {/* =========================
            RUTAS PROTEGIDAS
        ========================== */}

        <Route element={<ProtectedRoute />}>

          <Route element={<Layout />}>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/registro"
              element={<RegistroFacial />}
            />

            <Route
              path="/reconocimiento"
              element={<Reconocimiento />}
            />

            <Route
              path="/historial"
              element={<Historial />}
            />

            <Route
              path="/probabilidades"
              element={<Probabilidades />}
            />

            {/* =========================
                SOLO ADMINISTRADOR
            ========================== */}

            <Route
              element={
                <ProtectedRoute
                  rolesPermitidos={[
                    'administrador',
                  ]}
                />
              }
            >

              <Route
                path="/configuracion"
                element={<Configuracion />}
              />

              <Route
                path="/usuarios"
                element={<Usuarios />}
              />

            </Route>

          </Route>

        </Route>

        {/* =========================
            RUTA NO ENCONTRADA
        ========================== */}

        <Route
          path="*"
          element={
            <Navigate
              to={
                autenticado
                  ? '/'
                  : '/login'
              }
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App