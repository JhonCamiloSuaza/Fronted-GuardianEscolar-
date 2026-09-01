import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/auth.service';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const isWeb = Dimensions.get('window').width > 768;

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const hasUpperCase = (v) => /[A-Z]/.test(v);
const hasLowerCase = (v) => /[a-z]/.test(v);
const hasNumber = (v) => /[0-9]/.test(v);
const hasSpecial = (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);
const hasMinLength = (v) => v.length >= 8;

// CheckItem sin gap, sin whitespace entre nodos
const CheckItem = ({ ok, label, colors }) => (
  <View style={styles.checkRow}>
    <MaterialCommunityIcons name={ok ? 'check-circle' : 'circle-outline'} size={14} color={ok ? colors.success : colors.textMuted} style={{ marginRight: 6 }} />
    <Text style={[styles.checkLabel, { color: ok ? colors.success : colors.textSecondary }]}>{label}</Text>
  </View>
);

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const colors = theme.colors;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+57 ');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
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
  const phoneDigits = phone.replace(/\D/g, '');
  const isValidPhone = phoneDigits.length >= 10 && phoneDigits.length <= 15;

  // Booleans explÃ­citos para evitar string vacÃ­o en render
  const showEmailError = email.length > 0 && !isValidEmail(email);
  const showPassBox = showPassReqs || password.length > 0;
  const showMatchStatus = confirmPassword.length > 0;

  const handleRegister = async () => {
    setErrorMsg('');

    if (!name.trim()) { setErrorMsg('El nombre es obligatorio.'); return; }
    if (!isValidPhone) { setErrorMsg('Ingresa un teléfono válido, solo números.'); return; }
    if (!isValidEmail(email)) { setErrorMsg('Ingresa un correo válido (ej: usuario@gmail.com).'); return; }
    if (!allReqsMet) { setErrorMsg(t('authPasswordRulesFailed')); return; }
    if (!acceptTerms) { setTermsModalVisible(true); return; }

    setIsSubmitting(true);
    try {
      await authService.register({ name, email: email.trim(), password, phone: phone.trim() });
      Alert.alert(t('success'), 'Cuenta creada. Ya puedes iniciar sesión.');
      router.replace('/(auth)/login');
    } catch (error) {
      setErrorMsg(error.message || 'No se pudo crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.cardWrapper}>
            <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} contentFit="contain" />
            <Text style={[styles.headerTitle, { color: colors.primary }]}>{t('appName')}</Text>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('authRegister')}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{t('authEnterEmail')}</Text>

              {/* â”€â”€ Nombre â”€â”€ */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('authGuardianName')}</Text>
                <TextInput
                  mode="outlined" value={name} onChangeText={setName}
                  outlineColor={colors.border} activeOutlineColor={colors.primary}
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary }]} textColor={colors.text} theme={{ roundness: 6 }}
                  placeholderTextColor={colors.textMuted}
                  left={<TextInput.Icon icon="account-outline" color={colors.textSecondary} />}
                />
              </View>

              {/* â”€â”€ TelÃ©fono â”€â”€ */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('profilePhone')}</Text>
                <TextInput
                  mode="outlined" value={phone}
                  onChangeText={(v) => {
                    const digits = v.replace(/\D/g, '').slice(0, 13);
                    const withoutCountry = digits.startsWith('57') ? digits.slice(2) : digits;
                    setPhone(`+57 ${withoutCountry}`);
                  }}
                  keyboardType="phone-pad"
                  outlineColor={phone.length > 4 && !isValidPhone ? colors.error : colors.border} activeOutlineColor={colors.primary}
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary }]} textColor={colors.text} theme={{ roundness: 6 }}
                  left={<TextInput.Icon icon="phone-outline" color={colors.textSecondary} />}
                  placeholder="+57 300 123 4567"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* â”€â”€ Correo â”€â”€ */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('authEmail')}</Text>
                <TextInput
                  mode="outlined" value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none"
                  outlineColor={showEmailError ? colors.error : colors.border}
                  activeOutlineColor={colors.primary}
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary }]} textColor={colors.text} theme={{ roundness: 6 }}
                  placeholderTextColor={colors.textMuted}
                  left={<TextInput.Icon icon="email-outline" color={colors.textSecondary} />}
                  right={
                    email.length > 0
                      ? <TextInput.Icon icon={isValidEmail(email) ? 'check-circle' : 'alert-circle'} color={isValidEmail(email) ? colors.success : colors.error} />
                      : null
                  }
                />
                {showEmailError ? (
                  <Text style={[styles.errorHint, { color: colors.error }]}>Formato inválido. Ej: usuario@gmail.com</Text>
                ) : null}
              </View>

              {/* â”€â”€ ContraseÃ±a â”€â”€ */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('authPassword')}</Text>
                <TextInput
                  mode="outlined" value={password} onChangeText={setPassword}
                  onFocus={() => setShowPassReqs(true)}
                  secureTextEntry={secureText}
                  outlineColor={password.length > 0 && !allReqsMet ? colors.error : colors.border}
                  activeOutlineColor={colors.primary}
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary }]} textColor={colors.text} theme={{ roundness: 6 }}
                  placeholderTextColor={colors.textMuted}
                  left={<TextInput.Icon icon="lock-outline" color={colors.textSecondary} />}
                  right={<TextInput.Icon icon={secureText ? 'eye' : 'eye-off'} onPress={() => setSecureText(!secureText)} color={colors.primary} />}
                />
                {showPassBox ? (
                  <View style={[styles.reqsBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.reqsTitle, { color: colors.primary }]}>{t('securityRequirements')}</Text>
                    <CheckItem ok={reqs.minLen} label={t('securityMinLength')} colors={colors} />
                    <CheckItem ok={reqs.upper} label={t('securityUpper')} colors={colors} />
                    <CheckItem ok={reqs.lower} label={t('securityLower')} colors={colors} />
                    <CheckItem ok={reqs.number} label={t('securityNumber')} colors={colors} />
                    <CheckItem ok={reqs.special} label={t('securitySpecial')} colors={colors} />
                  </View>
                ) : null}
              </View>

              {/* â”€â”€ Confirmar ContraseÃ±a â”€â”€ */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>{t('authConfirmPass')}</Text>
                <TextInput
                  mode="outlined" value={confirmPassword} onChangeText={setConfirmPassword}
                  secureTextEntry={secureConfirm}
                  outlineColor={confirmPassword.length > 0 && !reqs.match ? colors.error : colors.border}
                  activeOutlineColor={colors.primary}
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary }]} textColor={colors.text} theme={{ roundness: 6 }}
                  placeholderTextColor={colors.textMuted}
                  left={<TextInput.Icon icon="lock-check-outline" color={colors.textSecondary} />}
                  right={<TextInput.Icon icon={secureConfirm ? 'eye' : 'eye-off'} onPress={() => setSecureConfirm(!secureConfirm)} color={colors.primary} />}
                />
                {showMatchStatus ? (
                  <View style={styles.checkRow}>
                    <MaterialCommunityIcons name={reqs.match ? 'check-circle' : 'close-circle'} size={14} color={reqs.match ? colors.success : colors.error} style={{ marginRight: 6 }} />
                    <Text style={[styles.checkLabel, { color: reqs.match ? colors.success : colors.error }]}>{reqs.match ? t('securityMatch') : t('securityNoMatch')}</Text>
                  </View>
                ) : null}
              </View>

              {/* â”€â”€ TÃ©rminos â”€â”€ */}
              <TouchableOpacity style={styles.termsRow} onPress={() => { if (acceptTerms) { setAcceptTerms(false); } else { setTermsModalVisible(true); } setErrorMsg(''); }} activeOpacity={0.7}>
                <View style={styles.checkboxWrapper}>
                  <Checkbox status={acceptTerms ? 'checked' : 'unchecked'} color={colors.primary} />
                </View>
                <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                  Acepto los Términos y Condiciones y la Política de Privacidad de Guardian Escolar
                </Text>
              </TouchableOpacity>

              {/* Mensaje de Error Visible */}
              {errorMsg.length > 0 ? (
                <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
                  <Text style={[styles.errorBoxText, { color: colors.error }]}>{errorMsg}</Text>
                </View>
              ) : null}

              <Button mode="contained" onPress={handleRegister} loading={isSubmitting} disabled={isSubmitting} style={styles.registerButton} contentStyle={styles.buttonContent} buttonColor={colors.primary} textColor={colors.textOnPrimary}>
                {t('authRegisterBtn')}
              </Button>

              <View style={styles.footerLinks}>
                <Text style={[styles.hasAccountText, { color: colors.text }]}>{t('authHaveAccount')} </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={[styles.loginLink, { color: colors.primary }]}>{t('authLoginBtn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={termsModalVisible} transparent animationType="fade" onRequestClose={() => { setTermsModalVisible(false); setAcceptTerms(false); router.back(); }}>
        <View style={[styles.termsOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.termsModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.termsHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.termsTitle, { color: colors.text }]}>Términos y Condiciones</Text>
              <TouchableOpacity
                style={styles.termsClose}
                onPress={() => {
                  setTermsModalVisible(false);
                  setAcceptTerms(false);
                  router.back();
                }}
              >
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={[styles.termsContent, { borderColor: colors.border }]}
              onScroll={({ nativeEvent }) => {
                const reachedEnd = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 12;
                if (reachedEnd) setTermsRead(true);
              }}
              scrollEventThrottle={16}
            >
              <Text style={[styles.termsBody, { color: colors.text }]}>
                ESPACIO RESERVADO PARA LOS TERMINOS Y CONDICIONES OFICIALES.
              </Text>
              <Text style={[styles.termsBody, { color: colors.textSecondary }]}>
                Aqui se insertara posteriormente el contenido legal oficial de Guardian Escolar. El usuario debe desplazarse hasta el final de esta area antes de aceptar.
              </Text>
              <View style={{ height: 420 }} />
              <Text style={[styles.termsBody, { color: colors.text }]}>Fin del contenido de terminos.</Text>
            </ScrollView>
            <Button
              mode="contained"
              disabled={!termsRead}
              buttonColor={termsRead ? colors.primary : colors.border}
              textColor={termsRead ? colors.textOnPrimary : colors.textSecondary}
              onPress={() => {
                setAcceptTerms(true);
                setTermsModalVisible(false);
              }}
              style={styles.termsAccept}
            >
              Aceptar
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
  headerTitle: { fontSize: isWeb ? 32 : 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  card: {
    width: '100%', maxWidth: 430,
    padding: 18, borderRadius: 12, elevation: 3,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
    borderWidth: 1,
  },
  cardTitle: { fontSize: isWeb ? 24 : 20, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  input: { height: 44 },
  errorHint: { fontSize: 11, marginTop: 4, marginLeft: 4 },
  reqsBox: { borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1 },
  reqsTitle: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  checkLabel: { fontSize: 12 },
  checkLabelOk: { fontSize: 12 },
  checkLabelErr: { fontSize: 12 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginLeft: -8, paddingRight: 10 },
  checkboxWrapper: { marginRight: 2 },
  termsText: { flex: 1, fontSize: 12, lineHeight: 16 },
  errorBox: { borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1 },
  errorBoxText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  registerButton: { borderRadius: 8, marginBottom: 12 },
  buttonContent: { height: 44 },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  hasAccountText: { fontSize: 12 },
  loginLink: { fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  termsOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18 },
  termsModal: { width: '100%', maxWidth: 520, maxHeight: '86%', borderRadius: 12, borderWidth: 1, padding: 16 },
  termsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 10, marginBottom: 12 },
  termsTitle: { fontSize: 18, fontWeight: '700' },
  termsClose: { padding: 6 },
  termsContent: { borderWidth: 1, borderRadius: 8, padding: 12, maxHeight: 360 },
  termsBody: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  termsAccept: { borderRadius: 8, marginTop: 14 },
});


