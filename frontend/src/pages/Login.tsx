import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  ScanFace,
  ShieldCheck,
  UserPlus,
  Mail,
  LockKeyhole,
  User,
  Sparkles,
} from 'lucide-react'

import api from '../services/api'

function Login() {
  const navigate = useNavigate()

  const [modoRegistro, setModoRegistro] = useState(false)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [mostrarPassword, setMostrarPassword] = useState(false)

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const iniciarSesion = async (
  event: React.FormEvent<HTMLFormElement>
) => {
    event.preventDefault()

    setError('')
    setMensaje('')
    setCargando(true)

    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      })

      localStorage.setItem(
        'autenticado',
        'true'
      )

      localStorage.setItem(
        'token',
        response.data.token
      )

      localStorage.setItem(
        'usuario',
        JSON.stringify(
          response.data.usuario
        )
      )

      navigate('/', {
        replace: true,
      })
    } catch (err: any) {
      const detalle =
        err?.response?.data?.detail

      setError(
        typeof detalle === 'string'
          ? detalle
          : 'No se pudo iniciar sesión. Verifica tus datos.'
      )
    } finally {
      setCargando(false)
    }
  }

  const registrarUsuario = async (
  event: React.FormEvent<HTMLFormElement>
) => {
    event.preventDefault()

    setError('')
    setMensaje('')

    if (nombre.trim().length < 2) {
      setError(
        'El nombre debe tener al menos 2 caracteres.'
      )
      return
    }

    if (password.length < 8) {
      setError(
        'La contraseña debe tener al menos 8 caracteres.'
      )
      return
    }

    setCargando(true)

    try {
      await api.post('/api/auth/registro', {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
      })

      setMensaje(
        'Cuenta creada correctamente. Ya puedes iniciar sesión.'
      )

      setNombre('')
      setEmail('')
      setPassword('')

      setModoRegistro(false)
    } catch (err: any) {
      const detalle =
        err?.response?.data?.detail

      setError(
        typeof detalle === 'string'
          ? detalle
          : 'No se pudo crear la cuenta.'
      )
    } finally {
      setCargando(false)
    }
  }

  const cambiarModo = () => {
    setModoRegistro(!modoRegistro)

    setError('')
    setMensaje('')

    setNombre('')
    setEmail('')
    setPassword('')

    setMostrarPassword(false)
  }

  return (
    <div className="login-page">

      <div className="login-shell">

        {/* =========================================
            PANEL VISUAL
        ========================================== */}

        <section className="login-visual">

          <div className="login-visual-overlay"></div>

          <div className="login-visual-content">

            <div className="login-visual-brand">

              <div className="login-visual-icon">
                <ScanFace
                  size={22}
                  strokeWidth={1.5}
                />
              </div>

              <div>
                <strong>
                  AUREA IV
                </strong>

                <span>
                  IDENTIDAD INTELIGENTE
                </span>
              </div>

            </div>


            <div className="login-visual-text">

              <div className="login-eyebrow">
                <Sparkles size={14} />
                EXPERIENCIA PRIVADA
              </div>

              <h2>
                Donde la identidad
                <br />
                <em>
                  abre nuevas posibilidades.
                </em>
              </h2>

              <p>
                Una experiencia inteligente para
                validar identidades mediante
                reconocimiento facial y tecnología
                de inteligencia artificial.
              </p>

            </div>


            <div className="login-visual-footer">

              <div className="visual-line"></div>

              <span>
                RECONOCIMIENTO FACIAL · IA
              </span>

            </div>

          </div>

        </section>


        {/* =========================================
            PANEL DE LOGIN
        ========================================== */}

        <section className="login-panel">

          <div className="login-panel-inner">

            <div className="login-mobile-brand">

              <div className="login-logo">

                <ScanFace
                  size={26}
                  strokeWidth={1.6}
                />

              </div>

              <div>

                <strong>
                  AUREA IV
                </strong>

                <span>
                  IDENTIDAD INTELIGENTE
                </span>

              </div>

            </div>


            <div className="login-heading">

              <span className="login-kicker">
                {modoRegistro
                  ? 'NUEVO ACCESO'
                  : 'ACCESO SEGURO'}
              </span>

              <h1>
                {modoRegistro
                  ? 'Crear una cuenta'
                  : 'Bienvenido de nuevo'}
              </h1>

              <p>
                {modoRegistro
                  ? 'Registra tus datos para acceder al sistema.'
                  : 'Ingresa tus credenciales para continuar.'}
              </p>

            </div>


            {mensaje && (
              <div className="login-message success">

                <ShieldCheck size={18} />

                <span>
                  {mensaje}
                </span>

              </div>
            )}


            {error && (
              <div className="login-message error">

                <span>
                  {error}
                </span>

              </div>
            )}


            <form
              className="login-form"
              onSubmit={
                modoRegistro
                  ? registrarUsuario
                  : iniciarSesion
              }
            >

              {/* NOMBRE SOLO EN REGISTRO */}

              {modoRegistro && (
                <div className="login-field">

                  <label htmlFor="nombre">
                    Nombre completo
                  </label>

                  <div className="login-input-wrapper">

                    <User size={18} />

                    <input
                      id="nombre"
                      type="text"
                      placeholder="Ingresa tu nombre"
                      value={nombre}
                      onChange={(event) =>
                        setNombre(
                          event.target.value
                        )
                      }
                      autoComplete="name"
                      required
                    />

                  </div>

                </div>
              )}


              {/* CORREO */}

              <div className="login-field">

                <label htmlFor="email">
                  Correo electrónico
                </label>

                <div className="login-input-wrapper">

                  <Mail size={18} />

                  <input
                    id="email"
                    type="email"
                    placeholder="nombre@correo.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    autoComplete="email"
                    required
                  />

                </div>

              </div>


              {/* CONTRASEÑA */}

              <div className="login-field">

                <label htmlFor="password">
                  Contraseña
                </label>

                <div className="login-input-wrapper">

                  <LockKeyhole size={18} />

                  <input
                    id="password"
                    type={
                      mostrarPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    autoComplete={
                      modoRegistro
                        ? 'new-password'
                        : 'current-password'
                    }
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setMostrarPassword(
                        !mostrarPassword
                      )
                    }
                    aria-label={
                      mostrarPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {mostrarPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>


              {/* BOTÓN */}

              <button
                type="submit"
                className="login-button"
                disabled={cargando}
              >

                {cargando ? (
                  <span>
                    Procesando...
                  </span>
                ) : (
                  <>
                    <span>
                      {modoRegistro
                        ? 'Crear cuenta'
                        : 'Iniciar sesión'}
                    </span>

                    <ArrowRight
                      size={19}
                      strokeWidth={1.8}
                    />
                  </>
                )}

              </button>

            </form>


            {/* DIVISOR */}

            <div className="login-divider">

              <span></span>

              <small>
                o
              </small>

              <span></span>

            </div>


            {/* REGISTRO */}

            <div className="login-switch">

              <span>
                {modoRegistro
                  ? '¿Ya tienes una cuenta?'
                  : '¿No tienes una cuenta?'}
              </span>

              <button
                type="button"
                onClick={cambiarModo}
              >

                {modoRegistro
                  ? 'Iniciar sesión'
                  : 'Registrarse'}

                {!modoRegistro && (
                  <UserPlus size={15} />
                )}

              </button>

            </div>


            {/* SEGURIDAD */}

            <div className="login-security">

              <ShieldCheck size={17} />

              <div>

                <strong>
                  Acceso protegido
                </strong>

                <span>
                  Autenticación segura mediante
                  credenciales y control de acceso.
                </span>

              </div>

            </div>


            {/* FOOTER */}

            <footer className="login-footer">

              <span>
                AUREA IV
              </span>

              <span className="footer-dot">
                •
              </span>

              <span>
                Sistema inteligente de
                reconocimiento facial
              </span>

            </footer>

          </div>

        </section>

      </div>

    </div>
  )
}

export default Login