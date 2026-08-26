import { DefaultTheme } from 'react-native-paper';
import { COLORS } from '../constants/colors';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.PRIMARIO,
    secondary: COLORS.ACENTO,
    background: COLORS.FONDO_PRINCIPAL,
    surface: COLORS.FONDO_TARJETA,
    surfaceVariant: COLORS.FONDO_INPUT,
    onPrimary: COLORS.BLANCO,
    onSurface: COLORS.TEXTO_GENERAL,
    onSurfaceVariant: COLORS.TEXTO_SECUNDARIO,
    error: COLORS.ALERTA,
    outline: '#D1D5DB',
  },
  roundness: 10,
};