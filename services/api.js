import axios from 'axios'

import { BASE_URL } from '../config/endpoints'
import { emitAuthExpired } from '../utils/authEvents'
import { storage } from '../utils/storage'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Antes de cada petición, agrega el token JWT automáticamente
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken()
    if (token && !config.skipAuth) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Si el servidor rechaza la sesion, cierra la sesion automaticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if ([401, 403].includes(error.response?.status)) {
      await storage.clearAll()
      emitAuthExpired()
    }
    return Promise.reject(error)
  }
)

export default api
