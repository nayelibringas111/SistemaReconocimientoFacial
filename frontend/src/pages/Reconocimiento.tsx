import { useRef, useState } from 'react'
import Webcam from 'react-webcam'

import {
  ScanFace,
  ShieldCheck,
  Target,
  Activity,
  CheckCircle2,
} from 'lucide-react'

import api from '../services/api'

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


  // Pequeña espera para mostrar visualmente
  // las etapas del análisis
  const esperar = (milisegundos: number) => {
    return new Promise((resolve) =>
      setTimeout(resolve, milisegundos)
    )
  }


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
        'Detectando rostro...'
      )

      await esperar(700)


      // ETAPA 2
      setPasoAnalisis(2)

      setEtapaAnalisis(
        'Analizando características faciales...'
      )

      await esperar(700)


      // ETAPA 3
      setPasoAnalisis(3)

      setEtapaAnalisis(
        'Generando representación facial...'
      )

      await esperar(700)


      // Convertir captura en archivo
      const respuesta =
        await fetch(captura)

      const blob =
        await respuesta.blob()

      const archivo =
        new File(
          [blob],
          'rostro.jpg',
          {
            type: 'image/jpeg',
          }
        )


      const formulario =
        new FormData()

      formulario.append(
        'imagen',
        archivo
      )


      // ETAPA 4
      setPasoAnalisis(4)

      setEtapaAnalisis(
        'Comparando con rostros registrados...'
      )


      const respuestaApi =
        await api.post(
          '/api/reconocimiento',
          formulario,
          {
            headers: {
              'Content-Type':
                'multipart/form-data',
            },
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

    } catch (error) {
      console.error(error)

      setMensaje(
        'No se pudo procesar el rostro.'
      )

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
            disabled={procesando}
          >

            {procesando
              ? 'Analizando...'
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
                  El rostro capturado fue enviado al
                  motor de reconocimiento para generar
                  su embedding y realizar la comparación.
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