import { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'

import {
  ScanFace,
  ShieldCheck,
  Target,
  Activity,
  CheckCircle2,
} from 'lucide-react'

import api from '../services/api'

import {
  cargarModelos,
  obtenerEmbeddingDesdeDataURL,
  SinRostroError,
  NOMBRE_MODELO,
} from '../services/faceEmbedding'

import FaceResultCard from '../components/FaceResultCard'

import type { ResultadoReconocimiento } from '../types/facial'


function Reconocimiento() {
  const webcamRef = useRef<Webcam>(null)

  const [imagen, setImagen] =
    useState<string | null>(null)

  const [mensaje, setMensaje] =
    useState('')

  const [resultado, setResultado] =
    useState<ResultadoReconocimiento | null>(null)

  const [procesando, setProcesando] =
    useState(false)

  const [etapaAnalisis, setEtapaAnalisis] =
    useState('')

  const [pasoAnalisis, setPasoAnalisis] =
    useState(1)

  const [modelosListos, setModelosListos] =
    useState(false)


  // Pequeña espera para mostrar visualmente
  // las etapas del análisis
  const esperar = (milisegundos: number) => {
    return new Promise((resolve) =>
      setTimeout(resolve, milisegundos)
    )
  }


  // Los modelos de reconocimiento (~6.8 MB) se descargan al
  // entrar a la pantalla, no al pulsar el botón, para que la
  // captura sea inmediata.
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


  const capturarRostro = async () => {
    const captura =
      webcamRef.current?.getScreenshot()

    if (!captura) {
      setMensaje(
        'No se pudo capturar la imagen.'
      )
      return
    }

    setImagen(captura)
    setResultado(null)
    setMensaje('')
    setProcesando(true)
    setPasoAnalisis(1)


    try {
      // ETAPA 1
      setEtapaAnalisis(
        'Cargando modelos de reconocimiento...'
      )

      await cargarModelos()


      // ETAPA 2
      setPasoAnalisis(2)

      setEtapaAnalisis(
        'Detectando rostro y analizando características...'
      )

      await esperar(200)


      // ETAPA 3
      // El vector facial se calcula AQUÍ, en el navegador.
      // La imagen nunca se envía al servidor.
      setPasoAnalisis(3)

      setEtapaAnalisis(
        'Generando representación facial...'
      )

      const embedding =
        await obtenerEmbeddingDesdeDataURL(captura)


      // ETAPA 4
      setPasoAnalisis(4)

      setEtapaAnalisis(
        'Comparando con rostros registrados...'
      )


      const respuestaApi =
        await api.post(
          '/api/reconocimiento',
          {
            embedding,
            modelo: NOMBRE_MODELO,
          }
        )


      const datos =
        respuestaApi.data


      await esperar(500)


      // ETAPA FINAL
      setPasoAnalisis(5)

      setEtapaAnalisis(
        'Análisis completado'
      )


      setMensaje(
        datos.mensaje || ''
      )


      setResultado({
        persona_id:
          datos.persona_id,

        persona_nombre:
          datos.persona_nombre,

        similitud:
          datos.similitud,

        distancia:
          datos.distancia,

        umbral:
          datos.umbral,

        coincide:
          datos.coincide,

        probabilidad_calibrada:
          datos.probabilidad_calibrada,

        historial_id:
          datos.historial_id,
      })


      await esperar(600)

    } catch (error: any) {
      console.error(error)

      if (error instanceof SinRostroError) {
        setMensaje(
          'No se detectó ningún rostro. Acércate a la cámara, ' +
          'mira de frente y asegúrate de tener buena iluminación.'
        )
      } else {
        setMensaje(
          error?.response?.data?.detail ||
          'No se pudo procesar el rostro.'
        )
      }

      setEtapaAnalisis('')

    } finally {
      setProcesando(false)
    }
  }


  const nuevoAnalisis = () => {
    setImagen(null)
    setMensaje('')
    setResultado(null)
    setEtapaAnalisis('')
    setPasoAnalisis(1)
  }


  return (
    <div className="recognition-page">

      {/* CABECERA */}

      <div className="dashboard-header">

        <div>

          <span className="section-label">
            IDENTIFICACIÓN INTELIGENTE
          </span>

          <h1>
            Reconocimiento Facial
          </h1>

          <p>
            Analiza un rostro mediante Inteligencia
            Artificial y compáralo con las identidades
            registradas en el sistema.
          </p>

        </div>


        <div className="recognition-security">

          <ShieldCheck size={19} />

          <span>
            Procesamiento mediante IA
          </span>

        </div>

      </div>


      {/* CONTENIDO PRINCIPAL */}

      <div className="recognition-grid">


        {/* CÁMARA */}

        <section
          className="recognition-card camera-recognition-card"
        >

          <div className="card-header">

            <div>

              <span className="section-label">
                ANÁLISIS
              </span>

              <h2>
                Captura facial
              </h2>

            </div>

            <div className="card-header-icon">

              <ScanFace size={20} />

            </div>

          </div>


          <div className="recognition-camera-wrapper">

            <div className="recognition-camera">

              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="recognition-webcam"
              />

              <div className="recognition-frame">
                <span></span>
              </div>

              <div className="recognition-camera-status">

                <span className="recognition-camera-dot"></span>

                Cámara lista

              </div>


              {/* PANEL DE ANÁLISIS */}

              {procesando && (

                <div className="analysis-overlay">

                  <div className="analysis-loader">

                    <Activity size={22} />

                  </div>


                  <div className="analysis-content">

                    <strong>
                      Análisis facial en curso
                    </strong>

                    <span>
                      {etapaAnalisis}
                    </span>


                    <div className="analysis-steps">


                      {/* PASO 1 */}

                      <div
                        className={
                          pasoAnalisis >= 1
                            ? 'analysis-step completed'
                            : 'analysis-step'
                        }
                      >

                        <span className="step-indicator">

                          {pasoAnalisis > 1
                            ? '✓'
                            : ''}

                        </span>

                        <span>
                          Detectando rostro
                        </span>

                      </div>


                      {/* PASO 2 */}

                      <div
                        className={
                          pasoAnalisis >= 2
                            ? 'analysis-step completed'
                            : 'analysis-step'
                        }
                      >

                        <span className="step-indicator">

                          {pasoAnalisis > 2
                            ? '✓'
                            : ''}

                        </span>

                        <span>
                          Analizando características
                        </span>

                      </div>


                      {/* PASO 3 */}

                      <div
                        className={
                          pasoAnalisis >= 3
                            ? 'analysis-step completed'
                            : 'analysis-step'
                        }
                      >

                        <span className="step-indicator">

                          {pasoAnalisis > 3
                            ? '✓'
                            : ''}

                        </span>

                        <span>
                          Generando representación facial
                        </span>

                      </div>


                      {/* PASO 4 */}

                      <div
                        className={
                          pasoAnalisis >= 4
                            ? 'analysis-step completed'
                            : 'analysis-step'
                        }
                      >

                        <span className="step-indicator">

                          {pasoAnalisis > 4
                            ? '✓'
                            : ''}

                        </span>

                        <span>
                          Comparando registros
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>


          <button
            className="recognition-capture"
            onClick={capturarRostro}
            disabled={procesando || !modelosListos}
          >

            {procesando
              ? 'Analizando...'
              : !modelosListos
                ? 'Preparando el motor de reconocimiento...'
                : 'Capturar y reconocer rostro'}

          </button>

        </section>


        {/* RESULTADO */}

        <section
          className="recognition-card result-card"
        >

          <div className="card-header">

            <div>

              <span className="section-label">
                RESULTADO
              </span>

              <h2>
                Análisis de identidad
              </h2>

            </div>

            <div className="card-header-icon">

              <Target size={20} />

            </div>

          </div>


          <FaceResultCard
            resultado={resultado}
            onNuevoAnalisis={nuevoAnalisis}
          />

        </section>

      </div>


      {/* IMAGEN CAPTURADA */}

      {imagen && (

        <section className="recognition-image-card">

          <div className="card-header">

            <div>

              <span className="section-label">
                EVIDENCIA DEL ANÁLISIS
              </span>

              <h2>
                Imagen procesada
              </h2>

            </div>

            <ScanFace size={20} />

          </div>


          <div className="recognition-image-content">

            <div className="recognition-image-wrapper">

              <img
                src={imagen}
                alt="Rostro analizado"
              />

            </div>


            <div className="recognition-image-info">

              <CheckCircle2 size={20} />

              <div>

                <strong>
                  Imagen procesada correctamente
                </strong>

                <span>
                  El rostro se analizó en este mismo
                  dispositivo para generar su embedding.
                  La imagen nunca salió de tu navegador:
                  al servidor solo viajó el vector numérico
                  para realizar la comparación.
                </span>

              </div>

            </div>

          </div>

        </section>

      )}


      {/* MENSAJE */}

      {mensaje && !resultado && (

        <div className="recognition-message">

          <Activity size={18} />

          <span>
            {mensaje}
          </span>

        </div>

      )}

    </div>
  )
}


export default Reconocimiento