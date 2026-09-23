import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { createPaperTheme, ThemeProvider, useTheme } from '../contexts/ThemeContext';

import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { theme: themeData } = useTheme();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isStudentDashboard = segments[0] === 'student-dashboard';

    if (!isAuthenticated && !inAuthGroup && !isStudentDashboard) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && !inTabsGroup && !isStudentDashboard) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading, router, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeData.colors.background }}>
        <ActivityIndicator size="large" color={themeData.colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;

    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlWidth: html.style.width,
      bodyMargin: body.style.margin,
      bodyWidth: body.style.width,
      bodyOverflowX: body.style.overflowX,
    };

    html.style.width = '100%';
    body.style.margin = '0';
    body.style.width = '100%';
    body.style.overflowX = 'hidden';

    return () => {
      html.style.width = previous.htmlWidth;
      body.style.margin = previous.bodyMargin;
      body.style.width = previous.bodyWidth;
      body.style.overflowX = previous.bodyOverflowX;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutContent() {
  const { isDark } = useTheme();
  const paperTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const customTheme = createPaperTheme(isDark);

  return (
    <PaperProvider theme={{ ...paperTheme, colors: customTheme.colors }}>
      <AuthProvider>
        <LanguageProvider>
          <RootLayoutNav />
        </LanguageProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
