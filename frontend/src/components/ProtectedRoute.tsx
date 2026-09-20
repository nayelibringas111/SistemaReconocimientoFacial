import { Navigate, Outlet } from 'react-router-dom'

interface ProtectedRouteProps {
  rolesPermitidos?: string[]
}

function ProtectedRoute({
  rolesPermitidos,
}: ProtectedRouteProps) {
  const autenticado =
    localStorage.getItem('autenticado') === 'true'

  const usuarioGuardado =
    localStorage.getItem('usuario')

  if (!autenticado || !usuarioGuardado) {
    return <Navigate to="/login" replace />
  }

  let usuario

  try {
    usuario = JSON.parse(usuarioGuardado)
  } catch {
    localStorage.removeItem('autenticado')
    localStorage.removeItem('usuario')

    return <Navigate to="/login" replace />
  }

  if (
    rolesPermitidos &&
    !rolesPermitidos.includes(usuario.rol)
  ) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute