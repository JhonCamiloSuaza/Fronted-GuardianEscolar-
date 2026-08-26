import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/auth.service';
import { useLanguage } from '../../contexts/LanguageContext';

const isWeb = Dimensions.get('window').width > 768;

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const hasUpperCase = (v) => /[A-Z]/.test(v);
const hasLowerCase = (v) => /[a-z]/.test(v);
const hasNumber = (v) => /[0-9]/.test(v);
const hasSpecial = (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);
const hasMinLength = (v) => v.length >= 8;

// CheckItem sin gap, sin whitespace entre nodos
const CheckItem = ({ ok, label }) => (
  <View style={styles.checkRow}>
    <MaterialCommunityIcons name={ok ? 'check-circle' : 'circle-outline'} size={14} color={ok ? COLORS.ACENTO : COLORS.TEXTO_SECUNDARIO} style={{ marginRight: 6 }} />
    <Text style={ok ? styles.checkLabelOk : styles.checkLabel}>{label}</Text>
  </View>
);

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+57 ');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassReqs, setShowPassReqs] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reqs = {
    minLen: hasMinLength(password),
    upper: hasUpperCase(password),
    lower: hasLowerCase(password),
    number: hasNumber(password),
    special: hasSpecial(password),
    match: password.length > 0 && password === confirmPassword,
  };
  const allReqsMet = Object.values(reqs).every(Boolean);

  // Booleans explícitos para evitar string vacío en render
  const showEmailError = email.length > 0 && !isValidEmail(email);
  const showPassBox = showPassReqs || password.length > 0;
  const showMatchStatus = confirmPassword.length > 0;

  const handleRegister = async () => {
    setErrorMsg('');

    if (!name.trim()) { setErrorMsg('⚠️ El nombre es obligatorio.'); return; }
    if (!phone.trim()) { setErrorMsg('⚠️ El teléfono es obligatorio.'); return; }
    if (!isValidEmail(email)) { setErrorMsg('⚠️ Ingresa un correo válido (ej: usuario@gmail.com).'); return; }
    if (!allReqsMet) { setErrorMsg('⚠️ La contraseña no cumple todos los requisitos de seguridad.'); return; }
    if (!acceptTerms) { setErrorMsg('⚠️ Debes marcar la casilla para aceptar los Términos y Condiciones.'); return; }

    setIsSubmitting(true);
    try {
      await authService.register({ name, email: email.trim(), password, phone: phone.trim() });
      Alert.alert('¡Éxito!', 'Cuenta creada. Ya puedes iniciar sesión.');
      router.replace('/(auth)/login');
    } catch (error) {
      setErrorMsg('❌ ' + (error.message || 'No se pudo crear la cuenta.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
              <Text style={styles.cardTitle}>{t('authRegister')}</Text>
              <Text style={styles.cardSubtitle}>{t('authEnterEmail')}</Text>

              {/* ── Nombre ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('authGuardianName')}</Text>
                <TextInput
                  mode="outlined" value={name} onChangeText={setName}
                  outlineColor={COLORS.GRIS_BORDE} activeOutlineColor={COLORS.PRIMARIO}
                  style={styles.input} textColor={COLORS.NEGRO} theme={{ roundness: 6 }}
                  left={<TextInput.Icon icon="account-outline" color={COLORS.TEXTO_SECUNDARIO} />}
                />
              </View>

              {/* ── Teléfono ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('profilePhone')}</Text>
                <TextInput
                  mode="outlined" value={phone}
                  onChangeText={(v) => {
                    if (v.startsWith('+57 ')) {
                      setPhone(v);
                    } else if (v.length < 4) {
                      setPhone('+57 ');
                    }
                  }}
                  keyboardType="phone-pad"
                  outlineColor={COLORS.GRIS_BORDE} activeOutlineColor={COLORS.PRIMARIO}
                  style={styles.input} textColor={COLORS.NEGRO} theme={{ roundness: 6 }}
                  left={<TextInput.Icon icon="phone-outline" color={COLORS.TEXTO_SECUNDARIO} />}
                  placeholder="+57 300 123 4567"
                />
              </View>

              {/* ── Correo ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('authEmail')}</Text>
                <TextInput
                  mode="outlined" value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none"
                  outlineColor={showEmailError ? COLORS.ALERTA : COLORS.GRIS_BORDE}
                  activeOutlineColor={COLORS.PRIMARIO}
                  style={styles.input} textColor={COLORS.NEGRO} theme={{ roundness: 6 }}
                  left={<TextInput.Icon icon="email-outline" color={COLORS.TEXTO_SECUNDARIO} />}
                  right={
                    email.length > 0
                      ? <TextInput.Icon icon={isValidEmail(email) ? 'check-circle' : 'alert-circle'} color={isValidEmail(email) ? COLORS.ACENTO : COLORS.ALERTA} />
                      : null
                  }
                />
                {showEmailError ? (
                  <Text style={styles.errorHint}>Formato inválido. Ej: usuario@gmail.com</Text>
                ) : null}
              </View>

              {/* ── Contraseña ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('authPassword')}</Text>
                <TextInput
                  mode="outlined" value={password} onChangeText={setPassword}
                  onFocus={() => setShowPassReqs(true)}
                  secureTextEntry={secureText}
                  outlineColor={password.length > 0 && !allReqsMet ? COLORS.ALERTA : COLORS.GRIS_BORDE}
                  activeOutlineColor={COLORS.PRIMARIO}
                  style={styles.input} textColor={COLORS.NEGRO} theme={{ roundness: 6 }}
                  left={<TextInput.Icon icon="lock-outline" color={COLORS.TEXTO_SECUNDARIO} />}
                  right={<TextInput.Icon icon={secureText ? 'eye' : 'eye-off'} onPress={() => setSecureText(!secureText)} color={COLORS.PRIMARIO} />}
                />
                {showPassBox ? (
                  <View style={styles.reqsBox}>
                    <Text style={styles.reqsTitle}>Requisitos de Seguridad:</Text>
                    <CheckItem ok={reqs.minLen} label="Mínimo 8 caracteres" />
                    <CheckItem ok={reqs.upper} label="Al menos una letra mayúscula" />
                    <CheckItem ok={reqs.lower} label="Al menos una letra minúscula" />
                    <CheckItem ok={reqs.number} label="Al menos un número" />
                    <CheckItem ok={reqs.special} label="Al menos un carácter especial (!@#$%...)" />
                  </View>
                ) : null}
              </View>

              {/* ── Confirmar Contraseña ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('authConfirmPass')}</Text>
                <TextInput
                  mode="outlined" value={confirmPassword} onChangeText={setConfirmPassword}
                  secureTextEntry={secureConfirm}
                  outlineColor={confirmPassword.length > 0 && !reqs.match ? COLORS.ALERTA : COLORS.GRIS_BORDE}
                  activeOutlineColor={COLORS.PRIMARIO}
                  style={styles.input} textColor={COLORS.NEGRO} theme={{ roundness: 6 }}
                  left={<TextInput.Icon icon="lock-check-outline" color={COLORS.TEXTO_SECUNDARIO} />}
                  right={<TextInput.Icon icon={secureConfirm ? 'eye' : 'eye-off'} onPress={() => setSecureConfirm(!secureConfirm)} color={COLORS.PRIMARIO} />}
                />
                {showMatchStatus ? (
                  <View style={styles.checkRow}>
                    <MaterialCommunityIcons name={reqs.match ? 'check-circle' : 'close-circle'} size={14} color={reqs.match ? COLORS.ACENTO : COLORS.ALERTA} style={{ marginRight: 6 }} />
                    <Text style={reqs.match ? styles.checkLabelOk : styles.checkLabelErr}>{reqs.match ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}</Text>
                  </View>
                ) : null}
              </View>

              {/* ── Términos ── */}
              <TouchableOpacity style={styles.termsRow} onPress={() => { setAcceptTerms(!acceptTerms); setErrorMsg(''); }} activeOpacity={0.7}>
                <View style={styles.checkboxWrapper}>
                  <Checkbox status={acceptTerms ? 'checked' : 'unchecked'} color={COLORS.PRIMARIO} />
                </View>
                <Text style={styles.termsText}>
                  Acepto los Términos y Condiciones y la Política de Privacidad de Guardian Escolar
                </Text>
              </TouchableOpacity>

              {/* Mensaje de Error Visible */}
              {errorMsg.length > 0 ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>{errorMsg}</Text>
                </View>
              ) : null}

              <Button mode="contained" onPress={handleRegister} loading={isSubmitting} disabled={isSubmitting} style={styles.registerButton} contentStyle={styles.buttonContent} buttonColor={COLORS.PRIMARIO}>
                {t('authRegisterBtn')}
              </Button>

              <View style={styles.footerLinks}>
                <Text style={styles.hasAccountText}>{t('authHaveAccount')} </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.loginLink}>{t('authLoginBtn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.FONDO_PRINCIPAL },
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
    padding: 18, borderRadius: 12, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
    borderWidth: 1, borderColor: COLORS.GRIS_BORDE,
  },
  cardTitle: { fontSize: isWeb ? 24 : 20, fontWeight: '700', color: COLORS.NEGRO, textAlign: 'center', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: COLORS.TEXTO_SECUNDARIO, textAlign: 'center', marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.TEXTO_GENERAL, marginBottom: 4 },
  input: { backgroundColor: COLORS.BLANCO, height: 44 },
  errorHint: { fontSize: 11, color: COLORS.ALERTA, marginTop: 4, marginLeft: 4 },
  reqsBox: { backgroundColor: '#F0F4FF', borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1, borderColor: COLORS.GRIS_BORDE },
  reqsTitle: { fontSize: 12, fontWeight: '700', color: COLORS.PRIMARIO, marginBottom: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  checkLabel: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO },
  checkLabelOk: { fontSize: 12, color: COLORS.ACENTO },
  checkLabelErr: { fontSize: 12, color: COLORS.ALERTA },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginLeft: -8, paddingRight: 10 },
  checkboxWrapper: { marginRight: 2 },
  termsText: { flex: 1, fontSize: 12, color: COLORS.TEXTO_SECUNDARIO, lineHeight: 16 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: COLORS.ALERTA },
  errorBoxText: { color: COLORS.ALERTA, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  registerButton: { borderRadius: 8, marginBottom: 12 },
  buttonContent: { height: 44 },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  hasAccountText: { fontSize: 12, color: COLORS.TEXTO_GENERAL },
  loginLink: { fontSize: 12, color: COLORS.PRIMARIO, fontWeight: '600', textDecorationLine: 'underline' },
});
