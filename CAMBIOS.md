# Cambios aplicados

Dos cosas distintas:

1. Arreglar el deploy, que se caía.
2. Sacar `insightface` / `buffalo_l` del backend y mover el cálculo
   del vector facial al navegador.

---

## Parte 1 — Por qué se caía el deploy

### 1.1 `backend/requirements.txt` estaba incompleto

Faltaban paquetes que el código ya importaba. El error de
`email-validator` era solo el primero de la fila; detrás venían
`python-jose`, `passlib`, `bcrypt`, `opencv`, `insightface`,
`scikit-learn` y `python-multipart`.

### 1.2 Dos settings que no existían

`app/core/config.py` no definía dos campos que el código usaba:

- `SECRET_KEY` -> la usa `core/security.py` para firmar los JWT.
  Sin esto, **todo login devolvía 500** (`AttributeError`).
- `FACE_THRESHOLD` -> la usa `recognition.py`.
  Sin esto, **`/api/reconocimiento` devolvía 500**.

### 1.3 Python 3.14

Render estaba usando 3.14. Se fijó 3.11 con `backend/.python-version`.

---

## Parte 2 — Reconocimiento facial en el navegador

### Por qué NO se usó Google Cloud Vision

Google Cloud Vision **no hace reconocimiento facial**. Solo hace
*detección*: dice dónde hay una cara y si parece sonriente. No
devuelve ningún vector de identidad, así que no puede responder
"¿esta cara es la de Juan?". Google decidió deliberadamente no
ofrecer esa API.

Tu `app/services/face_service.py` (`GoogleFaceService`) pide
`FACE_DETECTION` y devuelve `confidence`, `joy` y `boundingPoly`.
Ese archivo **nunca estuvo importado en ningún lado**: es código
muerto. Se dejó tal cual, sin tocar, por si lo quieres para
validar "hay una cara en la foto".

### Qué se hizo en su lugar

El vector facial se calcula en el **navegador** con face-api.js
(TensorFlow.js). Al backend solo viajan 128 números.

    ANTES:  navegador --[ foto JPEG ]--> Render --[ insightface ]--> vector
    AHORA:  navegador --[ face-api.js ]--> vector --[ JSON ]--> Render

Ventajas:

- El backend ya no necesita `insightface`, `onnxruntime` ni OpenCV:
  cabe de sobra en el plan gratuito de Render y arranca en segundos.
- No hay que descargar 300 MB de modelo en cada reinicio.
- La foto **nunca sale del dispositivo** del usuario.
- Se conserva intacto todo lo demás: la tabla `face_embeddings`,
  la similitud, el historial y el modelo de probabilidad calibrada.

---

## Archivos tocados

### Frontend

| Archivo | Cambio |
|---|---|
| `src/services/faceEmbedding.ts` | **NUEVO.** Carga los modelos y genera el vector de 128 dims. |
| `public/models/` | **NUEVO.** Pesos de los 3 modelos (6.8 MB). No dependen de ningún CDN. |
| `src/pages/Reconocimiento.tsx` | Calcula el vector y envía JSON en vez de subir la foto. |
| `src/pages/RegistroFacial.tsx` | Igual que el anterior. |
| `package.json` | Añadido `@vladmandic/face-api`. |

La librería se carga con `import()` dinámico, así que TensorFlow.js
va en un chunk aparte y **no** se descarga al abrir el login.
El bundle principal quedó en 749 KB (224 KB gzip).

### Backend

| Archivo | Cambio |
|---|---|
| `requirements.txt` | Fuera insightface, onnxruntime, opencv, python-multipart. |
| `.python-version` | **NUEVO.** Fija Python 3.11. |
| `app/core/config.py` | Añadidos `SECRET_KEY` y `FACE_THRESHOLD`. |
| `app/schemas/face_embedding_schema.py` | **NUEVO** `EmbeddingRequest`, valida dimensión y vector vacío. |
| `app/api/routes/recognition.py` | Recibe JSON `{embedding}` en vez de la imagen. |
| `app/api/routes/face_registration.py` | Igual que el anterior. |
| `app/services/similarity_service.py` | Añadida distancia euclidiana + conversión a similitud. |
| `app/services/face_embedding_service.py` | Compara por distancia euclidiana e ignora vectores de otra dimensión. |
| `app/services/embedding_service.py` | **ELIMINADO** (era el motor insightface). |

