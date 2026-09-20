import { useEffect, useState } from 'react'
import {
  UserPlus,
  Camera,
  CheckCircle2,
  ScanFace,
  Mail,
  User,
  ShieldCheck,
  RotateCcw,
  Layers3,
  Users,
} from 'lucide-react'

import api from '../services/api'

import {
  cargarModelos,
  obtenerEmbedding,
  SinRostroError,
  NOMBRE_MODELO,
} from '../services/faceEmbedding'

const MAX_REPRESENTACIONES = 5

interface Persona {
  id: number
  nombre: string
  email: string | null
  activo: boolean
}

function RegistroFacial() {
  const [personas, setPersonas] = useState<Persona[]>([])

  const [modo, setModo] = useState<'nueva' | 'existente'>('nueva')

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')

  const [personaId, setPersonaId] = useState<number | null>(null)
  const [personaSeleccionada, setPersonaSeleccionada] =
    useState<Persona | null>(null)

  const [totalRepresentaciones, setTotalRepresentaciones] =
    useState(0)

  const [imagen, setImagen] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [modelosListos, setModelosListos] = useState(false)

  // Cargar personas existentes
  const cargarPersonas = async () => {
    try {
      const respuesta = await api.get('/api/personas')

      setPersonas(respuesta.data)
    } catch (error) {
      console.error(
        'Error al cargar personas:',
        error
      )
    }
  }

  useEffect(() => {
    cargarPersonas()
  }, [])

  // Los modelos de reconocimiento (~6.8 MB) se descargan al entrar
  // a la pantalla para que la captura sea inmediata.
  useEffect(() => {
    let activo = true

    cargarModelos()
      .then(() => {
        if (activo) {
          setModelosListos(true)
        }
      })
      .catch((error) => {
        console.error(error)

        if (activo) {
          setMensaje(
            'No se pudieron cargar los modelos de reconocimiento.'
          )
        }
      })

    return () => {
      activo = false
    }
  }, [])

  // Consultar representaciones de una persona
  const cargarRepresentaciones = async (
    id: number
  ) => {
    try {
      const respuesta = await api.get(
        `/api/personas/${id}/rostros`
      )

      setTotalRepresentaciones(
        respuesta.data.total
      )
    } catch (error) {
      console.error(
        'Error al consultar representaciones:',
        error
      )
    }
  }

  // Seleccionar persona existente
  const seleccionarPersona = async (
    id: number
  ) => {
    const persona = personas.find(
      (item) => item.id === id
    )

    if (!persona) return

    setPersonaSeleccionada(persona)
    setPersonaId(persona.id)
    setNombre(persona.nombre)
    setEmail(persona.email || '')
    setMensaje('')

    await cargarRepresentaciones(persona.id)
  }

  // Registrar una persona nueva
  const registrarPersona = async () => {
    if (!nombre.trim()) {
      setMensaje(
        'Ingresa el nombre de la persona.'
      )
      return
    }

    try {
      setProcesando(true)
      setMensaje(
        'Registrando información...'
      )

      const respuesta = await api.post(
        '/api/personas',
        {
          nombre: nombre.trim(),
          email: email || null,
        }
      )

      const nuevaPersona: Persona = {
        id: respuesta.data.id,
        nombre: respuesta.data.nombre,
        email: respuesta.data.email,
        activo: respuesta.data.activo,
      }

      setPersonaId(nuevaPersona.id)
      setPersonaSeleccionada(nuevaPersona)
      setTotalRepresentaciones(0)

      setPersonas((personasActuales) => [
        ...personasActuales,
        nuevaPersona,
      ])

      setMensaje(
        'Persona registrada correctamente.'
      )

    } catch (error) {
      console.error(error)

      setMensaje(
        'No se pudo registrar la persona.'
      )
    } finally {
      setProcesando(false)
    }
  }

  // Capturar y registrar rostro
  const capturarYRegistrarRostro = async () => {
    if (!personaId) {
      setMensaje(
        'Primero selecciona o registra una persona.'
      )
      return
    }

    if (
      totalRepresentaciones >=
      MAX_REPRESENTACIONES
    ) {
      setMensaje(
        'Esta persona ya tiene el máximo de 5 representaciones faciales.'
      )
      return
    }

    setProcesando(true)
    setImagen(null)

    setMensaje(
      'Analizando rostro con Inteligencia Artificial...'
    )

    try {
      /*
       * Capturamos la imagen directamente
       * desde la cámara del navegador.
       */
      const video = document.querySelector(
        'video'
      ) as HTMLVideoElement | null

      if (!video) {
        setMensaje(
          'No se encontró la cámara.'
        )
        return
      }

      const canvas =
        document.createElement('canvas')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const contexto =
        canvas.getContext('2d')

      if (!contexto) {
        setMensaje(
          'No se pudo procesar la imagen.'
        )
        return
      }

      contexto.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      )

      const captura =
        canvas.toDataURL(
          'image/jpeg',
          0.9
        )

      setImagen(captura)

      /*
       * El vector facial se calcula AQUÍ, en el navegador.
       * Al backend solo se le envían los 128 números;
       * la foto nunca sale de este dispositivo.
       */
      const embedding =
        await obtenerEmbedding(canvas)

      const resultado =
        await api.post(
          `/api/personas/${personaId}/rostro`,
          {
            embedding,
            modelo: NOMBRE_MODELO,
          }
        )

      setTotalRepresentaciones(
        resultado.data.representaciones_actuales
      )

      setMensaje(
        `${resultado.data.mensaje} Representaciones: ${resultado.data.representaciones_actuales}/${MAX_REPRESENTACIONES}.`
      )

    } catch (error: any) {
      console.error(error)

      if (error instanceof SinRostroError) {
        setMensaje(
          'No se detectó ningún rostro. Acércate a la cámara, ' +
          'mira de frente y asegúrate de tener buena iluminación.'
        )
      } else {
        const detalle =
          error?.response?.data?.detail

        setMensaje(
          detalle ||
          'No se pudo registrar el rostro.'
        )
      }

      setImagen(null)

    } finally {
      setProcesando(false)
    }
  }

  const nuevoRegistro = () => {
    setModo('nueva')
    setNombre('')
    setEmail('')
    setPersonaId(null)
    setPersonaSeleccionada(null)
    setTotalRepresentaciones(0)
    setImagen(null)
    setMensaje('')
    setProcesando(false)
  }

  const cambiarModo = (
    nuevoModo: 'nueva' | 'existente'
  ) => {
    setModo(nuevoModo)

    setNombre('')
    setEmail('')
    setPersonaId(null)
    setPersonaSeleccionada(null)
    setTotalRepresentaciones(0)
    setImagen(null)
    setMensaje('')
  }

  const maximoAlcanzado =
    totalRepresentaciones >=
    MAX_REPRESENTACIONES

  return (
    <div className="registration-page">

      {/* CABECERA */}

      <div className="dashboard-header">

        <div>

          <span className="section-label">
            GESTIÓN DE IDENTIDADES
          </span>

          <h1>
            Registro Facial
          </h1>

          <p>
            Registra una persona nueva o agrega
            representaciones faciales a una persona existente.
          </p>

        </div>

        <div className="registration-security">

          <ShieldCheck size={19} />

          <span>
            Datos procesados de forma segura
          </span>

        </div>

      </div>


      {/* SELECTOR DE MODO */}

      {!personaId && (

        <section className="registration-mode">

          <button
            className={
              modo === 'nueva'
                ? 'registration-mode-button active'
                : 'registration-mode-button'
            }
            onClick={() =>
              cambiarModo('nueva')
            }
          >

            <UserPlus size={18} />

            <div>

              <strong>
                Nueva persona
              </strong>

              <span>
                Registrar una nueva identidad
              </span>

            </div>

          </button>


          <button
            className={
              modo === 'existente'
                ? 'registration-mode-button active'
                : 'registration-mode-button'
            }
            onClick={() =>
              cambiarModo('existente')
            }
          >

            <Users size={18} />

            <div>

              <strong>
                Persona existente
              </strong>

              <span>
                Agregar otra representación facial
              </span>

            </div>

          </button>

        </section>

      )}


      {/* CONTENIDO */}

      <div className="registration-grid">


        {/* INFORMACIÓN */}

        <section className="registration-card">

          <div className="card-header">

            <div>

              <span className="section-label">
                PASO 01
              </span>

              <h2>
                {modo === 'nueva'
                  ? 'Información personal'
                  : 'Seleccionar persona'}
              </h2>

            </div>

            <div className="card-header-icon">

              {modo === 'nueva'
                ? <UserPlus size={20} />
                : <Users size={20} />}

            </div>

          </div>


          {modo === 'existente' &&
          !personaId ? (

            <div className="form-group">

              <label>
                <Users size={15} />
                Persona registrada
              </label>

              <select
                value=""
                onChange={(e) =>
                  seleccionarPersona(
                    Number(e.target.value)
                  )
                }
              >

                <option value="">
                  Selecciona una persona
                </option>

                {personas.map(
                  (persona) => (
                    <option
                      key={persona.id}
                      value={persona.id}
                    >
                      {persona.nombre} — ID {persona.id}
                    </option>
                  )
                )}

              </select>

            </div>

          ) : modo === 'nueva' &&
            !personaId ? (

            <>

              <div className="form-group">

                <label>
                  <User size={15} />
                  Nombre completo
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(
                      e.target.value
                    )
                  }
                  placeholder="Ej. Nayeli Ariana"
                />

              </div>


              <div className="form-group">

                <label>
                  <Mail size={15} />
                  Correo electrónico
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="correo@ejemplo.com"
                />

              </div>


              <button
                className="primary-action"
                onClick={
                  registrarPersona
                }
                disabled={procesando}
              >

                <UserPlus size={18} />

                {procesando
                  ? 'Registrando...'
                  : 'Registrar persona'}

              </button>

            </>

          ) : (

            <>

              <div className="registered-message">

                <CheckCircle2 size={19} />

                <div>

                  <strong>
                    {personaSeleccionada?.nombre}
                  </strong>

                  <span>
                    ID de registro: {personaId}
                  </span>

                </div>

              </div>


              <div className="face-counter">

                <div className="face-counter-icon">

                  <Layers3 size={18} />

                </div>

                <div className="face-counter-info">

                  <span>
                    Representaciones faciales
                  </span>

                  <strong>
                    {totalRepresentaciones}/
                    {MAX_REPRESENTACIONES}
                  </strong>

                </div>

              </div>

            </>

          )}

        </section>


        {/* CÁMARA */}

        <section className="registration-card camera-card">

          <div className="card-header">

            <div>

              <span className="section-label">
                PASO 02
              </span>

              <h2>
                Captura facial
              </h2>

            </div>

            <div className="card-header-icon">
              <ScanFace size={20} />
            </div>

          </div>


          {!personaId ? (

            <div className="camera-locked">

              <div className="locked-icon">
                <Camera size={32} />
              </div>

              <h3>
                Cámara bloqueada
              </h3>

              <p>
                Primero selecciona o registra
                una persona para habilitar
                la captura facial.
              </p>

            </div>

          ) : (

            <>

              <div className="camera-container">

                <video
                  autoPlay
                  playsInline
                  muted
                  className="webcam"
                  ref={(video) => {

                    if (
                      video &&
                      !video.srcObject
                    ) {

                      navigator.mediaDevices
                        .getUserMedia({
                          video: true,
                          audio: false,
                        })
                        .then(
                          (stream) => {
                            video.srcObject =
                              stream
                          }
                        )
                        .catch(
                          () => {
                            setMensaje(
                              'No se pudo acceder a la cámara.'
                            )
                          }
                        )

                    }

                  }}
                />

                <div className="face-frame">
                  <span></span>
                </div>

                <div className="camera-label">
                  <span className="camera-dot"></span>
                  Cámara activa
                </div>

              </div>


              <button
                className="capture-action"
                onClick={
                  capturarYRegistrarRostro
                }
                disabled={
                  procesando ||
                  maximoAlcanzado ||
                  !modelosListos
                }
              >

                <Camera size={18} />

                {maximoAlcanzado
                  ? 'Máximo alcanzado'
                  : procesando
                    ? 'Procesando rostro...'
                    : !modelosListos
                      ? 'Preparando el motor...'
                      : 'Capturar y registrar rostro'}

              </button>


              {maximoAlcanzado && (

                <div className="registration-limit">

                  <CheckCircle2 size={17} />

                  <span>
                    Esta persona ya tiene las
                    5 representaciones permitidas.
                  </span>

                </div>

              )}

            </>

          )}

        </section>

      </div>


      {/* RESULTADO */}

      {mensaje && (

        <div
          className={
            mensaje.includes(
              'correctamente'
            )
              ? 'registration-result success'
              : 'registration-result'
          }
        >

          <div className="result-icon">

            {mensaje.includes(
              'correctamente'
            ) ? (
              <CheckCircle2 size={21} />
            ) : (
              <ScanFace size={21} />
            )}

          </div>

          <div>

            <strong>
              {mensaje.includes(
                'correctamente'
              )
                ? 'Registro completado'
                : 'Estado del proceso'}
            </strong>

            <span>
              {mensaje}
            </span>

          </div>

        </div>

      )}


      {/* IMAGEN CAPTURADA */}

      {imagen && (

        <section className="captured-card">

          <div className="card-header">

            <div>

              <span className="section-label">
                RESULTADO
              </span>

              <h2>
                Imagen capturada
              </h2>

            </div>

            <CheckCircle2 size={20} />

          </div>


          <div className="captured-content">

            <div className="captured-image-wrapper">

              <img
                src={imagen}
                alt="Rostro capturado"
              />

            </div>


            <div className="captured-info">

              <div className="captured-check">

                <CheckCircle2 size={19} />

                <div>

                  <strong>
                    Rostro procesado
                  </strong>

                  <span>
                    La imagen fue procesada mediante
                    el motor de reconocimiento facial.
                  </span>

                </div>

              </div>


              <div className="captured-data">

                <div>

                  <span>
                    Persona
                  </span>

                  <strong>
                    {personaSeleccionada?.nombre}
                  </strong>

                </div>


                <div>

                  <span>
                    ID
                  </span>

                  <strong>
                    {personaId}
                  </strong>

                </div>


                <div>

                  <span>
                    Representaciones
                  </span>

                  <strong>
                    {totalRepresentaciones}/
                    {MAX_REPRESENTACIONES}
                  </strong>

                </div>

              </div>


              <button
                className="secondary-action"
                onClick={
                  nuevoRegistro
                }
              >

                <RotateCcw size={17} />

                Registrar otra persona

              </button>

            </div>

          </div>

        </section>

      )}

    </div>
  )
}

export default RegistroFacial