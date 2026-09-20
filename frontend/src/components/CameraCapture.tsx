import Webcam from 'react-webcam'
import { Camera } from 'lucide-react'

interface CameraCaptureProps {
  webcamRef: React.RefObject<Webcam | null>
  procesando: boolean
  onCapturar: () => void
}

function CameraCapture({
  webcamRef,
  procesando,
  onCapturar,
}: CameraCaptureProps) {
  return (
    <>
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
      </div>

      <button
        type="button"
        className="recognition-capture"
        onClick={onCapturar}
        disabled={procesando}
      >
        <Camera size={18} />

        {procesando
          ? 'Analizando...'
          : 'Capturar y reconocer rostro'}
      </button>
    </>
  )
}

export default CameraCapture