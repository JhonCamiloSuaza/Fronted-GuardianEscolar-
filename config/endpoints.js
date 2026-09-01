export const BASE_URL = 'http://TU_IP:8080/api'  // cambia esto por la IP de tu backend

export const ENDPOINTS = {
  // Auth
  LOGIN: `${BASE_URL}/auth/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
  REFRESH_TOKEN: `${BASE_URL}/auth/refresh`,

  // Estudiantes
  STUDENTS: `${BASE_URL}/students`,
  STUDENT_BY_ID: (id) => `${BASE_URL}/students/${id}`,

  // Rutas
  ROUTES: `${BASE_URL}/routes`,
  ROUTE_BY_STUDENT: (studentId) => `${BASE_URL}/routes/student/${studentId}`,

  // Rastreo
  LAST_POSITION: (studentId) => `${BASE_URL}/tracking/last/${studentId}`,
  START_TRAYECTO: `${BASE_URL}/tracking/start`,
  STOP_TRAYECTO: (trayectoId) => `${BASE_URL}/tracking/stop/${trayectoId}`,

  // Historial
  HISTORY: (studentId) => `${BASE_URL}/tracking/history/${studentId}`,

  // Notificaciones
  NOTIFICATIONS: `${BASE_URL}/notifications`,
  MARK_READ: (id) => `${BASE_URL}/notifications/${id}/read`,
  SAVE_PUSH_TOKEN: `${BASE_URL}/notifications/token`,

  // WebSocket
  SOCKET_URL: 'ws://TU_IP:8080/ws',
  SOCKET_TOPIC: (studentId) => `/topic/student/${studentId}`,
}