**No se tocó:** ningún modelo de base de datos, ni `auth.py`,
`usuarios.py`, `personas.py`, `ml_models.py`, `probabilities.py`,
`health.py`, `security.py`, ni ningún componente del frontend
fuera de las dos pantallas citadas. La forma de las respuestas de
la API es idéntica, así que `FaceResultCard`, `SimilarityBar`,
`ProbabilityChart` e `Historial` siguen funcionando sin cambios.

---

## Un detalle técnico que importa: el umbral

Con los vectores de face-api **no sirve la similitud coseno**.
Midiendo con fotos reales en un navegador:

| | distancia euclidiana | similitud coseno |
|---|---|---|
| Misma persona | 0.05 – 0.17 | 0.993 – 0.999 |
| Personas distintas | 0.50 – 0.84 | **0.841 – 0.942** |

El coseno casi no separa (los vectores no están centrados en el
origen). Por eso la comparación usa **distancia euclidiana**, que es
la métrica con la que este modelo está calibrado.

Para no romper el frontend ni el modelo de probabilidad —que esperan
una similitud entre 0 y 1— la distancia se convierte así:

    similitud = 1 - distancia / 1.2

`FACE_THRESHOLD` quedó en **0.62**. El umbral clásico (0.50) daba un
falso positivo real entre dos personas distintas en las pruebas.

> **Calibra este valor con las caras reales de tu sistema.**
> Registra varias personas, haz reconocimientos y mira el historial.
> Si confunde personas, sube `FACE_THRESHOLD`; si rechaza a gente
> válida, bájalo. Es una variable de entorno, no hace falta tocar
> código ni volver a desplegar el build.

---

## Qué tienes que hacer

### En Render (backend)

1. Variables de entorno:
   - `SECRET_KEY` -> generar con:
     `python -c "import secrets; print(secrets.token_urlsafe(48))"`
   - `DATABASE_URL` -> la que ya tienes
   - `FRONTEND_URL` -> opcional, se suma al CORS
   - `FACE_THRESHOLD` -> opcional, por defecto 0.62
   - `GOOGLE_API_KEY` -> solo si usas `GoogleFaceService`
2. Verifica que el **Root Directory** del servicio sea `backend`.
3. Manual Deploy -> **"Clear build cache & deploy"**.

### En Vercel (frontend)

1. Variable `VITE_API_URL` apuntando a la URL de tu backend en Render.
2. Deploy normal. La carpeta `public/models` se publica como estático;
   el rewrite de `vercel.json` no la afecta.

### En la base de datos

Los rostros registrados con `buffalo_l` (512 dims) **ya no son
comparables** con los nuevos (128 dims). El código los ignora sin
romperse, pero esas personas **hay que volver a registrarlas**.

Para limpiarlos:

```sql
DELETE FROM face_embeddings WHERE modelo = 'buffalo_l';
```

---

## Cómo se verificó

- El backend arranca sin insightface/onnxruntime/opencv y registra
  sus 16 endpoints.
- `npm run build` del frontend compila sin errores de TypeScript.
- Se extrajeron vectores faciales **reales** de 6 fotos usando
  face-api.js en Chromium, y se probó el flujo completo contra el
  backend: 4 casos de "misma persona" reconocidos y 5 casos de
  "persona distinta" rechazados, los 9 correctos.
- Casos límite comprobados: vector de dimensión incorrecta (422),
  vector de ceros (422), campo ausente (422), valores no numéricos
  (422), persona inexistente (404), límite de 5 rostros (400) y
  convivencia con registros antiguos de 512 dims (no rompe).
