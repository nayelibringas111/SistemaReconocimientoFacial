/**
 * Servicio de reconocimiento facial en el navegador.
 *
 * El vector facial (embedding) se calcula AQUÍ, en el cliente, usando
 * face-api.js sobre TensorFlow.js. Al backend solo se le envía el vector
 * (128 números), nunca la imagen.
 *
 * Ventajas:
 *  - El backend en Render no necesita insightface, onnxruntime ni OpenCV,
 *    así que cabe de sobra en un plan pequeño.
 *  - La foto del rostro nunca sale del dispositivo del usuario.
 *
 * Los modelos se sirven desde /public/models (no dependen de ningún CDN).
 */

// Solo los tipos: esta línea desaparece al compilar y no arrastra
// la librería al bundle principal.
import type * as FaceApi from '@vladmandic/face-api'

/** Dimensión del vector que produce el modelo face_recognition. */
export const DIMENSION_EMBEDDING = 128

/** Nombre del modelo, se guarda junto al vector en la base de datos. */
export const NOMBRE_MODELO = 'face-api-128'

/** Ruta pública desde la que se descargan los pesos de los modelos. */
const RUTA_MODELOS = '/models'

/**
 * Promesa única de carga. Garantiza que los modelos se descarguen
 * una sola vez aunque varias pantallas los pidan a la vez.
 */
let promesaCarga: Promise<void> | null = null

/**
 * Referencia a la librería, cargada bajo demanda.
 *
 * face-api.js incluye TensorFlow.js y pesa ~1.3 MB. Con import()
 * dinámico, Vite la separa en su propio chunk y solo se descarga
 * cuando el usuario entra a Reconocimiento o Registro Facial,
 * no al abrir el login o el dashboard.
 */
let faceapi: typeof FaceApi | null = null

/** Opciones del detector. Tiny es mucho más rápido y sobra para webcam. */
let opcionesDetector: FaceApi.TinyFaceDetectorOptions | null = null

/**
 * Error que se lanza cuando el navegador no logra obtener un rostro.
 * Permite a las pantallas distinguir "no hay cara" de un fallo de red.
 */
export class SinRostroError extends Error {
  constructor(mensaje = 'No se detectó ningún rostro.') {
    super(mensaje)
    this.name = 'SinRostroError'
  }
}

/**
 * Descarga los tres modelos necesarios. Es idempotente: se puede llamar
 * tantas veces como se quiera y solo descarga la primera vez.
 *
 * Conviene invocarla al montar la pantalla (no al pulsar el botón) para
 * que los ~6.8 MB de pesos ya estén listos cuando el usuario capture.
 */
export async function cargarModelos(): Promise<void> {
  if (promesaCarga) {
    return promesaCarga
  }

  promesaCarga = (async () => {
    try {
      // Descarga la librería solo la primera vez que se necesita.
      const libreria = await import('@vladmandic/face-api')

      faceapi = libreria

      opcionesDetector = new libreria.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5,
      })

      /*
       * Inicializar el backend de TensorFlow.js ANTES de usarlo.
       *
       * Sin esto, en cualquier navegador que no tenga WebGL (o que lo
       * tenga bloqueado) TF.js cae al backend WASM y lanza:
       *   "The highest priority backend 'wasm' has not yet been
       *    initialized. Make sure to await tf.ready()".
       *
       * Los tipos publicados por la librería no exponen tf.ready(),
       * por eso el acceso va tipado a mano.
       */
      const tf = (libreria as unknown as {
        tf?: {
          ready: () => Promise<void>
          setBackend: (nombre: string) => Promise<boolean>
        }
      }).tf

      if (tf) {
        try {
          // WebGL es mucho más rápido; si no está, TF.js elige solo.
          await tf.setBackend('webgl')
        } catch {
          // Sin WebGL se continúa con el backend por defecto.
        }

        await tf.ready()
      }

      await Promise.all([
        libreria.nets.tinyFaceDetector.loadFromUri(RUTA_MODELOS),
        libreria.nets.faceLandmark68Net.loadFromUri(RUTA_MODELOS),
        libreria.nets.faceRecognitionNet.loadFromUri(RUTA_MODELOS),
      ])
    } catch (error) {
      // Si falla, se limpia todo para permitir reintentar.
      promesaCarga = null
      faceapi = null
      opcionesDetector = null
      throw error
    }
  })()

  return promesaCarga
}

/** Indica si los modelos ya terminaron de cargarse. */
export function modelosCargados(): boolean {
  if (!faceapi) {
    return false
  }

  return (
    faceapi.nets.tinyFaceDetector.isLoaded &&
    faceapi.nets.faceLandmark68Net.isLoaded &&
    faceapi.nets.faceRecognitionNet.isLoaded
  )
}

/**
 * Fuente de imagen admitida: el elemento <video> de la webcam, un <canvas>
 * o un <img> ya cargado.
 */
export type FuenteImagen =
  | HTMLVideoElement
  | HTMLCanvasElement
  | HTMLImageElement

/**
 * Calcula el vector facial de la cara más prominente de la imagen.
 *
 * @returns Array de 128 números, listo para enviarse como JSON.
 * @throws SinRostroError si no se detecta ninguna cara.
 */
export async function obtenerEmbedding(
  fuente: FuenteImagen
): Promise<number[]> {
  await cargarModelos()

  if (!faceapi || !opcionesDetector) {
    throw new Error('El motor de reconocimiento no está disponible.')
  }

  const deteccion = await faceapi
    .detectSingleFace(fuente, opcionesDetector)
    .withFaceLandmarks()
    .withFaceDescriptor()

  if (!deteccion) {
    throw new SinRostroError()
  }

  const vector = Array.from(deteccion.descriptor)

  if (vector.length !== DIMENSION_EMBEDDING) {
    throw new Error(
      `El vector facial tiene ${vector.length} dimensiones, ` +
        `se esperaban ${DIMENSION_EMBEDDING}.`
    )
  }

  // IMPORTANTE: el vector se envía TAL CUAL, sin normalizar.
  //
  // El backend compara con distancia euclidiana, que es la métrica
  // con la que este modelo está calibrado (umbral clásico: 0.6).
  // Normalizar los vectores destruiría esa escala y haría que
  // personas distintas parecieran la misma.
  return vector
}

/**
 * Convierte una captura en dataURL (lo que devuelve react-webcam con
 * getScreenshot()) en un <img> utilizable por obtenerEmbedding.
 */
export function imagenDesdeDataURL(
  dataUrl: string
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image()

    imagen.onload = () => resolve(imagen)

    imagen.onerror = () =>
      reject(new Error('No se pudo leer la imagen capturada.'))

    imagen.src = dataUrl
  })
}

/**
 * Atajo: recibe la captura en base64 y devuelve directamente el vector.
 * Es la función que usan las pantallas de registro y reconocimiento.
 */
export async function obtenerEmbeddingDesdeDataURL(
  dataUrl: string
): Promise<number[]> {
  const imagen = await imagenDesdeDataURL(dataUrl)

  return obtenerEmbedding(imagen)
}
