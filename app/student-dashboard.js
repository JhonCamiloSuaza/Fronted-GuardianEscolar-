import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Platform, StatusBar } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function StudentDashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Datos del estudiante
  const studentName = params.nombre || 'Estudiante Demo';
  const studentAge = params.edad || 'No especificada';
  const studentGrade = params.grado || 'No especificado';
  const studentSchool = params.colegio || 'No especificada';
  const studentId = params.id || 'EST-000-0000';

  // Datos del contacto de emergencia (Acudiente logueado)
  const parentName = user?.name || 'Acudiente Demo';
  const parentPhone = user?.phone || '+57 300 000 0000';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GPS Guardian Escolar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          
          {/* Card 1: Estado de Rastreo */}
          <Surface style={[styles.card, styles.statusCard]} elevation={2}>
            <View style={styles.statusIconWrap}>
              <MaterialCommunityIcons name="magnify" size={24} color="#FFF" />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusTitle}>Rastreo activado correctamente</Text>
              <Text style={styles.statusSubtitle}>La Aplicación funciona en segundo plano</Text>
            </View>
          </Surface>

          {/* Card 2: Mi Información */}
          <Surface style={styles.card} elevation={2}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account" size={24} color={COLORS.PRIMARIO} />
              <Text style={styles.cardTitle}>Mi informacion</Text>
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

            <View style={styles.infoRow}>
              <View style={styles.infoColFull}>
                <Text style={styles.label}>Escuela</Text>
                <Text style={styles.value}>{studentSchool}</Text>
              </View>
            </View>

            <View style={styles.idBox}>
              <Text style={styles.idText}>ID Estudiante: {studentId}</Text>
            </View>
          </Surface>

          {/* Card 3: Contacto de Emergencia */}
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
              onPress={() => {}}
            >
              Llama de Emergencia
            </Button>
          </Surface>

          {/* Card 4: ¿Como funciona el rastreo? */}
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
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusIconWrap: {
    backgroundColor: '#65A30D',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
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
