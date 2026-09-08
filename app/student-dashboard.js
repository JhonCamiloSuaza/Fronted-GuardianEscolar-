import React from 'react';
import { Alert, Linking, Platform, View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, Surface, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { studentService } from '../services/student.service';
import { BASE_URL } from '../config/endpoints';

const DEVICE_ID_KEY = '@guardian_student_device_id';

const GRADE_LABELS = {
  PRE_KINDER: 'Pre Kinder',
  KINDER: 'Kinder',
  TRANSITION: 'Transicion',
  FIRST: 'Primero',
  SECOND: 'Segundo',
  THIRD: 'Tercero',
  FOURTH: 'Cuarto',
  FIFTH: 'Quinto',
  SIXTH: 'Sexto',
  SEVENTH: 'Septimo',
  EIGHTH: 'Octavo',
  NINTH: 'Noveno',
  TENTH: 'Decimo',
  ELEVENTH: 'Undecimo',
};

async function getStudentDeviceId() {
  const current = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (current) return current;
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const next = `student-device-${randomId}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

function platformName() {
  if (Platform.OS === 'ios') return 'IOS';
  if (Platform.OS === 'android') return 'ANDROID';
  return 'WEB';
}

function calculateAge(birthDate) {
  if (!birthDate) return '';
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? String(age) : '';
}

export default function StudentDashboardScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [studentProfile, setStudentProfile] = React.useState(null);
  
  // Datos del estudiante
  const studentName = studentProfile?.fullName || studentProfile?.nombreCompleto || params.nombre || 'Estudiante';
  const studentAge = calculateAge(studentProfile?.birthDate || studentProfile?.fechaNacimiento) || params.edad || 'No especificada';
  const studentGrade = GRADE_LABELS[studentProfile?.schoolGrade || studentProfile?.gradoEscolar] || params.grado || 'No especificado';
  const studentId = params.id || 'No asignado';
  const studentCode = params.codigo || 'No asignado';
  const [linkStatus, setLinkStatus] = React.useState('idle');
  const [linkedCount, setLinkedCount] = React.useState(null);
  const [linkError, setLinkError] = React.useState('');

  // Datos del contacto de emergencia enviados por el QR.
  const parentName = studentProfile?.contactName || studentProfile?.contactoNombre || params.contacto || user?.name || 'No registrado';
  const parentPhone = studentProfile?.contactPhone || studentProfile?.contactoTelefono || params.telefono || user?.phone || '';

  React.useEffect(() => {
    let mounted = true;
    const connectStudent = async () => {
      try {
        if (!params.id || !params.codigo) {
          throw new Error('El QR no incluye datos de vinculacion completos.');
        }
        const profile = await studentService.linkedProfile(String(params.id), String(params.codigo));
        if (mounted) {
          setStudentProfile(profile);
        }
        const deviceIdentifier = await getStudentDeviceId();
        const response = await studentService.linkDevice({
          studentId: String(params.id),
          code: String(params.codigo),
          deviceIdentifier,
          platform: platformName(),
          deviceName: Platform.OS === 'web' ? 'Navegador del estudiante' : 'Celular del estudiante',
        });
        if (!mounted) return;
        setLinkedCount(response.linkedDevices);
        setLinkStatus('linked');
      } catch (error) {
        if (!mounted) return;
        setLinkError(error.message || 'No se pudo conectar con el backend.');
        setLinkStatus('error');
      }
    };

    connectStudent();
    return () => {
      mounted = false;
    };
  }, [params.codigo, params.id]);

  const callEmergencyContact = async () => {
    const phoneDigits = String(parentPhone).replace(/[^\d+]/g, '');
    if (!phoneDigits || phoneDigits === 'No registrado') {
      Alert.alert('Contacto no disponible', 'Este QR no tiene un teléfono de emergencia válido.');
      return;
    }

    const phoneUrl = `tel:${phoneDigits}`;
    const supported = await Linking.canOpenURL(phoneUrl);
    if (!supported) {
      Alert.alert('No se puede llamar', 'Este dispositivo no permite abrir llamadas telefonicas.');
      return;
    }
    await Linking.openURL(phoneUrl);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>GPS Guardian Escolar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {linkStatus !== 'idle' && (
            <Surface
              style={[
                styles.connectionCard,
                linkStatus === 'linked' ? styles.connectionCardOk : styles.connectionCardError,
              ]}
              elevation={1}
            >
              <MaterialCommunityIcons
                name={linkStatus === 'linked' ? 'check-circle' : 'alert-circle'}
                size={22}
                color={linkStatus === 'linked' ? '#166534' : '#B91C1C'}
              />
              <View style={styles.connectionTextWrap}>
                <Text
                  style={[
                    styles.connectionTitle,
                    { color: linkStatus === 'linked' ? '#166534' : '#B91C1C' },
                  ]}
                >
                  {linkStatus === 'linked' ? 'Celular conectado al estudiante' : 'No se pudo conectar este celular'}
                </Text>
                <Text style={styles.connectionSubtitle}>
                  {linkStatus === 'linked'
                    ? `Este celular ya puede enviar ubicación. Dispositivos vinculados: ${linkedCount ?? 1}.`
                    : linkError || 'Verifica que el QR sea válido o vuelve a escanearlo.'}
                </Text>
                {linkStatus === 'error' && (
                  <Text style={styles.connectionDebug} numberOfLines={1}>
                    API: {BASE_URL}
                  </Text>
                )}
              </View>
            </Surface>
          )}

          {/* Card 1: Mi Información */}
          <Surface style={styles.card} elevation={2}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account" size={24} color={COLORS.PRIMARIO} />
              <Text style={styles.cardTitle}>Mi información</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoColFull}>
                <Text style={styles.label}>Nombre Completo</Text>
                <Text style={styles.value}>{studentName}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.label}>Edad</Text>
                <Text style={styles.value}>{studentAge}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.label}>Grado</Text>
                <Text style={styles.value}>{studentGrade}</Text>
              </View>
            </View>

            <View style={styles.idBox}>
              <Text style={styles.idText}>ID Estudiante: {studentId}</Text>
              <Text style={styles.idText}>Código QR: {studentCode}</Text>
            </View>
          </Surface>

          {/* Card 2: Contacto de Emergencia */}
          <Surface style={styles.card} elevation={2}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="phone" size={24} color={COLORS.TEXTO_SECUNDARIO} />
              <Text style={styles.cardTitle}>Contacto de Emergencia</Text>
            </View>

            <View style={styles.inputSim}>
              <Text style={styles.inputLabel}>Nombre Completo</Text>
              <View style={styles.inputField}>
                <Text style={styles.inputValue}>{parentName}</Text>
              </View>
            </View>

            <View style={styles.inputSim}>
              <Text style={styles.inputLabel}>Telefono</Text>
              <View style={styles.inputField}>
                <Text style={[styles.inputValue, { color: COLORS.PRIMARIO }]}>{parentPhone}</Text>
              </View>
            </View>

            <Button 
              mode="contained" 
              buttonColor="#E11D48" 
              textColor="#FFF"
              style={styles.emergencyBtn}
              disabled={!parentPhone}
              onPress={callEmergencyContact}
            >
              Llamar Emergencia
            </Button>
          </Surface>

          {/* Card 3: ¿Como funciona el rastreo? */}
          <Surface style={styles.card} elevation={2}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="target" size={24} color="#E11D48" />
              <Text style={styles.cardTitle}>¿Como funciona el rastreo?</Text>
            </View>

            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>La aplicación envía tu ubicación en segundo plano automáticamente</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Solo tus padres pueden ver dónde estás</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>Tus datos están protegidos con encriptación</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>No necesitas abrir la app, funciona automáticamente</Text>
              </View>
            </View>
          </Surface>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6F9' },
  header: {
    backgroundColor: '#1E3A8A',
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  connectionCardOk: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  connectionCardError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  connectionTextWrap: {
    flex: 1,
  },
  connectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  connectionSubtitle: {
    color: '#4B5563',
    fontSize: 12,
    marginTop: 2,
  },
  connectionDebug: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoColFull: {
    flex: 1,
  },
  infoCol: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  idBox: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  idText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  inputSim: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    marginLeft: 4,
  },
  inputField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  emergencyBtn: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 4,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
});
