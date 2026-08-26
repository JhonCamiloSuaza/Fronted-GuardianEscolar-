import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { theme } from '../config/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <LanguageProvider>
            <Slot />
          </LanguageProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
