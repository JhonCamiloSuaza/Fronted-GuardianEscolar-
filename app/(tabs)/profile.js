import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Avatar, Button, Divider, IconButton, Surface, Switch, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/auth.service';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

const hasUpperCase = (v) => /[A-Z]/.test(v);
const hasLowerCase = (v) => /[a-z]/.test(v);
const hasNumber = (v) => /[0-9]/.test(v);
const hasSpecial = (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v);
const hasMinLength = (v) => v.length >= 8;

export default function ProfileScreen() {
  const { user, logout, updateUserInSession } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const colors = theme.colors;
  const isWide = width >= 769;

  const [notifBateria, setNotifBateria] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [twoFAModalVisible, setTwoFAModalVisible] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFAEnabled || false);
  const [twoFAMethod, setTwoFAMethod] = useState(user?.twoFAMethod || 'email');
  const [twoFAStep, setTwoFAStep] = useState('config');
  const [twoFACode, setTwoFACode] = useState('');
  const [form, setForm] = useState({
    name: user?.name || 'Usuario Demo',
    email: user?.email || 'usuario@correo.com',
    phone: user?.phone || '+57 300 000 0000',
  });
  const [emailForm, setEmailForm] = useState({ currentPassword: '', nextEmail: form.email });
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });

  const passReqs = {
    minLen: hasMinLength(passForm.next),
    upper: hasUpperCase(passForm.next),
    lower: hasLowerCase(passForm.next),
    number: hasNumber(passForm.next),
    special: hasSpecial(passForm.next),
    match: passForm.next.length > 0 && passForm.next === passForm.confirm,
  };
  const allPassReqsMet = Object.values(passReqs).every(Boolean);

  const handleSaveProfile = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert(t('error'), t('invalidInput'));
      return;
    }
    try {
      await authService.updateProfile(user.email, form.name.trim(), form.phone.trim());
      await updateUserInSession({ name: form.name.trim(), phone: form.phone.trim() });
      setIsEditing(false);
      Alert.alert(t('profileTitle'), t('profileUpdated'));
    } catch (error) {
      Alert.alert(t('error'), error.message || t('profileUpdateFailed'));
    }
  };

  const handleChangeEmail = async () => {
    if (!isValidEmail(emailForm.nextEmail)) {
      Alert.alert(t('error'), t('authInvalidEmail'));
      return;
    }
    if (!emailForm.currentPassword) {
      Alert.alert(t('error'), t('profilePasswordCurrentRequired'));
      return;
    }
    try {
      const updated = await authService.updateEmail(user.email, emailForm.currentPassword, emailForm.nextEmail);
      const nextEmail = updated.email;
      setForm(current => ({ ...current, email: nextEmail }));
      await updateUserInSession({ email: nextEmail });
      setEmailModalVisible(false);
      setEmailForm({ currentPassword: '', nextEmail });
      Alert.alert(t('success'), t('profileUpdated'));
    } catch (error) {
      Alert.alert(t('error'), error.message || t('profileUpdateFailed'));
    }
  };

  const handleChangePassword = async () => {
    if (!passForm.current) {
      Alert.alert(t('error'), t('profilePasswordCurrentRequired'));
      return;
    }
    if (!allPassReqsMet) {
      Alert.alert(t('profileSecurity'), t('profilePasswordRulesFailed'));
      return;
    }
    try {
      await authService.updatePassword(form.email, passForm.current, passForm.next);
      setPassModalVisible(false);
      setPassForm({ current: '', next: '', confirm: '' });
      Alert.alert(t('success'), t('profilePasswordUpdated'));
    } catch (error) {
      Alert.alert(t('error'), error.message || t('profilePasswordUpdateFailed'));
    }
  };

  const SettingItem = ({ label, subtitle, value, onValueChange, disabled }) => (
    <View style={[styles.settingItem, disabled && { opacity: 0.7 }]}>
      <View style={styles.settingTextCol}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {!!subtitle && <Text style={[styles.settingSub, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch value={!!value} onValueChange={disabled ? undefined : onValueChange} color={disabled ? colors.textSecondary : colors.accent} disabled={!!disabled} />
    </View>
  );

  const Field = ({ label, value, onChangeText, editable = true, keyboardType = 'default', secureTextEntry = false }) => (
    <View style={styles.inputWrap}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        dense
        style={[styles.input, { backgroundColor: editable ? colors.surfaceSecondary : colors.background }]}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        textColor={editable ? colors.text : colors.textSecondary}
      />
    </View>
  );

  const Requirement = ({ ok, label }) => (
    <View style={styles.checkRow}>
      <MaterialCommunityIcons name={ok ? 'check-circle' : 'circle-outline'} size={13} color={ok ? colors.accent : colors.textSecondary} />
      <Text style={[styles.checkLabel, { color: ok ? colors.accent : colors.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWeb, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>{t('tabProfile')}</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>{t('profileTitle')}</Text>
          </View>
        </View>

        <Surface style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={1}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('profileTitle')}</Text>
            <Button mode={isEditing ? 'contained' : 'outlined'} compact onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)} buttonColor={isEditing ? colors.primary : undefined} textColor={isEditing ? colors.textOnPrimary : colors.primary}>
              {isEditing ? t('profileSave') : t('profileEdit')}
            </Button>
          </View>
          <View style={[styles.profileRow, !isWide && styles.profileRowMobile]}>
            <Avatar.Text size={60} label={form.name.substring(0, 2).toUpperCase()} style={{ backgroundColor: colors.primary }} color={colors.textOnPrimary} />
            <View style={styles.profileInputs}>
              <Field label={t('profileName')} value={form.name} editable={isEditing} onChangeText={name => setForm(current => ({ ...current, name }))} />
              <Field label={t('profilePhone')} value={form.phone} editable={isEditing} keyboardType="phone-pad" onChangeText={phone => setForm(current => ({ ...current, phone }))} />
              <View style={styles.inputWrap}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('profileEmail')}</Text>
                <View style={styles.emailRow}>
                  <TextInput mode="outlined" value={form.email} editable={false} dense style={[styles.input, styles.emailInput, { backgroundColor: colors.background }]} outlineColor={colors.border} textColor={colors.textSecondary} />
                  <IconButton icon="pencil-lock-outline" iconColor={colors.primary} onPress={() => { setEmailForm({ currentPassword: '', nextEmail: form.email }); setEmailModalVisible(true); }} />
                </View>
              </View>
              {isEditing && (
                <Button mode="text" textColor={colors.textSecondary} onPress={() => { setIsEditing(false); setForm({ name: user?.name || form.name, email: user?.email || form.email, phone: user?.phone || form.phone }); }}>
                  {t('profileCancel')}
                </Button>
              )}
            </View>
          </View>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={1}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('profileNotifications')}</Text>
          <Text style={[styles.cardSubtitleInfo, { color: colors.textSecondary }]}>{t('profileNotificationsHelp')}</Text>
          <SettingItem label={t('profileArrival')} subtitle={t('profileRequired')} value disabled />
          <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingItem label={t('profileDeparture')} subtitle={t('profileRequired')} value disabled />
          <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingItem label={t('profileDeviation')} subtitle={t('profileRequired')} value disabled />
          <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingItem label={t('profileBattery')} value={notifBateria} onValueChange={setNotifBateria} />
          <Text style={[styles.cardTitle, { marginTop: 20, color: colors.text }]}>{t('profileNotificationChannels')}</Text>
          <SettingItem label={t('profileEmailNotif')} value={notifEmail} onValueChange={setNotifEmail} />
          <SettingItem label={t('profileSMSNotif')} value={notifSMS} onValueChange={setNotifSMS} />
        </Surface>

        <Surface style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={1}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('profileSecurity')}</Text>
          <TouchableOpacity style={[styles.actionRow, { backgroundColor: colors.surfaceSecondary }]} onPress={() => setPassModalVisible(true)}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profileChangePass')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, { backgroundColor: colors.surfaceSecondary }]} onPress={() => { setTwoFAStep('config'); setTwoFACode(''); setTwoFAModalVisible(true); }}>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile2FA')}</Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>{twoFAEnabled ? t('profileEnabled') : t('profileDisabled')}</Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={1}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('profileInfo')}</Text>
          <View style={[styles.infoRow, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profileAppVersion')}</Text>
            <Text style={[styles.infoValueText, { color: colors.textSecondary }]}>1.5</Text>
          </View>
          <View style={[styles.infoRow, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profileAccountType')}</Text>
            <View style={[styles.badgeGreen, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.badgeGreenText, { color: colors.accent }]}>{t('profileParentGuardian')}</Text>
            </View>
          </View>
        </Surface>

        <Button mode="contained" style={styles.logoutBtnRed} buttonColor={colors.error} textColor={colors.textOnPrimary} icon="logout" onPress={logout}>
          {t('profileLogout')}
        </Button>
      </ScrollView>

      <Modal visible={emailModalVisible} transparent animationType="fade" onRequestClose={() => setEmailModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Surface style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={5}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.primary }]}>{t('profileEmail')}</Text>
              <IconButton icon="close" size={20} iconColor={colors.textSecondary} onPress={() => setEmailModalVisible(false)} />
            </View>
            <Field label={t('profileEmail')} value={emailForm.nextEmail} keyboardType="email-address" onChangeText={nextEmail => setEmailForm(current => ({ ...current, nextEmail }))} />
            <Field label={t('profileCurrentPass')} value={emailForm.currentPassword} secureTextEntry onChangeText={currentPassword => setEmailForm(current => ({ ...current, currentPassword }))} />
            <Button mode="contained" buttonColor={colors.primary} textColor={colors.textOnPrimary} style={styles.modalButton} onPress={handleChangeEmail}>
              {t('profileSave')}
            </Button>
          </Surface>
        </View>
      </Modal>

      <Modal visible={passModalVisible} transparent animationType="fade" onRequestClose={() => setPassModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Surface style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={5}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.primary }]}>{t('profileChangePass')}</Text>
              <IconButton icon="close" size={20} iconColor={colors.textSecondary} onPress={() => setPassModalVisible(false)} />
            </View>
            <Field label={t('profileCurrentPass')} value={passForm.current} secureTextEntry onChangeText={current => setPassForm(prev => ({ ...prev, current }))} />
            <Field label={t('profileNewPass')} value={passForm.next} secureTextEntry onChangeText={next => setPassForm(prev => ({ ...prev, next }))} />
            {passForm.next.length > 0 && (
              <View style={[styles.reqsBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <Requirement ok={passReqs.minLen} label={t('securityMinLength')} />
                <Requirement ok={passReqs.upper} label={t('securityUpper')} />
                <Requirement ok={passReqs.lower} label={t('securityLower')} />
                <Requirement ok={passReqs.number} label={t('securityNumber')} />
                <Requirement ok={passReqs.special} label={t('securitySpecial')} />
              </View>
            )}
            <Field label={t('profileConfirmPass')} value={passForm.confirm} secureTextEntry onChangeText={confirm => setPassForm(prev => ({ ...prev, confirm }))} />
            <Button mode="contained" onPress={handleChangePassword} style={styles.modalButton} buttonColor={allPassReqsMet ? colors.primary : colors.border} textColor={allPassReqsMet ? colors.textOnPrimary : colors.textSecondary}>
              {t('profileUpdatePass')}
            </Button>
          </Surface>
        </View>
      </Modal>

      <Modal visible={twoFAModalVisible} transparent animationType="fade" onRequestClose={() => setTwoFAModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Surface style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={5}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.primary }]}>{t('profile2FA')}</Text>
              <IconButton icon="close" size={20} iconColor={colors.textSecondary} onPress={() => setTwoFAModalVisible(false)} />
            </View>
            {twoFAStep === 'config' ? (
              <View>
                <View style={[styles.twoFAStatusBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name={twoFAEnabled ? 'shield-check' : 'shield-off-outline'} size={32} color={twoFAEnabled ? colors.accent : colors.textSecondary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.twoFAStatusTitle, { color: colors.text }]}>{twoFAEnabled ? t('twoFAActive') : t('twoFAInactive')}</Text>
                    <Text style={[styles.twoFAStatusSub, { color: colors.textSecondary }]}>{twoFAEnabled ? t('twoFAProtected') : t('twoFAEnableHelp')}</Text>
                  </View>
                  <Switch value={twoFAEnabled} color={colors.accent} onValueChange={async (enabled) => {
                    if (!enabled) {
                      await authService.update2FA(form.email, false);
                      await updateUserInSession({ twoFAEnabled: false });
                      setTwoFAEnabled(false);
                    } else {
                      setTwoFAStep('verify');
                    }
                  }} />
                </View>
                {!twoFAEnabled && ['email', 'sms'].map(method => (
                  <TouchableOpacity key={method} style={[styles.twoFAMethodBtn, { backgroundColor: colors.surfaceSecondary, borderColor: twoFAMethod === method ? colors.primary : colors.border }]} onPress={() => setTwoFAMethod(method)}>
                    <MaterialCommunityIcons name={method === 'email' ? 'email-outline' : 'message-outline'} size={20} color={twoFAMethod === method ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.twoFAMethodText, { color: colors.text }]}>{method === 'email' ? t('twoFAEmail') : t('twoFASMS')}</Text>
                  </TouchableOpacity>
                ))}
                {!twoFAEnabled && <Button mode="contained" buttonColor={colors.primary} textColor={colors.textOnPrimary} onPress={() => setTwoFAStep('verify')}>{t('twoFASendCode')}</Button>}
              </View>
            ) : (
              <View>
                <Text style={[styles.twoFAStatusSub, { color: colors.textSecondary, marginBottom: 12 }]}>{t('twoFADemoCode')} 847291</Text>
                <Field label={t('twoFAEnterCode')} value={twoFACode} keyboardType="number-pad" onChangeText={setTwoFACode} />
                <Button mode="contained" buttonColor={colors.primary} textColor={colors.textOnPrimary} onPress={async () => {
                  if (twoFACode !== '847291') {
                    Alert.alert(t('error'), t('twoFAInvalidCode'));
                    return;
                  }
                  await authService.update2FA(form.email, true, twoFAMethod);
                  await updateUserInSession({ twoFAEnabled: true, twoFAMethod });
                  setTwoFAEnabled(true);
                  setTwoFAModalVisible(false);
                  setTwoFAStep('config');
                  setTwoFACode('');
                  Alert.alert(t('twoFAActivationTitle'), t('twoFAActivated'));
                }}>{t('twoFAVerifyActivate')}</Button>
              </View>
            )}
          </Surface>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  scrollContentWeb: { maxWidth: 860, alignSelf: 'center', width: '100%', paddingTop: 40 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: 'bold' },
  pageSubtitle: { fontSize: 12, marginTop: 4 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitleInfo: { fontSize: 12, marginBottom: 16 },
  profileRow: { flexDirection: 'row' },
  profileRowMobile: { flexDirection: 'column', gap: 16 },
  profileInputs: { flex: 1, marginLeft: 16 },
  inputWrap: { marginBottom: 12 },
  inputLabel: { fontSize: 11, marginLeft: 4, marginBottom: 4 },
  input: { height: 45, fontSize: 13 },
  emailRow: { flexDirection: 'row', alignItems: 'center' },
  emailInput: { flex: 1 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingTextCol: { flex: 1, paddingRight: 16 },
  settingLabel: { fontSize: 13, fontWeight: '500' },
  settingSub: { fontSize: 11, marginTop: 2 },
  divider: { marginVertical: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginTop: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginTop: 10 },
  infoValueText: { fontSize: 13 },
  badgeGreen: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeGreenText: { fontSize: 10, fontWeight: 'bold' },
  logoutBtnRed: { marginTop: 10, borderRadius: 8, paddingVertical: 4 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalSheet: { borderRadius: 12, padding: 20, width: '100%', maxWidth: 460, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, paddingBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalButton: { borderRadius: 8, marginTop: 8 },
  reqsBox: { borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  checkLabel: { fontSize: 12 },
  twoFAStatusBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1 },
  twoFAStatusTitle: { fontSize: 14, fontWeight: '700' },
  twoFAStatusSub: { fontSize: 12, marginTop: 2 },
  twoFAMethodBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, gap: 10 },
  twoFAMethodText: { fontSize: 13, fontWeight: '600' },
});
