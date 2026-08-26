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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [method, setMethod] = useState('email');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    if (!contact.trim()) {
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/(auth)/verify-code');
    }, 1000);
  };

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
          <View style={styles.wrapper}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.headerLogo}
              contentFit="contain"
            />
            <Text style={styles.headerTitle}>{t('appName')}</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('authForgotPass')}</Text>
              <Text style={styles.cardSubtitle}>{t('authForgotSubtitle')}</Text>

              <View style={styles.switchRow}>
                <TouchableOpacity
                  style={[styles.switchBtn, method === 'phone' && styles.switchBtnActive]}
                  onPress={() => { setMethod('phone'); setContact(''); }}
                >
                  <Text style={[styles.switchText, method === 'phone' && styles.switchTextActive]}>{t('profilePhone')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.switchBtn, method === 'email' && styles.switchBtnActive]}
                  onPress={() => { setMethod('email'); setContact(''); }}
                >
                  <Text style={[styles.switchText, method === 'email' && styles.switchTextActive]}>{t('authEmail')}</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                mode="outlined"
                value={contact}
                onChangeText={setContact}
                keyboardType={method === 'phone' ? 'phone-pad' : 'email-address'}
                autoCapitalize="none"
                placeholder={method === 'phone' ? 'XXXXXXXXX' : 'correo@ejemplo.com'}
                outlineColor="#D9D9D9"
                activeOutlineColor={COLORS.PRIMARIO}
                style={styles.input}
                textColor={COLORS.NEGRO}
                theme={{ roundness: 6 }}
              />

              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={isSubmitting}
                style={styles.actionButton}
                contentStyle={styles.buttonContent}
                buttonColor={COLORS.PRIMARIO}
                disabled={isSubmitting}
              >
                {t('authSendCode')}
              </Button>

              <View style={styles.noteBox}>
                <Text style={styles.noteText}>Nota: Recibirás un código de 6 dígitos</Text>
                <Text style={styles.noteText}>para verificar tu identidad.</Text>
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
  wrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignSelf: 'center',
  },
  headerLogo: { width: 120, height: 120, marginBottom: 6 },
  headerTitle: {
    fontSize: isWeb ? 32 : 22,
    fontWeight: 'bold',
    color: COLORS.PRIMARIO,
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.BLANCO,
    width: '100%',
    maxWidth: 430,
    padding: 14,
    borderRadius: 3,
    elevation: 2,
    shadowColor: COLORS.NEGRO,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.GRIS_BORDE,
  },
  backInline: { marginBottom: 8 },
  backInlineText: {
    color: COLORS.PRIMARIO,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  cardTitle: { fontSize: isWeb ? 26 : 18, fontWeight: '500', color: COLORS.NEGRO, textAlign: 'center', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: COLORS.TEXTO_GENERAL, textAlign: 'center', marginBottom: 10, lineHeight: 18 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  switchBtn: {
    flex: 1,
    height: 34,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.GRIS_BORDE,
    backgroundColor: COLORS.BLANCO,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchBtnActive: {
    backgroundColor: COLORS.PRIMARIO,
    borderColor: COLORS.PRIMARIO,
  },
  switchText: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.NEGRO,
  },
  switchTextActive: {
    color: COLORS.BLANCO,
  },
  input: { backgroundColor: COLORS.FONDO_INPUT, height: 44, marginBottom: 10 },
  actionButton: { borderRadius: 4, marginBottom: 10 },
  buttonContent: { height: 38 },
  noteBox: {
    backgroundColor: COLORS.PRIMARIO_CLARO,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  noteText: { fontSize: 10, color: COLORS.PRIMARIO, lineHeight: 13, textAlign: 'center' },
});
