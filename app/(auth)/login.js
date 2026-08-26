import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, Text, TextInput } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { useLanguage } from '../../contexts/LanguageContext';

const isWeb = Dimensions.get('window').width > 768;
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para 2FA
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAMethod, setTwoFAMethod] = useState('email');
  const [targetEmail, setTargetEmail] = useState('');

  const { login, setAuthState } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogin = async () => {
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg(t('authRequiredFields'));
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg(t('authInvalidEmail'));
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login(email.trim(), password);

      if (result && result.requires2FA) {
        setTargetEmail(result.email);
        setTwoFAMethod(result.method);
        setShow2FA(true);
      }
      // Si no requiere 2FA, el AuthContext ya hizo el login y el router nos mandará fuera de aquí
    } catch (error) {
      setErrorMsg(error.message || 'Credenciales incorrectas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FAVerify = async () => {
    setErrorMsg('');
    // Código demo para pruebas
    if (twoFACode === '847291') {
      try {
        setIsSubmitting(true);
        const session = await authService.complete2FALogin(targetEmail);
        setAuthState(session);
        // Login exitoso
      } catch (error) {
        setErrorMsg('Error al finalizar sesión.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrorMsg('Código de verificación incorrecto.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.PRIMARIO} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.cardWrapper}>
            <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} contentFit="contain" />
            <Text style={styles.headerTitle}>{t('appName')}</Text>

            <View style={styles.card}>
              {!show2FA ? (
                <>
                  <Text style={styles.cardTitle}>{t('authLogin')}</Text>
                  <Text style={styles.cardSubtitle}>{t('authEnterEmail')}</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('authEmail')}</Text>
                    <TextInput
                      mode="outlined" value={email} onChangeText={setEmail}
                      keyboardType="email-address" autoCapitalize="none"
                      outlineColor={COLORS.GRIS_BORDE} activeOutlineColor={COLORS.PRIMARIO}
                      style={styles.input} textColor={COLORS.NEGRO} theme={{ roundness: 6 }}
                      left={<TextInput.Icon icon="email-outline" color={COLORS.TEXTO_SECUNDARIO} />}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('authPassword')}</Text>
                    <TextInput
                      mode="outlined" value={password} onChangeText={setPassword}
                      secureTextEntry={secureText}
                      outlineColor={COLORS.GRIS_BORDE} activeOutlineColor={COLORS.PRIMARIO}
                      style={styles.input} textColor={COLORS.NEGRO} theme={{ roundness: 6 }}
                      left={<TextInput.Icon icon="lock-outline" color={COLORS.TEXTO_SECUNDARIO} />}
                      right={<TextInput.Icon icon={secureText ? "eye" : "eye-off"} onPress={() => setSecureText(!secureText)} color={COLORS.PRIMARIO} />}
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={styles.checkboxContainer}>
                      <Checkbox status={rememberMe ? 'checked' : 'unchecked'} onPress={() => setRememberMe(!rememberMe)} color={COLORS.PRIMARIO} />
                      <Text style={styles.checkboxLabel}>{t('authRemember')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                        <Text style={styles.forgotPass}>{t('authForgotPass')}</Text>
                    </TouchableOpacity>
                  </View>

                  {errorMsg ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorBoxText}>⚠ {errorMsg}</Text>
                    </View>
                  ) : null}

                  <Button
                    mode="contained" onPress={handleLogin} loading={isSubmitting} disabled={isSubmitting}
                    style={styles.loginButton} contentStyle={styles.buttonContent} buttonColor={COLORS.PRIMARIO}
                  >
                    {t('authLoginBtn')}
                  </Button>
                </>
              ) : (
                <View>
                  <TouchableOpacity onPress={() => setShow2FA(false)} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.PRIMARIO} />
                    <Text style={styles.backBtnText}>{t('authBack')}</Text>
                  </TouchableOpacity>

                  <Text style={styles.cardTitle}>Verificación</Text>
                  <Text style={styles.cardSubtitle}>
                    {`Se ha enviado un código a tu ${twoFAMethod === 'email' ? 'correo' : 'teléfono'}.`}
                  </Text>

                  <View style={styles.otpInfoBox}>
                    <MaterialCommunityIcons name="shield-key-outline" size={40} color={COLORS.PRIMARIO} />
                    <Text style={styles.otpHint}>Ingresa el código de 6 dígitos</Text>
                    <Text style={styles.demoHint}>(Prueba con: 847291)</Text>
                  </View>

                  <TextInput
                    mode="outlined" value={twoFACode} onChangeText={setTwoFACode}
                    keyboardType="number-pad" maxLength={6}
                    style={styles.otpInput} outlineColor={COLORS.GRIS_BORDE}
                    activeOutlineColor={COLORS.PRIMARIO} textColor={COLORS.NEGRO}
                    placeholder="000000"
                  />

                  {errorMsg ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorBoxText}>⚠ {errorMsg}</Text>
                    </View>
                  ) : null}

                  <Button
                    mode="contained" onPress={handle2FAVerify} loading={isSubmitting}
                    disabled={isSubmitting || twoFACode.length < 6}
                    style={styles.loginButton} contentStyle={styles.buttonContent} buttonColor={COLORS.PRIMARIO}
                  >
                    {t('authVerifyCode')}
                  </Button>
                </View>
              )}

              {!show2FA && (
                <View style={styles.footerLinks}>
                  <Text style={styles.noAccountText}>{t('authNoAccount')} </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                    <Text style={styles.registerLink}>{t('authRegisterBtn')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.FONDO_PRINCIPAL,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  cardWrapper: { width: '100%', alignItems: 'center', padding: 20, alignSelf: 'center' },
  headerLogo: { width: 120, height: 120, marginBottom: 6 },
  headerTitle: { fontSize: isWeb ? 32 : 22, fontWeight: 'bold', color: COLORS.PRIMARIO, textAlign: 'center', marginBottom: 8 },
  card: {
    backgroundColor: COLORS.BLANCO, width: '100%', maxWidth: 430,
    padding: 24, borderRadius: 16, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
    borderWidth: 1, borderColor: COLORS.GRIS_BORDE,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.NEGRO, textAlign: 'center', marginBottom: 6 },
  cardSubtitle: { fontSize: 13, color: COLORS.TEXTO_SECUNDARIO, textAlign: 'center', marginBottom: 20 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.TEXTO_GENERAL, marginBottom: 4 },
  input: { backgroundColor: COLORS.BLANCO, height: 44 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: -8 },
  checkboxLabel: { fontSize: 13, color: COLORS.TEXTO_GENERAL },
  forgotPass: { fontSize: 13, color: COLORS.PRIMARIO, fontWeight: '600' },
  loginButton: { borderRadius: 8, marginTop: 10 },
  buttonContent: { height: 48 },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  noAccountText: { fontSize: 13, color: COLORS.TEXTO_GENERAL },
  registerLink: { fontSize: 13, color: COLORS.PRIMARIO, fontWeight: '700' },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: COLORS.ALERTA },
  errorBoxText: { color: COLORS.ALERTA, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Estilos 2FA
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backBtnText: { color: COLORS.PRIMARIO, marginLeft: 5, fontWeight: '600' },
  otpInfoBox: { alignItems: 'center', marginBottom: 20 },
  otpHint: { fontSize: 15, fontWeight: '600', color: COLORS.NEGRO, marginTop: 10 },
  demoHint: { fontSize: 12, color: COLORS.ACENTO, marginTop: 2 },
  otpInput: { backgroundColor: '#F8FAFF', textAlign: 'center', fontSize: 24, letterSpacing: 5, height: 55, marginBottom: 15 },
});
