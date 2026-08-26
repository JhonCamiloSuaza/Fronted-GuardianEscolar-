import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const isWeb = Dimensions.get('window').width > 768;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const handleResetPassword = () => {
    if (!password || !confirmPassword) {
      alert(t('authRequiredFields'));
      return;
    }
    if (password !== confirmPassword) {
      alert(t('live') === 'Live' ? 'Passwords do not match' : 'Las contraseñas no coinciden');
      return;
    }
    console.log("Contraseña cambiada exitosamente");
    router.replace('/(auth)/login');
  };

  const RequirementItem = ({ text, met }) => (
    <Text style={[styles.requirementText, met && styles.metRequirement]}>
      {text}
    </Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.PRIMARIO} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.cardWrapper, isWeb && styles.cardWrapperWeb]}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.headerLogo}
              contentFit="contain"
            />
            <Text style={styles.headerTitle}>{t('appName')}</Text>

            <View style={[styles.card, isWeb && styles.cardWeb]}>
              <Text style={styles.cardTitle}>{t('authNewPassword')}</Text>
              <Text style={styles.cardSubtitle}>
                Asegurate de que tu contraseña cumpla{'\n'}
                con todos los requisitos de seguridad
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('authNewPassword')}</Text>
                <TextInput
                  mode="outlined"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureText}
                  outlineColor="transparent"
                  activeOutlineColor={COLORS.PRIMARIO}
                  style={styles.input}
                  textColor={COLORS.NEGRO}
                  theme={{ roundness: 8 }}
                  right={<TextInput.Icon icon={secureText ? "eye" : "eye-off"} onPress={() => setSecureText(!secureText)} color={COLORS.PRIMARIO} />}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('authConfirmPass')}</Text>
                <TextInput
                  mode="outlined"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={secureConfirm}
                  outlineColor="transparent"
                  activeOutlineColor={COLORS.PRIMARIO}
                  style={styles.input}
                  textColor={COLORS.NEGRO}
                  theme={{ roundness: 8 }}
                  right={<TextInput.Icon icon={secureConfirm ? "eye" : "eye-off"} onPress={() => setSecureConfirm(!secureConfirm)} color={COLORS.PRIMARIO} />}
                />
              </View>

              <View style={styles.requirementsBox}>
                <Text style={styles.requirementsTitle}>Requisitos de Seguridad:</Text>
                <RequirementItem text="• Mínimo 8 caracteres" met={password.length >= 8} />
                <RequirementItem text="• Al menos una letra mayúscula" met={/[A-Z]/.test(password)} />
                <RequirementItem text="• Al menos una letra minúscula" met={/[a-z]/.test(password)} />
                <RequirementItem text="• Al menos un número" met={/[0-9]/.test(password)} />
                <RequirementItem text="• Al menos un carácter especial (!@#$%...)" met={/[!@#$%^&*(),.?":{}|<>]/.test(password)} />
                <RequirementItem text="• Las contraseñas coinciden" met={password === confirmPassword && password.length > 0} />
              </View>

              <Button
                mode="contained"
                onPress={handleResetPassword}
                style={styles.actionButton}
                contentStyle={styles.buttonContent}
                buttonColor={COLORS.PRIMARIO}
              >
                Cambiar Contraseña
              </Button>

              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.footerLink}>Volver a Opciones</Text>
              </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    alignSelf: 'center',
  },
  cardWrapperWeb: {
    padding: 32,
    maxWidth: 500,
  },
  headerLogo: {
    width: 120,
    height: 120,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: isWeb ? 32 : 22,
    fontWeight: 'bold',
    color: COLORS.PRIMARIO,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.BLANCO,
    width: '100%',
    maxWidth: 420,
    padding: 26,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cardWeb: {
    maxWidth: 450,
  },
  cardTitle: {
    fontSize: isWeb ? 22 : 18,
    fontWeight: '500',
    color: COLORS.NEGRO,
    textAlign: 'center',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.TEXTO_GENERAL,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.NEGRO,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F3F4F6',
    height: 48,
  },
  requirementsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXTO_GENERAL,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    color: COLORS.TEXTO_SECUNDARIO,
    marginBottom: 4,
  },
  metRequirement: {
    color: COLORS.ACENTO, // Verde si cumple
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonContent: {
    height: 48,
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.PRIMARIO,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
