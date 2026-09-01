export const COLORS = {
  primary: '#1565C0',
  secondary: '#0D47A1',
  accent: '#42A5F5',
  danger: '#E53935',
  warning: '#FB8C00',
  success: '#43A047',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  lightGray: '#F5F5F5',
  background: '#F8F9FA',
}

export const TRACKING = {
  DEVIATION_RADIUS_METERS: 100,   // alerta si se aleja más de 100m de la ruta
  STOPPED_ALERT_MINUTES: 5,       // alerta si está detenido más de 5 minutos
  UPDATE_INTERVAL_MS: 5000,       // actualiza posición cada 5 segundos
}

export const ROLES = {
  PARENT: 'PADRE',
  ADMIN: 'ADMINISTRADOR',
}

export const STORAGE_KEYS = {
  TOKEN: '@gps_guardian_token',
  USER: '@gps_guardian_user',
  ROLE: '@gps_guardian_role',
}