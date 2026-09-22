import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/auth.service';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = theme.colors;
  const token = params.token ? String(params.token) : '';
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verificando correo...');
  const returnUrl = params.returnUrl ? String(params.returnUrl) : '';

  const goToReturnUrl = () => {
    if (returnUrl && typeof window !== 'undefined' && /^https?:\/\//i.test(returnUrl)) {
      window.location.assign(returnUrl);
      return;
    }
    router.replace('/(auth)/login');
  };

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('El enlace no incluye token de verificación.');
      return;
    }

    authService.verifyEmailWithToken(token)
      .then(result => {
        setStatus('success');
        setMessage(result.message);
      })
      .catch(error => {
        setStatus('error');
        setMessage(error.message || 'No se pudo verificar el correo.');
      });
  }, [token]);

  const isSuccess = status === 'success';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.backButton} onPress={goToReturnUrl}>
        <MaterialCommunityIcons name="arrow-left" size={28} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.wrapper}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons
            name={isSuccess ? 'check-circle-outline' : status === 'loading' ? 'timer-sand' : 'alert-circle-outline'}
            size={46}
            color={isSuccess ? colors.success : status === 'loading' ? colors.primary : colors.error}
          />
          <Text style={[styles.title, { color: colors.text }]}>
            {isSuccess ? 'Correo verificado' : status === 'loading' ? 'Verificando' : 'No se pudo verificar'}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <Button mode="contained" onPress={goToReturnUrl} buttonColor={colors.primary} textColor={colors.textOnPrimary} style={styles.button}>
            {isSuccess ? 'Aceptar' : 'Ir al login'}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  backButton: { padding: 24, alignSelf: 'flex-start' },
  wrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { width: 110, height: 110, marginBottom: 14 },
  card: { width: '100%', maxWidth: 460, alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  button: { marginTop: 20, borderRadius: 8, alignSelf: 'stretch' },
});
