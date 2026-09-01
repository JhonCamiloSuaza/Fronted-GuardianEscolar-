import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert, Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform, RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Avatar, Button, FAB, Surface, Text } from 'react-native-paper';
import { COLORS } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { addHistory, addNotification, addStudent, deleteStudent, getStudents, updateStudent } from '../../utils/studentStorage';

const { width } = Dimensions.get('window');
const isWeb = width > 768;
const isTablet = width > 600 && width <= 1024;

const EMPTY_FORM = { nombre: '', grado: '', colegio: '', edad: '', contacto_nombre: '', contacto_telefono: '', status: 'SAFE' };

export default function StudentScreen() {
  const [students, setStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // null = agregar, obj = editar
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fotoCargada, setFotoCargada] = useState(null); // guardara la URI de la imagen
  const [codigoGenerado, setCodigoGenerado] = useState(null);
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const colors = theme.colors;
  const themed = {
    screen: { backgroundColor: colors.background },
    surface: { backgroundColor: colors.surface, borderColor: colors.border },
    surfaceSecondary: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
    input: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text },
    overlay: { backgroundColor: colors.overlay },
  };

  // Recarga cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [])
  );

  async function loadStudents() {
    setRefreshing(true);
    // Simular retraso de red para que se vea el cargador
    setTimeout(async () => {
      const data = await getStudents();
      setStudents(data);
      setRefreshing(false);
    }, 1000);
  }

  function openAdd() {
    setEditingStudent(null);
    setForm(EMPTY_FORM);
    setFotoCargada(null);
    setCodigoGenerado(null);
    setModalVisible(true);
  }

  function openEdit(student) {
    setEditingStudent(student);
    setForm({
      nombre: student.nombre,
      grado: student.grado,
      colegio: student.colegio,
      edad: student.edad || '',
      contacto_nombre: student.contacto_nombre || '',
      contacto_telefono: student.contacto_telefono || '',
      status: student.status || 'SAFE'
    });
    setFotoCargada(student.foto || null);
    setCodigoGenerado(student.codigo_vinculacion || null);
    setModalVisible(true);
  }

  function confirmDelete(student) {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${t('studDeleteConfirm')} ${student.nombre}? ${t('studDeleteWarning')}`);
      if (confirmed) {
        (async () => {
          const updated = await deleteStudent(student.id);
          setStudents(updated);
        })();
      }
      return;
    }

    Alert.alert(
      t('studDelete'),
      `${t('studDeleteConfirm')} ${student.nombre}? ${t('studDeleteWarning')}`,
      [
        { text: t('cncel'), style: 'cncel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteStudent(student.id);
            setStudents(updated);
          },
        },
      ]
    );
  }

  const pickImage = async () => {
    // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('studPermDenied'), t('studPermMsg'));
        return;
      }

    // Abrir galería
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFotoCargada(result.assets[0].uri);
    }
  };

  async function handleSave() {
    if (!form.nombre.trim()) {
      Alert.alert(t('studRequiredField'), t('studRequiredName'));
      return;
    }
    if (!form.edad.trim() || Number(form.edad) < 1 || Number(form.edad) > 100) {
      Alert.alert(t('studRequiredField'), 'La edad debe estar entre 1 y 100.');
      return;
    }
    if (!form.grado.trim()) {
      Alert.alert(t('studRequiredField'), 'El grado es obligatorio.');
      return;
    }
    if (!form.contacto_nombre.trim()) {
      Alert.alert(t('studRequiredField'), 'El contacto de emergencia es obligatorio.');
      return;
    }
    const phoneDigits = form.contacto_telefono.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      Alert.alert(t('studRequiredField'), 'Ingresa un teléfono válido, solo números.');
      return;
    }
    setLoading(true);
    try {
      let updated;
      const dataToSave = { ...form, foto: fotoCargada, codigo_vinculacion: codigoGenerado };
      if (editingStudent) {
        updated = await updateStudent(editingStudent.id, dataToSave);
      } else {
        updated = await addStudent(dataToSave);
      }
      setStudents(updated);
      
      // Registrar en Notificaciones e Historial si el estado es relevante
      if (form.status) {
        const msg = form.status === 'WARNING' ? 'salio de la zona segura (Alerta)' : 
                    form.status === 'INFO' ? 'está en camino' : 
                    'llego a zona segura';
        
        await addNotification({
          studentId: editingStudent ? editingStudent.id : updated[updated.length - 1].id,
          type: form.status === 'WARNING' ? 'Advertencias' : 
                form.status === 'INFO' ? 'Informativas' : 'Exitosas',
          name: form.nombre,
          message: `${form.nombre} ${msg}`,
          color: form.status === 'WARNING' ? COLORS.ALERTA : 
                 form.status === 'INFO' ? COLORS.PRIMARIO : COLORS.ACENTO
        });

        await addHistory({
          studentId: editingStudent ? editingStudent.id : updated[updated.length - 1].id,
          estudiante: form.nombre,
          horaInicio: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          horaFin: '--',
          duracion: '--',
          distancia: '--',
          estado: form.status === 'WARNING' ? 'Con Incidente' : 
                  form.status === 'INFO' ? 'En Proceso' : 'Completado',
          alerta: form.status === 'WARNING',
          ruta: 'Actualización manual',
          studentColor: form.status === 'WARNING' ? COLORS.ALERTA : 
                        form.status === 'INFO' ? COLORS.PRIMARIO : COLORS.ACENTO
        });
      }

      setModalVisible(false);
    } finally {
      setLoading(false);
    }
  }

  const StudentCard = ({ item }) => (
    <Surface style={[styles.childCard, themed.surface, { flex: isWeb ? 1 : undefined }]} elevation={2}>
      <View style={styles.childAvatarWrap}>
        {item.foto && item.foto.trim().length > 0 && item.foto !== 'null' && item.foto !== 'undefined' ? (
          <Avatar.Image 
            size={80} 
            source={{ uri: item.foto }} 
            style={{
              backgroundColor: item.status === 'WARNING' ? COLORS.ALERTA : 
                               item.status === 'INFO' ? COLORS.PRIMARIO : COLORS.ACENTO
            }}
          />
        ) : (
          <Avatar.Text
            size={80}
            label={item.nombre ? item.nombre.substring(0, 2).toUpperCase() : '??'}
            style={{
              backgroundColor: item.status === 'WARNING' ? COLORS.ALERTA : 
                               item.status === 'INFO' ? COLORS.PRIMARIO : COLORS.ACENTO
            }}
            color={COLORS.BLANCO}
          />
        )}
      </View>
      <Text style={[styles.childName, themed.text]}>{item.nombre}</Text>
      <Text style={[styles.childSub, themed.textSecondary]}>
        {item.edad ? `${item.edad} ${t('studYears')}` : ''} {item.grado ? `- ${t('live') === 'Live' ? item.grado.replace('ro Grado', 'rd Grade').replace('to Grado', 'th Grade').replace('do Grado', 'nd Grade').replace('er Grado', 'st Grade').replace('Grado', 'Grade').replace('1ro', '1st Grade').replace('2do', '2nd Grade').replace('3ro', '3rd Grade').replace('4to', '4th Grade').replace('5to', '5th Grade').replace('do', 'nd').replace('ro', 'rd').replace('to', 'th') : item.grado}` : ''}
      </Text>
      
      <View style={styles.badgeWrap}>
        <View style={[
          styles.badgeActive, 
          item.status === 'WARNING' && { backgroundColor: COLORS.ALERTA },
          item.status === 'INFO' && { backgroundColor: COLORS.PRIMARIO }
        ]}>
          <Text style={styles.badgeText}>
            {item.status === 'WARNING' ? t('studAlert') : 
             item.status === 'INFO' ? t('studOnRoute') : t('studSafeZone')}
          </Text>
        </View>
      </View>

      <View style={[styles.contactBox, themed.surfaceSecondary]}>
        <Text style={[styles.contactLabel, themed.text]}>{t('studEmergencyContact')}</Text>
        <Text style={[styles.contactName, themed.textSecondary]}>{item.contacto_nombre || t('studNotAssigned')}</Text>
        <Text style={[styles.contactPhone, themed.textSecondary]}>{item.contacto_telefono || t('studNotAssigned')}</Text>
      </View>

      <Button 
        mode="contained" 
        buttonColor={
          item.status === 'WARNING' ? COLORS.ALERTA : 
          item.status === 'INFO' ? COLORS.PRIMARIO : COLORS.ACENTO
        }
        style={styles.verMapaBtn}
        onPress={() => router.push({ pathname: '/(tabs)/tracking', params: { id: item.id, name: item.nombre } })}
      >
        {t('studViewMap')}
      </Button>

      {/* Acciones flotantes */}
      <View style={styles.cardActionsFloating}>
        <TouchableOpacity style={[styles.actionBtnIcon, themed.surfaceSecondary]} onPress={() => openEdit(item)} accessibilityLabel={t('edit')}>
          <MaterialCommunityIcons name="pencil" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtnIcon, themed.surfaceSecondary]} onPress={() => confirmDelete(item)} accessibilityLabel={t('delete')}>
          <MaterialCommunityIcons name="trash-can" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </Surface>
  );

  return (
    <View style={[styles.container, themed.screen]}>
      {students.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-school-outline" size={90} color={colors.border} />
          <Text style={[styles.emptyTitle, themed.text]}>{t('studEmpty')}</Text>
          <Text style={[styles.emptySub, themed.textSecondary]}>{t('studEmptySub')}</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          numColumns={isWeb ? 3 : 1}
          key={isWeb ? 'grid' : 'list'}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={isWeb ? styles.columnWrapper : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadStudents} colors={[COLORS.PRIMARIO]} tintColor={COLORS.PRIMARIO} />
          }
          ListHeaderComponent={
            <View style={styles.pageHeader}>
              <Text style={[styles.pageTitle, themed.text]}>{t('studTitle')}</Text>
              <Text style={[styles.pageSubtitle, themed.textSecondary]}>{t('studSubtitle')}</Text>
            </View>
          }
          renderItem={({ item }) => <StudentCard item={item} />}
        />
      )}

      {/* FAB Agregar */}
      <FAB
        icon="plus"
        style={styles.fabNew}
        color={colors.textOnAccent}
        onPress={openAdd}
      />

      {/* Modal Agregar / Editar */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, themed.overlay]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKAV}
          >
            <Surface style={[styles.modalSheetMockup, themed.surface]} elevation={5}>
              {/* Header */}
              <View style={[styles.modalHeaderMockup, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitleMockup, themed.text]}>
                  {editingStudent ? t('studEditTitle') : t('studAddTitle')}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mockupScroll}>
                <Text style={[styles.mockupLabel, themed.textSecondary]}>Nombre completo del estudiante *</Text>
                <TextInput
                  style={[styles.mockupInput, themed.input]}
                  value={form.nombre}
                  onChangeText={v => setForm(f => ({ ...f, nombre: v }))}
                />

                <View style={styles.mockupRow}>
                  <View style={styles.mockupHalfFieldLeft}>
                    <Text style={[styles.mockupLabel, themed.textSecondary]}>Edad</Text>
                    <TextInput
                      style={[styles.mockupInput, themed.input]}
                      value={form.edad}
                      onChangeText={v => setForm(f => ({ ...f, edad: v.replace(/\D/g, '').slice(0, 3) }))}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.mockupHalfFieldRight}>
                    <Text style={[styles.mockupLabel, themed.textSecondary]}>Grado</Text>
                    <TextInput
                      style={[styles.mockupInput, themed.input]}
                      value={form.grado}
                      onChangeText={v => setForm(f => ({ ...f, grado: v }))}
                    />
                  </View>
                </View>

                <Text style={[styles.mockupLabel, themed.textSecondary]}>Contacto de Emergencia</Text>
                <TextInput
                  style={[styles.mockupInput, themed.input]}
                  value={form.contacto_nombre}
                  onChangeText={v => setForm(f => ({ ...f, contacto_nombre: v }))}
                />

                <Text style={[styles.mockupLabel, themed.textSecondary]}>Teléfono de emergencia</Text>
                <TextInput
                  style={[styles.mockupInput, themed.input]}
                  value={form.contacto_telefono}
                  onChangeText={v => setForm(f => ({ ...f, contacto_telefono: v.replace(/\D/g, '').slice(0, 15) }))}
                  keyboardType="phone-pad"
                />

                <Text style={[styles.mockupLabel, themed.textSecondary]}>Estado de Simulación</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {[
                    { id: 'SAFE', label: 'Seguro', color: COLORS.ACENTO },
                    { id: 'INFO', label: 'Trayecto', color: COLORS.PRIMARIO },
                    { id: 'WARNING', label: 'Alerta', color: COLORS.ALERTA }
                  ].map(status => (
                    <TouchableOpacity
                      key={status.id}
                      onPress={() => setForm(f => ({ ...f, status: status.id }))}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: form.status === status.id ? status.color : colors.surfaceSecondary,
                        borderWidth: 1,
                        borderColor: form.status === status.id ? status.color : colors.border,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ 
                        fontSize: 12, 
                        fontWeight: '600', 
                        color: form.status === status.id ? COLORS.BLANCO : colors.textSecondary 
                      }}>
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.mockupLabel, themed.textSecondary]}>Subir foto del estudiante (Opcional)</Text>
                
                {fotoCargada && (
                  <View style={{ alignItems: 'center', marginBottom: 10, position: 'relative', alignSelf: 'center' }}>
                    <Avatar.Image size={80} source={{ uri: fotoCargada }} />
                    <TouchableOpacity 
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: colors.error,
                        borderRadius: 15,
                        width: 26,
                        height: 26,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: colors.surface
                      }}
                      onPress={() => setFotoCargada(null)}
                    >
                      <MaterialCommunityIcons name="close" size={16} color={COLORS.BLANCO} />
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.mockupUploadBtn, { borderColor: colors.border }, fotoCargada && { borderColor: colors.accent, backgroundColor: colors.accentLight }]} 
                  onPress={pickImage}
                >
                  <Text style={[styles.mockupUploadText, themed.textSecondary, fotoCargada && { color: colors.accent, fontWeight: 'bold' }]}>
                    {fotoCargada ? 'Cambiar Foto' : 'Cargar Foto'}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.mockupInfoBox, { borderColor: colors.primary }]}>
                  <Text style={[styles.mockupInfoTitle, { color: colors.primary }]}>Vincular Dispositivo del Estudiante</Text>
                  <Text style={[styles.mockupInfoDesc, themed.textSecondary]}>
                    El estudiante no necesita cuenta. Solo instala la app en su celular y vincula su dispositivo usando el código QR o token.
                  </Text>
                  
                  {codigoGenerado ? (
                    <View style={[styles.codigoBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                      <Text style={[styles.codigoText, { color: colors.primary }]}>Código: {codigoGenerado}</Text>
                      <Text style={[styles.codigoHint, themed.textSecondary]}>Ingresa este código en el celular del estudiante</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.mockupGenerateBtn, { backgroundColor: colors.primary }]} 
                      onPress={() => {
                        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
                        setCodigoGenerado(randomCode);
                        Alert.alert('Código Generado', `El código de vinculación es: ${randomCode}`);
                      }}
                    >
                      <Text style={styles.mockupGenerateText}>Generar código de vinculación</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
              <View style={[styles.mockupActions, { borderTopColor: colors.border }]}>
                <TouchableOpacity style={[styles.mockupCancelBtn, { borderColor: colors.border }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.mockupCancelText, themed.text]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.mockupSaveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={loading}>
                  <Text style={styles.mockupSaveText}>{loading ? t('loading') : 'Guardar'}</Text>
                </TouchableOpacity>
              </View>
            </Surface>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, icon, value, onChange, placeholder, keyboardType }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInput}>
        <MaterialCommunityIcons name={icon} size={18} color={COLORS.PRIMARIO} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TEXTO_SECUNDARIO}
          keyboardType={keyboardType || 'default'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.FONDO_PRINCIPAL,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  listWeb: { 
    maxWidth: 800, 
    alignSelf: 'center', 
    width: '100%', 
    paddingTop: 20 
  },
  listContainer: {
    padding: 24,
    paddingBottom: 100,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  columnWrapper: {
    gap: 20,
    justifyContent: 'flex-start',
  },
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  /* ── Nueva Tarjeta Mis Hijos ── */
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    marginBottom: 20,
    position: 'relative',
    maxWidth: 350,
    shadowColor: COLORS.NEGRO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  childAvatarWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  childSub: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 2,
  },
  badgeWrap: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  badgeActive: {
    backgroundColor: COLORS.ACENTO,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  contactBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  contactLabel: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 12,
    color: '#6B7280',
  },
  contactPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  verMapaBtn: {
    borderRadius: 8,
    minHeight: 42,
    justifyContent: 'center',
  },
  cardActionsFloating: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  actionBtnIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.GRIS_BORDE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* ── Estado vacío ── */
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.NEGRO,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.TEXTO_SECUNDARIO,
    textAlign: 'center',
  },
  /* ── FAB ── */
  fabNew: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#84CC16',
    borderRadius: 30,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isWeb ? 24 : 10,
    paddingVertical: 18,
  },
  modalKAV: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalSheet: {
    backgroundColor: COLORS.FONDO_TARJETA,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxWidth: isWeb ? 600 : undefined,
    alignSelf: isWeb ? 'center' : undefined,
    width: isWeb ? '100%' : undefined,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.NEGRO,
  },
  /* ── Campos ── */
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXTO_SECUNDARIO,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.FONDO_PRINCIPAL,
    borderWidth: 1.5,
    borderColor: COLORS.GRIS_BORDE,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.NEGRO,
  },
  /* ── Preview Avatar ── */
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.FONDO_PRINCIPAL,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.GRIS_BORDE,
  },
  previewName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.PRIMARIO,
  },
  /* ── Botón Guardar Viejo ── */
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARIO,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveBtnText: {
    color: COLORS.BLANCO,
    fontSize: 15,
    fontWeight: 'bold',
  },
  
  /* ── Estilos del Mockup ── */
  modalSheetMockup: {
    backgroundColor: COLORS.BLANCO,
    borderRadius: 10,
    paddingTop: 14,
    paddingBottom: 0,
    maxWidth: 780,
    alignSelf: 'center',
    width: isWeb ? (isTablet ? '85%' : '82%') : '95%',
    maxHeight: '86%',
    overflow: 'hidden',
  },
  modalHeaderMockup: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitleMockup: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  mockupScroll: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  mockupLabel: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 6,
  },
  mockupInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    minHeight: 40,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: '#FFF',
    fontSize: 13,
  },
  mockupRow: {
    flexDirection: isWeb ? 'row' : 'column',
    justifyContent: 'space-between',
  },
  mockupHalfFieldLeft: {
    flex: 1,
    marginRight: isWeb ? 10 : 0,
  },
  mockupHalfFieldRight: {
    flex: 1,
    marginLeft: isWeb ? 10 : 0,
  },
  mockupUploadBtn: {
    borderWidth: 1,
    borderColor: '#6B7280',
    borderRadius: 6,
    minHeight: 42,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  mockupUploadText: {
    fontSize: 13,
    color: '#374151',
  },
  mockupInfoBox: {
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 6,
    padding: 16,
    marginBottom: 24,
    minHeight: 138,
  },
  mockupInfoTitle: {
    fontSize: 13,
    color: '#2563EB',
    marginBottom: 8,
  },
  mockupInfoDesc: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 18,
  },
  mockupGenerateBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 6,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockupGenerateText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  codigoBox: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    width: '100%',
  },
  codigoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4338CA',
    letterSpacing: 2,
    textAlign: 'center',
  },
  codigoHint: {
    fontSize: 11,
    color: '#6366F1',
    marginTop: 4,
  },
  mockupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
  },
  mockupCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupCancelText: {
    color: '#111827',
    fontSize: 13,
  },
  mockupSaveBtn: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    borderRadius: 6,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupSaveText: {
    color: '#FFF',
    fontSize: 13,
  },
});
