import axios from 'axios'

import { BASE_URL } from '../config/endpoints'
import { storage } from '../utils/storage'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Antes de cada petición, agrega el token JWT automáticamente
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Si el servidor responde 401, cierra la sesión automáticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clearAll()
    }
    return Promise.reject(error)
  }
)

export default api