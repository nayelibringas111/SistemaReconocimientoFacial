import requests
import base64
from app.core.config import settings

class GoogleFaceService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self.url = f"https://vision.googleapis.com/v1/images:annotate?key={self.api_key}"

    def detect_face_from_base64(self, base64_image_str: str):
        # Limpiar prefijo data:image/... si existe
        if "," in base64_image_str:
            base64_image_str = base64_image_str.split(",")[1]

        payload = {
            "requests": [
                {
                    "image": {"content": base64_image_str},
                    "features": [
                        {"type": "FACE_DETECTION", "maxResults": 5}
                    ]
                }
            ]
        }

        response = requests.post(self.url, json=payload)
        if response.status_code != 200:
            raise Exception(f"Error en Google Cloud Vision: {response.text}")

        data = response.json()
        annotations = data["responses"][0].get("faceAnnotations", [])

        results = []
        for face in annotations:
            results.append({
                "confidence": face.get("detectionConfidence"),
                "joy": face.get("joyLikelihood"),
                "bounding_poly": face.get("boundingPoly")
            })

        return results