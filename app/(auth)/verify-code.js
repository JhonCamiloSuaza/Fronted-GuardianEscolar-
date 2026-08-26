import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const isWeb = Dimensions.get('window').width > 768;

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);

  const handleInputChange = (text, index) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 1);
    const newCode = [...code];
    newCode[index] = cleaned;
    setCode(newCode);
    if (cleaned && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      alert(t('authVerifyCode'));
      return;
    }
    router.push('/(auth)/reset-password');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.PRIMARIO} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.wrapper, isWeb && styles.wrapperWeb]}>
          {/* Logo */}
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>{t('appName')}</Text>

          {/* Card */}
          <View style={[styles.card, isWeb && styles.cardWeb]}>
            <Text style={styles.title}>{t('authVerifyCode')}</Text>
            <Text style={styles.subtitle}>
              Enviamos un código de verificación a{'\n'}
              <Text style={styles.email}>CorreoExample@gmail.com</Text>
            </Text>

            {/* OTP Inputs */}
            <View style={styles.otpRow}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputs.current[index] = ref; }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(text) => handleInputChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Botón Verificar */}
            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} activeOpacity={0.85}>
              <Text style={styles.verifyText}>{t('authVerifyCode')}</Text>
            </TouchableOpacity>

            {/* Reenviar */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No Recibiste el Codigo? </Text>
              <TouchableOpacity onPress={() => alert('Código reenviado')}>
                <Text style={styles.resendLink}>Reenviar codigo</Text>
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
  root: {
    flex: 1,
    backgroundColor: COLORS.FONDO_PRINCIPAL,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  wrapper: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    alignSelf: 'center',
  },
  wrapperWeb: {
    padding: 40,
    maxWidth: 500,
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: isWeb ? 32 : 22,
    fontWeight: 'bold',
    color: COLORS.PRIMARIO,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardWeb: {
    maxWidth: 450,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  backText: {
    color: COLORS.PRIMARIO,
    fontSize: 15,
  },
  title: {
    fontSize: isWeb ? 22 : 18,
    fontWeight: '600',
    color: COLORS.NEGRO,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXTO_SECUNDARIO,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  email: {
    color: COLORS.NEGRO,
    fontWeight: '500',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  otpBox: {
    width: 48,
    height: 60,
    backgroundColor: COLORS.BLANCO,
    borderWidth: 2,
    borderColor: COLORS.GRIS_BORDE,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.PRIMARIO,
    elevation: 2,
    shadowColor: COLORS.NEGRO,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  otpBoxFilled: {
    borderColor: COLORS.PRIMARIO,
    borderWidth: 2.5,
    backgroundColor: COLORS.PRIMARIO_CLARO,
  },
  verifyBtn: {
    backgroundColor: COLORS.PRIMARIO,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyText: {
    color: COLORS.BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 13,
    color: COLORS.TEXTO_SECUNDARIO,
  },
  resendLink: {
    fontSize: 13,
    color: COLORS.PRIMARIO,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
