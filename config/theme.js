import { MD3LightTheme } from 'react-native-paper';
import { COLORS } from '../constants/colors';

// ════════════════════════════════════════════════════════════════
// NOTA: Este archivo es LEGACY.
// ════════════════════════════════════════════════════════════════
// El nuevo sistema de temas se encuentra en:
// - contexts/ThemeContext.js (Sistema completo de dark/light mode)
// - Usa useTheme() para acceder a los colores dinámicos
//
// Este archivo se mantiene por compatibilidad.
// ════════════════════════════════════════════════════════════════

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.PRIMARIO,
    secondary: COLORS.ACENTO,
    background: COLORS.FONDO_PRINCIPAL,
    surface: COLORS.FONDO_TARJETA,
    surfaceVariant: COLORS.FONDO_INPUT,
    onPrimary: COLORS.BLANCO,
    onSurface: COLORS.TEXTO_CONTRASTE,
    onSurfaceVariant: COLORS.TEXTO_SECUNDARIO,
    error: COLORS.ALERTA,
    outline: '#D1D5DB',
  },
  roundness: 10,
};