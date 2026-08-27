import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Avatar, Text, Surface, IconButton, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { COLORS } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeMap from '../../components/SafeMap';
import { getStudents, getInitials } from '../../utils/studentStorage';
import { useLanguage } from '../../contexts/LanguageContext';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

const INITIAL_REGION = {
  latitude: 4.5709,
  longitude: -74.2973,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  // Cargar estudiantes reales
  useFocusEffect(
    useCallback(() => {
      getStudents().then(data => {
        setStudents(data);
        if (params.id && !selectedStudent) {
          const found = data.find(s => s.id === params.id);
          if (found) {
            setSelectedStudent(found);
            updateStudentSim(found);
          }
        } else if (data.length > 0 && !selectedStudent) {
          setSelectedStudent(data[0]);
          updateStudentSim(data[0]);
        }
      });
    }, [params.id])
  );

  const updateStudentSim = (student) => {
    if (!student) return;
    const offset = (student.nombre.length % 10) * 0.002;
    setLocation({
      latitude: 4.5709 + offset,
      longitude: -74.2973 - offset,
    });
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    updateStudentSim(student);
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation(INITIAL_REGION);
          setIsLoading(false);
          return;
        }
        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(initial.coords);
        setIsLoading(false);
      } catch (e) {
        setLocation(INITIAL_REGION);
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, isWeb && styles.scrollContentWeb]}>

        {/* Cabecera del Estudiante */}
        <Surface style={styles.headerCard} elevation={1}>
          <View style={styles.headerProfile}>
            <Avatar.Text
              size={40}
              label={selectedStudent ? getInitials(selectedStudent.nombre) : '??'}
              backgroundColor={COLORS.PRIMARIO}
              color={COLORS.BLANCO}
            />
            <View style={styles.headerTextCol}>
              <Text style={styles.studentName}>{selectedStudent?.nombre || t('trackSelectStudent')}</Text>
              <Text style={styles.studentStatus}>{t('trackOnline')}</Text>
            </View>
          </View>
          <IconButton
            icon="refresh"
            size={20}
            style={styles.refreshBtn}
            iconColor={COLORS.TEXTO_SECUNDARIO}
            onPress={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 1000);
            }}
          />
        </Surface>

        {/* Selector de Estudiantes Horizontal */}
        <View style={styles.selectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
            {students.map(student => (
              <TouchableOpacity
                key={student.id}
                onPress={() => handleSelectStudent(student)}
                style={[
                  styles.selectorItem,
                  selectedStudent?.id === student.id && { borderColor: COLORS.PRIMARIO, borderWidth: 2 }
                ]}
              >
                <Avatar.Text
                  size={42}
                  label={getInitials(student.nombre)}
                  backgroundColor={COLORS.PRIMARIO}
                  color={COLORS.BLANCO}
                />
                <Text style={[styles.selectorLabel, selectedStudent?.id === student.id && { color: COLORS.PRIMARIO, fontWeight: 'bold' }]} numberOfLines={1}>
                  {student.nombre.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tarjeta del Mapa */}
        <Surface style={styles.mapCard} elevation={1}>
          {isLoading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={COLORS.PRIMARIO} />
            </View>
          ) : (
            <SafeMap
              currentLocation={location}
              initialRegion={INITIAL_REGION}
              style={styles.map}
            />
          )}
          <IconButton
            icon="crosshairs-gps"
            mode="contained"
            containerColor={COLORS.BLANCO}
            iconColor={COLORS.PRIMARIO}
            style={styles.mapFab}
            onPress={() => selectedStudent && updateStudentSim(selectedStudent)}
            disabled={!selectedStudent}
          />

          {/* Leyenda del Mapa */}
          <View style={styles.mapLegend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.PRIMARIO }]} />
              <Text style={styles.legendText}>{t('trackCurrentLocation')}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: COLORS.PRIMARIO }]} />
              <Text style={styles.legendText}>{t('trackJourney')}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: COLORS.TEXTO_SECUNDARIO, borderStyle: 'dashed' }]} />
              <Text style={styles.legendText}>{t('trackAssignedRoute')}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.ACENTO }]} />
              <Text style={styles.legendText}>{t('trackSafeZone')}</Text>
            </View>
          </View>
        </Surface>

        {/* Última Actualización */}
        <Surface style={styles.infoCard} elevation={1}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>{t('trackLastUpdate')}</Text>
              <Text style={styles.cardSubtitle}>{t('trackMinutesAgo')}</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{t('trackActive')}</Text>
            </View>
          </View>
        </Surface>

        {/* Estado Actual */}
        <Surface style={styles.infoCard} elevation={1}>
          <Text style={styles.cardTitle}>{t('trackCurrentStatus')}</Text>

          <View style={styles.statusRowWrapper}>
            <MaterialCommunityIcons name="target" size={16} color={COLORS.ALERTA} style={styles.statusIcon} />
            <Text style={styles.statusText}>{t('trackOnRoute')}</Text>
          </View>

          <View style={styles.statusRowWrapper}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color={COLORS.ADVERTENCIA} style={styles.statusIcon} />
            <Text style={styles.statusText}>{t('trackSpeed')} {selectedStudent ? (selectedStudent.nombre.length * 4) : 15} km/h</Text>
          </View>

          <View style={styles.statusRowWrapper}>
            <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.PRIMARIO} style={styles.statusIcon} />
            <Text style={styles.statusText}>
              {selectedStudent?.nombre === 'Maria Pérez' ? 'Calle 45 #23-10, Neiva' :
               selectedStudent?.nombre === 'Carlos Pérez' ? 'Carrera 7 #33-90, Bogotá' :
               selectedStudent ? `Av. Principal #10-${selectedStudent.nombre.length}, Soacha` : 'Calle 45 #23-10, Neiva'}
            </Text>
          </View>
        </Surface>

        {/* Alerta Reciente */}
        <Surface style={styles.infoCard} elevation={1}>
          <Text style={styles.cardTitle}>{t('trackRecentAlert')}</Text>
          <View style={styles.alertBox}>
            <Text style={styles.alertBoxTitle}>{t('live') === 'Live' ? 'Arrived at Safe Zone' : 'Llegó a Zona Segura'}</Text>
            <Text style={styles.alertBoxSub}>{t('trackMinutesAgo')}</Text>
          </View>
        </Surface>

        {/* Botones de Acción */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            style={styles.historyBtn}
            textColor={COLORS.PRIMARIO}
            onPress={() => router.push('/(tabs)/history')}
            contentStyle={styles.btnContent}
          >
            {t('live') === 'Live' ? 'View History' : 'Ver Historial'}
          </Button>
          <Button
            mode="contained"
            style={styles.routeBtn}
            buttonColor={COLORS.PRIMARIO}
            onPress={() => router.push('/(tabs)/zones')}
            contentStyle={styles.btnContent}
          >
            {t('live') === 'Live' ? 'Configure Route' : 'Configurar Ruta'}
          </Button>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.FONDO_PRINCIPAL },
  scrollContent: { padding: 16, paddingBottom: 40 },
  scrollContentWeb: { maxWidth: 1000, alignSelf: 'center', width: '100%', paddingTop: 20 },

  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.BLANCO, borderRadius: 8, padding: 12, marginBottom: 16 },
  headerProfile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTextCol: { justifyContent: 'center' },
  studentName: { fontSize: 16, fontWeight: 'bold', color: COLORS.NEGRO },
  studentStatus: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO },
  refreshBtn: { backgroundColor: COLORS.FONDO_PRINCIPAL, borderRadius: 8 },

  selectorContainer: { marginBottom: 16 },
  selectorScroll: { gap: 12 },
  selectorItem: { alignItems: 'center', gap: 6, padding: 4, borderRadius: 12, backgroundColor: COLORS.BLANCO, width: 75, elevation: 1 },
  selectorLabel: { fontSize: 11, color: COLORS.TEXTO_SECUNDARIO, textAlign: 'center' },

  mapCard: { height: 300, backgroundColor: COLORS.BLANCO, borderRadius: 8, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  map: { flex: 1 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  mapLegend: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLine: { width: 12, height: 2 },
  legendText: { fontSize: 10, color: COLORS.NEGRO },

  mapFab: { position: 'absolute', top: 10, right: 10, elevation: 4 },

  infoCard: { backgroundColor: COLORS.BLANCO, borderRadius: 8, padding: 16, marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.NEGRO, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO },

  activeBadge: { backgroundColor: COLORS.ACENTO_CLARO, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12 },
  activeBadgeText: { color: COLORS.ACENTO_OSCURO, fontSize: 12, fontWeight: 'bold' },

  statusRowWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.FONDO_INPUT, padding: 10, borderRadius: 8, marginBottom: 8 },
  statusIcon: { marginRight: 10 },
  statusText: { fontSize: 13, color: COLORS.NEGRO },

  alertBox: { backgroundColor: COLORS.ACENTO_CLARO, padding: 12, borderRadius: 8, marginTop: 8 },
  alertBoxTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.ACENTO_OSCURO },
  alertBoxSub: { fontSize: 11, color: COLORS.ACENTO_OSCURO, marginTop: 2 },

  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  historyBtn: { flex: 1, borderRadius: 8, borderColor: COLORS.PRIMARIO, borderWidth: 1, backgroundColor: COLORS.PRIMARIO_CLARO },
  routeBtn: { flex: 1, borderRadius: 8 },
  btnContent: { height: 48 },
});
