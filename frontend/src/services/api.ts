import axios from 'axios'

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (respuesta) => {
    return respuesta
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('autenticado')
      localStorage.removeItem('usuario')
      localStorage.removeItem('token')

      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api