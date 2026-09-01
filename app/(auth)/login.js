import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, Text, TextInput } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/auth.service';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, setAuthState } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const colors = theme.colors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAMethod, setTwoFAMethod] = useState('email');
  const [targetEmail, setTargetEmail] = useState('');

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
      if (result?.requires2FA) {
        setTargetEmail(result.email);
        setTwoFAMethod(result.method);
        setShow2FA(true);
      }
    } catch (error) {
      setErrorMsg(error.message || t('authInvalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FAVerify = async () => {
    setErrorMsg('');
    if (twoFACode !== '847291') {
      setErrorMsg(t('authWrongCode'));
      return;
    }

    try {
      setIsSubmitting(true);
      const session = await authService.complete2FALogin(targetEmail);
      setAuthState(session);
    } catch (error) {
      setErrorMsg(t('authSessionFinishError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.cardWrapper}>
            <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} contentFit="contain" />
            <Text style={[styles.headerTitle, { color: colors.primary }]}>{t('appName')}</Text>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {!show2FA ? (
                <>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t('authLogin')}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{t('authEnterEmail')}</Text>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('authEmail')}</Text>
                    <TextInput
                      mode="outlined"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      style={[styles.input, { backgroundColor: colors.surfaceSecondary }]}
                      textColor={colors.text}
                      theme={{ roundness: 6 }}
                      left={<TextInput.Icon icon="email-outline" color={colors.textSecondary} />}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('authPassword')}</Text>
                    <TextInput
                      mode="outlined"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={secureText}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      style={[styles.input, { backgroundColor: colors.surfaceSecondary }]}
                      textColor={colors.text}
                      theme={{ roundness: 6 }}
                      left={<TextInput.Icon icon="lock-outline" color={colors.textSecondary} />}
                      right={<TextInput.Icon icon={secureText ? 'eye' : 'eye-off'} onPress={() => setSecureText(!secureText)} color={colors.primary} />}
                    />
                  </View>

                  <View style={styles.rememberRecoveryRow}>
                    <View style={styles.checkboxContainer}>
                      <Checkbox status={rememberMe ? 'checked' : 'unchecked'} onPress={() => setRememberMe(!rememberMe)} color={colors.primary} />
                      <Text style={[styles.checkboxLabel, { color: colors.text }]}>{t('authRemember')}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.forgotLink}
                      onPress={() => router.push('/(auth)/forgot-password')}
                      accessibilityRole="link"
                    >
                      <Text style={[styles.forgotText, { color: colors.primary }]}>{t('authForgotPass')}</Text>
                    </TouchableOpacity>
                  </View>

                  {errorMsg ? (
                    <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
                      <Text style={[styles.errorBoxText, { color: colors.error }]}>{errorMsg}</Text>
                    </View>
                  ) : null}

                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    style={styles.loginButton}
                    contentStyle={styles.buttonContent}
                    buttonColor={colors.primary}
                    textColor={colors.textOnPrimary}
                  >
                    {t('authLoginBtn')}
                  </Button>
                </>
              ) : (
                <View>
                  <TouchableOpacity onPress={() => setShow2FA(false)} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
                    <Text style={[styles.backBtnText, { color: colors.primary }]}>{t('authBack')}</Text>
                  </TouchableOpacity>

                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t('authVerification')}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                    {`${t('authCodeSent')} ${twoFAMethod === 'email' ? t('authEmail').toLowerCase() : t('profilePhone').toLowerCase()}.`}
                  </Text>

                  <View style={styles.otpInfoBox}>
                    <MaterialCommunityIcons name="shield-key-outline" size={40} color={colors.primary} />
                    <Text style={[styles.otpHint, { color: colors.text }]}>{t('authEnterCode')}</Text>
                    <Text style={[styles.demoHint, { color: colors.accent }]}>({t('authDemoCode')})</Text>
                  </View>

                  <TextInput
                    mode="outlined"
                    value={twoFACode}
                    onChangeText={setTwoFACode}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[styles.otpInput, { backgroundColor: colors.surfaceSecondary }]}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    textColor={colors.text}
                    placeholder="000000"
                  />

                  {errorMsg ? (
                    <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
                      <Text style={[styles.errorBoxText, { color: colors.error }]}>{errorMsg}</Text>
                    </View>
                  ) : null}

                  <Button
                    mode="contained"
                    onPress={handle2FAVerify}
                    loading={isSubmitting}
                    disabled={isSubmitting || twoFACode.length < 6}
                    style={styles.loginButton}
                    contentStyle={styles.buttonContent}
                    buttonColor={colors.primary}
                    textColor={colors.textOnPrimary}
                  >
                    {t('authVerifyCode')}
                  </Button>
                </View>
              )}

              {!show2FA && (
                <View style={styles.footerLinks}>
                  <Text style={[styles.noAccountText, { color: colors.text }]}>{t('authNoAccount')} </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                    <Text style={[styles.registerLink, { color: colors.primary }]}>{t('authRegisterBtn')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.devClear}
                onPress={async () => {
                  await AsyncStorage.clear();
                  if (Platform.OS === 'web') {
                    window.alert(t('devDataClearedWeb'));
                  } else {
                    Alert.alert(t('devDataClearedTitle'), t('devDataClearedMessage'));
                  }
                }}
              >
                <Text style={[styles.devClearText, { color: colors.error }]}>{t('devClearData')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  backButton: { padding: 8 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  cardWrapper: { width: '100%', alignItems: 'center', padding: 20, alignSelf: 'center' },
  headerLogo: { width: 120, height: 120, marginBottom: 6 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  card: {
    width: '100%',
    maxWidth: 430,
    padding: 24,
    borderRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  cardSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  input: { height: 44 },
  rememberRecoveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  forgotLink: { paddingVertical: 8 },
  forgotText: { fontSize: 13, fontWeight: '700' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: -8 },
  checkboxLabel: { fontSize: 13 },
  loginButton: { borderRadius: 8, marginTop: 10 },
  buttonContent: { height: 48 },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  noAccountText: { fontSize: 13 },
  registerLink: { fontSize: 13, fontWeight: '700' },
  errorBox: { borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1 },
  errorBoxText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backBtnText: { marginLeft: 5, fontWeight: '600' },
  otpInfoBox: { alignItems: 'center', marginBottom: 20 },
  otpHint: { fontSize: 15, fontWeight: '600', marginTop: 10 },
  demoHint: { fontSize: 12, marginTop: 2 },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 5, height: 55, marginBottom: 15 },
  devClear: { marginTop: 24, alignSelf: 'center' },
  devClearText: { fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline' },
});
