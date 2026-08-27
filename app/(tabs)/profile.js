import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Modal } from 'react-native';
import { Avatar, Text, Button, Divider, Surface, Switch, TextInput, IconButton } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService } from '../../services/auth.service';
import { useLanguage } from '../../contexts/LanguageContext';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function ProfileScreen() {
  const { user, logout, updateUserInSession } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang, setLanguage } = useLanguage();

  // 'main' o 'language'
  const [viewMode, setViewMode] = useState('main');

  // Estados
  const [notifLlegada, setNotifLlegada] = useState(true);
  const [notifSalida, setNotifSalida] = useState(true);
  const [notifDesvio, setNotifDesvio] = useState(true);
  const [notifBateria, setNotifBateria] = useState(true);

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);

  const [langEs, setLangEs] = useState(true);
  const [langPt, setLangPt] = useState(false);
  const [langFr, setLangFr] = useState(false);
  const [langEn, setLangEn] = useState(false);

  const handleLanguageChange = (code) => {
    setLanguage(code);
    setLangEs(code === 'es');
    setLangPt(code === 'pt');
    setLangFr(code === 'fr');
    setLangEn(code === 'en');
  };

  const [isEditing, setIsEditing] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });

  // Estado 2FA
  const [twoFAModalVisible, setTwoFAModalVisible] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFAEnabled || false);
  const [twoFAMethod, setTwoFAMethod] = useState(user?.twoFAMethod || 'email'); // 'email' o 'sms'
  const [twoFAStep, setTwoFAStep] = useState('config');   // 'config' o 'verify'
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAGeneratedCode] = useState('847291');        // Código simulado

  const [tempUser, setTempUser] = useState({
    name: user?.name || 'Usuario Demo',
    email: user?.email || 'usuario@correo.com',
    phone: user?.phone || '+57 300 000 0000'
  });

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSave = async () => {
    try {
      // Solo actualizamos el teléfono, ya que el nombre y correo vienen del colegio
      await authService.updateProfile(user.email, tempUser.name, tempUser.phone);
      await updateUserInSession({ phone: tempUser.phone });
      setIsEditing(false);
      Alert.alert("Perfil", "Información actualizada correctamente.");
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar la información.");
    }
  };

  // ── Validadores de contraseña ──────────────────────────────────
  const hasUpperCase  = (v) => /[A-Z]/.test(v);
  const hasLowerCase  = (v) => /[a-z]/.test(v);
  const hasNumber     = (v) => /[0-9]/.test(v);
  const hasSpecial    = (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);
  const hasMinLength  = (v) => v.length >= 8;

  const passReqs = {
    minLen:  hasMinLength(passForm.new),
    upper:   hasUpperCase(passForm.new),
    lower:   hasLowerCase(passForm.new),
    number:  hasNumber(passForm.new),
    special: hasSpecial(passForm.new),
    match:   passForm.new.length > 0 && passForm.new === passForm.confirm,
  };
  const allPassReqsMet = Object.values(passReqs).every(Boolean);

  const handleChangePassword = async () => {
    if (!passForm.current) {
      Alert.alert('Error', 'Ingresa tu contraseña actual.'); return;
    }
    if (!allPassReqsMet) {
      Alert.alert('Seguridad', 'La nueva contraseña no cumple todos los requisitos.'); return;
    }

    try {
      await authService.updatePassword(user.email, passForm.current, passForm.new);
      setPassModalVisible(false);
      setPassForm({ current: '', new: '', confirm: '' });
      Alert.alert('Éxito', 'Tu contraseña ha sido actualizada correctamente.');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar la contraseña.');
    }
  };

  const SettingItem = ({ label, subtitle, value, onValueChange, rightIcon, disabled }) => (
    <View style={[styles.settingItem, !!disabled && { opacity: 0.7 }]}>
      <View style={styles.settingTextCol}>
        <Text style={styles.settingLabel}>{label || ''}</Text>
        {!!subtitle && <Text style={styles.settingSub}>{subtitle}</Text>}
      </View>
      {onValueChange ? (
        <Switch
          value={!!value}
          onValueChange={disabled ? null : onValueChange}
          color={disabled ? COLORS.TEXTO_SECUNDARIO : COLORS.ACENTO}
          disabled={!!disabled}
        />
      ) : (
        <MaterialCommunityIcons name={rightIcon || "chevron-right"} size={20} color={COLORS.TEXTO_SECUNDARIO} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isWeb && styles.scrollContentWeb, { paddingBottom: insets.bottom + 40 }]}
      >

        {/* Cabecera */}
        <View style={styles.pageHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {viewMode === 'language' && (
              <TouchableOpacity
                onPress={() => setViewMode('main')}
                style={{ marginRight: 12, padding: 4 }}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.NEGRO} />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.pageTitle}>{t('tabProfile')}</Text>
              <Text style={styles.pageSubtitle}>
                {viewMode === 'main'
                ? t('profileTitle')
                : t('profileLangSelect')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.globeIconWrap}
            onPress={() => setViewMode(viewMode === 'main' ? 'language' : 'main')}
          >
            <MaterialCommunityIcons name={viewMode === 'main' ? "web" : "close"} size={32} color={COLORS.BLANCO} />
          </TouchableOpacity>
        </View>

        {/* Información Personal (Siempre visible) */}
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('profileTitle')}</Text>
          </View>
          <View style={styles.profileRow}>
            <Avatar.Text
              size={60}
              label={tempUser.name.substring(0, 2).toUpperCase()}
              backgroundColor={COLORS.PRIMARIO_SUAVE}
              color={COLORS.BLANCO}
            />
            <View style={styles.profileInputs}>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{t('profileName')}</Text>
                <TextInput
                  mode="outlined"
                  value={tempUser.name}
                  dense
                  style={[styles.readOnlyInput, { backgroundColor: COLORS.FONDO_SECUNDARIO }]}
                  editable={false}
                  outlineColor={COLORS.GRIS_BORDE}
                  textColor={COLORS.TEXTO_SECUNDARIO}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{t('profileEmail')}</Text>
                <TextInput
                  mode="outlined"
                  value={tempUser.email}
                  dense
                  style={[styles.readOnlyInput, { backgroundColor: COLORS.FONDO_SECUNDARIO }]}
                  editable={false}
                  outlineColor={COLORS.GRIS_BORDE}
                  textColor={COLORS.TEXTO_SECUNDARIO}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{t('profilePhone')}</Text>
                <TextInput
                  mode="outlined"
                  value={tempUser.phone}
                  keyboardType="phone-pad"
                  dense
                  style={[styles.readOnlyInput, { backgroundColor: COLORS.FONDO_SECUNDARIO }]}
                  editable={false}
                  outlineColor={COLORS.GRIS_BORDE}
                  textColor={COLORS.TEXTO_SECUNDARIO}
                />
              </View>
            </View>
          </View>
        </Surface>

        {viewMode === 'main' ? (
          <>
            {/* Preferencias de Notificaciones */}
            <Surface style={styles.card} elevation={1}>
              <Text style={styles.cardTitle}>{t('profileNotifications')}</Text>
              <Text style={styles.cardSubtitleInfo}>{t('live') === 'Live' ? 'Configure when you want to receive alerts' : 'Configura cuando deseas recibir alerta'}</Text>

              <SettingItem
                label={t('profileArrival')}
                subtitle="(Obligatorio)"
                value={true}
                disabled={true}
              />
              <Divider style={styles.divider} />
              <SettingItem
                label={t('profileDeparture')}
                subtitle="(Obligatorio)"
                value={true}
                disabled={true}
              />
              <Divider style={styles.divider} />
              <SettingItem
                label={t('profileDeviation')}
                subtitle="(Obligatorio)"
                value={true}
                disabled={true}
              />
              <Divider style={styles.divider} />
              <SettingItem
                label={t('profileBattery')}
                subtitle=""
                value={notifBateria}
                onValueChange={setNotifBateria}
              />

              <Text style={[styles.cardTitle, { marginTop: 20 }]}>{t('live') === 'Live' ? 'Notification Channels' : 'Canales de Notificación'}</Text>

              <View style={styles.simpleRow}>
                <Text style={styles.settingLabel}>{t('profileEmailNotif')}</Text>
                <Switch value={notifEmail} onValueChange={setNotifEmail} color={COLORS.ACENTO} />
              </View>
              <View style={{ height: 8 }} />
              <View style={styles.simpleRow}>
                <Text style={styles.settingLabel}>{t('profileSMSNotif')}</Text>
                <Switch value={notifSMS} onValueChange={setNotifSMS} color={COLORS.ACENTO} />
              </View>
            </Surface>

            {/* Seguridad */}
            <Surface style={styles.card} elevation={1}>
              <Text style={styles.cardTitle}>{t('profileSecurity')}</Text>
              <View style={{ marginTop: 10 }}>
                <TouchableOpacity
                  style={styles.simpleRow}
                  onPress={() => setPassModalVisible(true)}
                >
                  <Text style={styles.settingLabel}>{t('profileChangePass')}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.TEXTO_SECUNDARIO} />
                </TouchableOpacity>
                <View style={{ height: 8 }} />
                <TouchableOpacity
                  style={styles.simpleRow}
                  onPress={() => { setTwoFAStep('config'); setTwoFACode(''); setTwoFAModalVisible(true); }}
                >
                  <View>
                    <Text style={styles.settingLabel}>{t('profile2FA')}</Text>
                    <Text style={styles.settingSub}>{twoFAEnabled ? '✅ ' + (t('live') === 'Live' ? 'Enabled' : 'Activada') : (t('live') === 'Live' ? 'Disabled' : 'Desactivada')}</Text>
                  </View>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.TEXTO_SECUNDARIO} />
                </TouchableOpacity>
              </View>
            </Surface>

            {/* Información */}
            <Surface style={styles.card} elevation={1}>
              <Text style={styles.cardTitle}>{t('live') === 'Live' ? 'Information' : 'Información'}</Text>
              <View style={{ marginTop: 10 }}>
                <View style={styles.infoRow}>
                  <Text style={styles.settingLabel}>{t('live') === 'Live' ? 'App Version' : 'Version de Aplicacion'}</Text>
                  <Text style={styles.infoValueText}>1.5</Text>
                </View>
                <View style={{ height: 8 }} />
                <View style={styles.infoRow}>
                  <Text style={styles.settingLabel}>{t('live') === 'Live' ? 'Account Type' : 'Tipo de Cuenta'}</Text>
                  <View style={styles.badgeGreen}>
                    <Text style={styles.badgeGreenText}>{t('live') === 'Live' ? 'Parent / Guardian' : 'Padre de Familia'}</Text>
                  </View>
                </View>
              </View>
            </Surface>

            {/* Botón Cerrar Sesión Rojo */}
            <Button
              mode="contained"
              style={styles.logoutBtnRed}
              buttonColor={COLORS.ALERTA}
              textColor={COLORS.BLANCO}
              icon="logout"
              onPress={logout}
            >
              {t('profileLogout')}
            </Button>
          </>
        ) : (
          <>
            {/* Vista Idiomas */}
            <Surface style={styles.card} elevation={1}>
              <Text style={styles.cardTitle}>Idiomas</Text>
              <Text style={styles.cardSubtitleInfo}>Lenguaje Internacional</Text>

              <SettingItem
                label="Español"
                subtitle="Por defecto, idioma español"
                value={langEs}
                onValueChange={() => handleLanguageChange('es')}
              />
              <Divider style={styles.divider} />
              <SettingItem
                label="Portugues"
                subtitle="Coloca la aplicacion en idioma Portugues"
                value={langPt}
                onValueChange={() => handleLanguageChange('pt')}
              />
              <Divider style={styles.divider} />
              <SettingItem
                label="Frances"
                subtitle="Coloca la aplicacion en idioma Frances"
                value={langFr}
                onValueChange={() => handleLanguageChange('fr')}
              />
              <Divider style={styles.divider} />
              <SettingItem
                label="Ingles"
                subtitle="Coloca la aplicacion en idioma de Ingles"
                value={langEn}
                onValueChange={() => handleLanguageChange('en')}
              />
            </Surface>

            {/* Botón Cerrar Sesión Azul (O Volver) */}
            <Button
              mode="contained"
              style={styles.logoutBtnRed}
              buttonColor={COLORS.ALERTA}
              onPress={logout}
            >
              Cerrar Sesión
            </Button>
          </>
        )}

      </ScrollView>

      {/* Modal Cambio de Contraseña */}
      <Modal
        visible={passModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPassModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalSheet} elevation={5}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <IconButton icon="close" size={20} onPress={() => { setPassModalVisible(false); setPassForm({ current: '', new: '', confirm: '' }); }} />
            </View>

            {/* Contraseña Actual */}
            <View style={styles.inputBox}>
              <Text style={styles.fieldLabel}>Contraseña Actual</Text>
              <TextInput
                mode="outlined" secureTextEntry
                value={passForm.current}
                onChangeText={v => setPassForm({...passForm, current: v})}
                style={styles.readOnlyInput}
                outlineColor={COLORS.GRIS_BORDE} activeOutlineColor={COLORS.PRIMARIO} textColor={COLORS.NEGRO}
                left={<TextInput.Icon icon="lock-outline" color={COLORS.TEXTO_SECUNDARIO} />}
              />
            </View>

            {/* Nueva Contraseña */}
            <View style={styles.inputBox}>
              <Text style={styles.fieldLabel}>Nueva Contraseña</Text>
              <TextInput
                mode="outlined" secureTextEntry
                value={passForm.new}
                onChangeText={v => setPassForm({...passForm, new: v})}
                style={styles.readOnlyInput}
                outlineColor={passForm.new && !passReqs.minLen ? COLORS.ALERTA : COLORS.GRIS_BORDE}
                activeOutlineColor={COLORS.PRIMARIO} textColor={COLORS.NEGRO}
                left={<TextInput.Icon icon="lock-plus-outline" color={COLORS.TEXTO_SECUNDARIO} />}
              />
              {/* Checklist en tiempo real */}
              {passForm.new.length > 0 && (
                <View style={styles.reqsBox}>
                  <Text style={styles.reqsTitle}>Requisitos de Seguridad:</Text>
                  {[
                    [passReqs.minLen,  'Mínimo 8 caracteres'],
                    [passReqs.upper,   'Al menos una letra mayúscula'],
                    [passReqs.lower,   'Al menos una letra minúscula'],
                    [passReqs.number,  'Al menos un número'],
                    [passReqs.special, 'Al menos un carácter especial (!@#$%...)'],
                  ].map(([ok, label]) => (
                    <View key={label} style={styles.checkRow}>
                      <MaterialCommunityIcons name={ok ? 'check-circle' : 'circle-outline'} size={13} color={ok ? COLORS.ACENTO : COLORS.TEXTO_SECUNDARIO} />
                      <Text style={[styles.checkLabel, ok && { color: COLORS.ACENTO }]}>{label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Confirmar Nueva Contraseña */}
            <View style={styles.inputBox}>
              <Text style={styles.fieldLabel}>Confirmar Nueva Contraseña</Text>
              <TextInput
                mode="outlined" secureTextEntry
                value={passForm.confirm}
                onChangeText={v => setPassForm({...passForm, confirm: v})}
                style={styles.readOnlyInput}
                outlineColor={passForm.confirm && !passReqs.match ? COLORS.ALERTA : COLORS.GRIS_BORDE}
                activeOutlineColor={COLORS.PRIMARIO} textColor={COLORS.NEGRO}
                left={<TextInput.Icon icon="lock-check-outline" color={COLORS.TEXTO_SECUNDARIO} />}
              />
              {passForm.confirm.length > 0 && (
                <View style={styles.checkRow}>
                  <MaterialCommunityIcons
                    name={passReqs.match ? 'check-circle' : 'close-circle'}
                    size={13}
                    color={passReqs.match ? COLORS.ACENTO : COLORS.ALERTA}
                  />
                  <Text style={[styles.checkLabel, { color: passReqs.match ? COLORS.ACENTO : COLORS.ALERTA }]}>
                    {passReqs.match ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                  </Text>
                </View>
              )}
            </View>

            <Button
              mode="contained"
              onPress={handleChangePassword}
              style={{ marginTop: 10, borderRadius: 8 }}
              buttonColor={allPassReqsMet ? COLORS.PRIMARIO : COLORS.GRIS_BORDE}
              textColor={COLORS.BLANCO}
            >
              Actualizar Contraseña
            </Button>
          </Surface>
        </View>
      </Modal>

      {/* ── Modal Autenticación de Dos Factores ── */}
      <Modal visible={twoFAModalVisible} transparent animationType="fade" onRequestClose={() => setTwoFAModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalSheet} elevation={5}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="shield-lock-outline" size={22} color={COLORS.PRIMARIO} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Autenticación de Dos Factores</Text>
              </View>
              <IconButton icon="close" size={20} onPress={() => { setTwoFAModalVisible(false); setTwoFAStep('config'); setTwoFACode(''); }} />
            </View>

            {twoFAStep === 'config' ? (
              <View>
                {/* Estado actual */}
                <View style={styles.twoFAStatusBox}>
                  <MaterialCommunityIcons
                    name={twoFAEnabled ? 'shield-check' : 'shield-off-outline'}
                    size={32}
                    color={twoFAEnabled ? COLORS.ACENTO : COLORS.TEXTO_SECUNDARIO}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.twoFAStatusTitle}>{twoFAEnabled ? '2FA Activada' : '2FA Desactivada'}</Text>
                    <Text style={styles.twoFAStatusSub}>{twoFAEnabled ? 'Tu cuenta está protegida con verificación extra.' : 'Activa esta función para mayor seguridad.'}</Text>
                  </View>
                  <Switch
                    value={twoFAEnabled}
                    onValueChange={async (v) => {
                      if (!v) {
                        try {
                          await authService.update2FA(user.email, false);
                          await updateUserInSession({ twoFAEnabled: false });
                          setTwoFAEnabled(false);
                        } catch (e) {
                          Alert.alert('Error', 'No se pudo desactivar el 2FA.');
                        }
                      } else {
                        setTwoFAStep('verify');
                      }
                    }}
                    color={COLORS.ACENTO}
                  />
                </View>

                {twoFAEnabled ? (
                  <View>
                    <Text style={styles.twoFALabel}>Método de verificación activo:</Text>
                    <View style={[styles.twoFAMethodBtn, { borderColor: COLORS.ACENTO, backgroundColor: '#F0FAF0' }]}>
                      <MaterialCommunityIcons name={twoFAMethod === 'email' ? 'email-check-outline' : 'message-check-outline'} size={20} color={COLORS.ACENTO} />
                      <Text style={{ marginLeft: 8, color: COLORS.ACENTO, fontWeight: '600' }}>{twoFAMethod === 'email' ? 'Correo Electrónico' : 'SMS al teléfono'}</Text>
                    </View>
                    <Button mode="outlined" onPress={() => { setTwoFAEnabled(false); }} style={{ marginTop: 12, borderColor: COLORS.ALERTA, borderRadius: 8 }} textColor={COLORS.ALERTA}>
                      Desactivar 2FA
                    </Button>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.twoFALabel}>Elige cómo recibir tu código:</Text>
                    <TouchableOpacity style={[styles.twoFAMethodBtn, twoFAMethod === 'email' && styles.twoFAMethodActive]} onPress={() => setTwoFAMethod('email')}>
                      <MaterialCommunityIcons name="email-outline" size={20} color={twoFAMethod === 'email' ? COLORS.PRIMARIO : COLORS.TEXTO_SECUNDARIO} />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.twoFAMethodText, twoFAMethod === 'email' && { color: COLORS.PRIMARIO }]}>Correo Electrónico</Text>
                        <Text style={styles.twoFAMethodSub}>{tempUser.email}</Text>
                      </View>
                      {twoFAMethod === 'email' ? <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.PRIMARIO} style={{ marginLeft: 'auto' }} /> : null}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.twoFAMethodBtn, twoFAMethod === 'sms' && styles.twoFAMethodActive]} onPress={() => setTwoFAMethod('sms')}>
                      <MaterialCommunityIcons name="message-outline" size={20} color={twoFAMethod === 'sms' ? COLORS.PRIMARIO : COLORS.TEXTO_SECUNDARIO} />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.twoFAMethodText, twoFAMethod === 'sms' && { color: COLORS.PRIMARIO }]}>SMS al teléfono</Text>
                        <Text style={styles.twoFAMethodSub}>{tempUser.phone}</Text>
                      </View>
                      {twoFAMethod === 'sms' ? <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.PRIMARIO} style={{ marginLeft: 'auto' }} /> : null}
                    </TouchableOpacity>
                    <Button mode="contained" onPress={() => setTwoFAStep('verify')} style={{ marginTop: 12, borderRadius: 8 }} buttonColor={COLORS.PRIMARIO}>
                      Enviar código de verificación
                    </Button>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <View style={styles.twoFACodeBox}>
                  <MaterialCommunityIcons name="message-badge-outline" size={36} color={COLORS.PRIMARIO} />
                  <Text style={styles.twoFACodeTitle}>Código enviado</Text>
                  <Text style={styles.twoFACodeSub}>{'Se envió un código de 6 dígitos a tu ' + (twoFAMethod === 'email' ? 'correo: ' + tempUser.email : 'teléfono: ' + tempUser.phone)}</Text>
                  <Text style={styles.twoFADemoCode}>{'Código demo: ' + twoFAGeneratedCode}</Text>
                </View>
                <View style={styles.inputBox}>
                  <Text style={styles.fieldLabel}>Ingresa el código de 6 dígitos</Text>
                  <TextInput
                    mode="outlined" value={twoFACode} onChangeText={setTwoFACode}
                    keyboardType="number-pad" maxLength={6}
                    style={[styles.readOnlyInput, { letterSpacing: 8, textAlign: 'center', fontSize: 20 }]}
                    outlineColor={COLORS.GRIS_BORDE} activeOutlineColor={COLORS.PRIMARIO} textColor={COLORS.NEGRO}
                  />
                </View>
                <Button
                  mode="contained"
                  onPress={async () => {
                    if (twoFACode === twoFAGeneratedCode) {
                      try {
                        await authService.update2FA(user.email, true, twoFAMethod);
                        await updateUserInSession({ twoFAEnabled: true, twoFAMethod });
                        setTwoFAEnabled(true);
                        setTwoFAModalVisible(false);
                        setTwoFAStep('config');
                        setTwoFACode('');
                        Alert.alert('✅ 2FA Activada', 'La autenticación de dos factores ha sido activada correctamente.');
                      } catch (e) {
                        Alert.alert('Error', 'No se pudo activar el 2FA.');
                      }
                    } else {
                      Alert.alert('Código incorrecto', 'El código ingresado no es válido. Inténtalo de nuevo.');
                    }
                  }}
                  style={{ marginTop: 8, borderRadius: 8 }}
                  buttonColor={twoFACode.length === 6 ? COLORS.PRIMARIO : COLORS.GRIS_BORDE}
                  textColor={COLORS.BLANCO}
                >
                  Verificar y Activar
                </Button>
                <Button mode="text" onPress={() => { setTwoFAStep('config'); setTwoFACode(''); }} textColor={COLORS.TEXTO_SECUNDARIO} style={{ marginTop: 4 }}>
                  Volver
                </Button>
              </View>
            )}
          </Surface>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.FONDO_PRINCIPAL },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  scrollContentWeb: { maxWidth: 800, alignSelf: 'center', width: '100%', paddingTop: 40 },

  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.NEGRO },
  pageSubtitle: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO, marginTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalSheet: {
    backgroundColor: COLORS.BLANCO,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRIS_BORDE,
    paddingBottom: 10
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.PRIMARIO },

  inputBox: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: COLORS.NEGRO, marginBottom: 6, fontWeight: 'bold' },

  reqsBox: {
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.GRIS_BORDE,
  },
  reqsTitle: { fontSize: 12, fontWeight: '700', color: COLORS.PRIMARIO, marginBottom: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, marginTop: 3 },
  checkLabel: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO },
  readOnlyInput: { height: 45, backgroundColor: COLORS.BLANCO, fontSize: 13 },
  globeIconWrap: { backgroundColor: COLORS.ACENTO, padding: 8, borderRadius: 30 },

  card: { backgroundColor: COLORS.BLANCO, borderRadius: 12, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.NEGRO },
  cardSubtitleInfo: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO, marginBottom: 16 },

  editBtn: { borderRadius: 8 },
  profileRow: { flexDirection: 'row' },
  profileInputs: { flex: 1, marginLeft: 16 },
  inputWrap: { marginBottom: 12 },
  inputLabel: { fontSize: 11, color: COLORS.TEXTO_SECUNDARIO, marginLeft: 4, marginBottom: 4 },
  readOnlyInput: { height: 45, backgroundColor: COLORS.FONDO_INPUT, fontSize: 13, justifyContent: 'center' },

  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingTextCol: { flex: 1, paddingRight: 16 },
  settingLabel: { fontSize: 13, color: COLORS.NEGRO, fontWeight: '500' },
  settingSub: { fontSize: 11, color: COLORS.TEXTO_SECUNDARIO, marginTop: 2 },

  divider: { backgroundColor: COLORS.GRIS_BORDE, marginVertical: 4 },

  simpleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, backgroundColor: COLORS.FONDO_INPUT, paddingHorizontal: 12, borderRadius: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, backgroundColor: COLORS.FONDO_INPUT, paddingHorizontal: 12, borderRadius: 8 },
  infoValueText: { fontSize: 13, color: COLORS.TEXTO_SECUNDARIO },

  badgeGreen: { backgroundColor: COLORS.ACENTO_CLARO, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeGreenText: { color: COLORS.ACENTO_OSCURO, fontSize: 10, fontWeight: 'bold' },

  logoutBtnRed: { marginTop: 10, borderRadius: 8, paddingVertical: 4 },
  logoutBtnBlue: { marginTop: 10, borderRadius: 8, paddingVertical: 4 },

  // Estilos 2FA
  twoFAStatusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FB', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.GRIS_BORDE },
  twoFAStatusTitle: { fontSize: 14, fontWeight: '700', color: COLORS.NEGRO },
  twoFAStatusSub: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO, marginTop: 2 },
  twoFALabel: { fontSize: 13, fontWeight: '600', color: COLORS.NEGRO, marginBottom: 10 },
  twoFAMethodBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.GRIS_BORDE, borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: COLORS.BLANCO },
  twoFAMethodActive: { borderColor: COLORS.PRIMARIO, backgroundColor: '#EEF4FF' },
  twoFAMethodText: { fontSize: 13, fontWeight: '600', color: COLORS.NEGRO },
  twoFAMethodSub: { fontSize: 11, color: COLORS.TEXTO_SECUNDARIO, marginTop: 2 },
  twoFACodeBox: { alignItems: 'center', paddingVertical: 16, marginBottom: 16, backgroundColor: '#F0F4FF', borderRadius: 12, borderWidth: 1, borderColor: COLORS.GRIS_BORDE },
  twoFACodeTitle: { fontSize: 16, fontWeight: '700', color: COLORS.PRIMARIO, marginTop: 8 },
  twoFACodeSub: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO, textAlign: 'center', marginTop: 4, paddingHorizontal: 8 },
  twoFADemoCode: { fontSize: 13, fontWeight: '700', color: COLORS.ACENTO, marginTop: 8, backgroundColor: '#E8FFE8', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
});
