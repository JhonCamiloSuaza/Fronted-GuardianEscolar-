import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Avatar, Text, Surface, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../../constants/colors';
import SafeMap from '../../components/SafeMap';
import { getStudents, getInitials } from '../../utils/studentStorage';
import { trackingService } from '../../services/tracking.service';
import { routeService } from '../../services/route.service';
import { safeZoneService } from '../../services/safe-zone.service';
import { createTrackingSocket } from '../../services/socket';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { decodePolyline } from '../../utils/polyline';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

const INITIAL_REGION = {
  latitude: 4.5709,
  longitude: -74.2973,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

function normalizeCoordinate(coordinate) {
  if (!coordinate) return null;

  const latitude = Number(coordinate.latitude);
  const longitude = Number(coordinate.longitude);

  if (
    !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
    || latitude < -90
    || latitude > 90
    || longitude < -180
    || longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    recordedAt: coordinate.recordedAt || new Date().toISOString(),
    id: coordinate.id,
  };
}

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLocation, setStudentLocation] = useState(null);
  const [trail, setTrail] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [assignedRoute, setAssignedRoute] = useState({ path: [], points: [] });
  const [routeError, setRouteError] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [trackingError, setTrackingError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const { theme } = useTheme();
  const colors = theme.colors;
  const themed = {
    screen: { backgroundColor: colors.background },
    surface: { backgroundColor: colors.surface, borderColor: colors.border },
    surfaceSecondary: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
  };

  const refreshTracking = useCallback(async () => {
    setIsLoading(true);
    setTrackingError(null);
    setActiveTrip(null);
    setStudentLocation(null);
    setTrail([]);
    setSafeZones([]);
    setAssignedRoute({ path: [], points: [] });
    setRouteError(null);

    try {
      if (!selectedStudent?.id) {
        return;
      }

      const [trips, allSafeZones] = await Promise.all([
        trackingService.listTrips(),
        safeZoneService.list().catch((error) => {
          console.warn('No se pudieron cargar las zonas seguras:', error?.message || error);
          return [];
        }),
      ]);
      setSafeZones(allSafeZones.filter((zone) => (
        String(zone.studentId) === String(selectedStudent.id)
      )));
      const trip = trips
        .filter((item) => (
          String(item.studentId) === String(selectedStudent.id)
          && item.status === 'IN_PROGRESS'
        ))
        .sort((a, b) => new Date(b.tripStartedAt) - new Date(a.tripStartedAt))[0];

      if (!trip) return;

      const coordinates = await trackingService.listCoordinates(trip.id);
      const points = coordinates
        .map(normalizeCoordinate)
        .filter(Boolean)
        .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

      setActiveTrip(trip);
      setTrail(points);
      setStudentLocation(points[points.length - 1] || null);

      try {
        const routes = await routeService.list();
        const route = routes.find((item) => String(item.id) === String(trip.routeId));
        if (!route) {
          setRouteError('No hay una ruta asignada para este viaje.');
          return;
        }

        const routePoints = [
          {
            latitude: route.originLatitude,
            longitude: route.originLongitude,
            type: 'origin',
            title: 'Origen',
          },
          ...(route.stops || [])
            .slice()
            .sort((a, b) => a.stopOrder - b.stopOrder)
            .map((stop) => ({
              latitude: stop.latitude,
              longitude: stop.longitude,
              type: 'stop',
              title: stop.stopName,
              id: stop.id,
            })),
          {
            latitude: route.destinationLatitude,
            longitude: route.destinationLongitude,
            type: 'destination',
            title: 'Destino',
          },
        ]
          .map((point) => {
            const latitude = Number(point.latitude);
            const longitude = Number(point.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
            return { ...point, latitude, longitude };
          })
          .filter(Boolean);

        if (routePoints.length < 2) {
          setRouteError('La ruta asignada no tiene suficientes coordenadas.');
        } else {
          let geometry = null;
          try {
            geometry = await routeService.geometry(route.id);
          } catch (error) {
            console.warn('No se pudo cargar la geometría vial; se usará el fallback:', error?.message || error);
          }
          const decodedPath = decodePolyline(geometry?.encodedPolyline);
          setAssignedRoute({
            path: decodedPath.length > 1 ? decodedPath : routePoints,
            points: routePoints,
          });
        }
      } catch (error) {
        setRouteError(error?.message || 'No se pudo cargar la ruta asignada.');
      }
    } catch (error) {
      setTrackingError(error?.message || 'No se pudo cargar el seguimiento.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudent]);

  useFocusEffect(
    useCallback(() => {
      getStudents()
        .then(data => {
          setStudents(data);
          setSelectedStudent(current => {
            if (current) return current;
            if (params.id) {
              const found = data.find(s => s.id === params.id);
              if (found) return found;
            }
            if (data.length > 0) return data[0];
            return current;
          });
        })
        .catch((error) => {
          setStudents([]);
          setSelectedStudent(null);
          console.warn('No se pudieron cargar estudiantes para rastreo:', error?.message || error);
        });
    }, [params.id])
  );

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
  };

  useEffect(() => {
    refreshTracking();
  }, [refreshTracking]);

  useFocusEffect(
    useCallback(() => {
      if (!activeTrip?.id) return undefined;

      let isActive = true;
      let socket;

      createTrackingSocket({
        tripId: activeTrip.id,
        onCoordinate: (payload) => {
          if (!isActive) return;

          const coordinate = normalizeCoordinate(payload);
          if (!coordinate) return;

          setTrail((currentTrail) => {
            const isDuplicate = currentTrail.some((point) => (
              (coordinate.id && point.id === coordinate.id)
              || (
                point.latitude === coordinate.latitude
                && point.longitude === coordinate.longitude
                && point.recordedAt === coordinate.recordedAt
              )
            ));

            if (isDuplicate) return currentTrail;

            return [...currentTrail, coordinate]
              .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
          });
          setStudentLocation((currentLocation) => {
            if (!currentLocation) return coordinate;
            return new Date(coordinate.recordedAt) >= new Date(currentLocation.recordedAt)
              ? coordinate
              : currentLocation;
          });
        },
        onError: (error) => {
          if (isActive) {
            console.warn('Seguimiento en tiempo real no disponible:', error?.message || error);
          }
        },
      }).then((createdSocket) => {
        if (isActive) {
          socket = createdSocket;
        } else {
          createdSocket.deactivate();
        }
      }).catch((error) => {
        if (isActive) {
          console.warn('No se pudo conectar el seguimiento en tiempo real:', error?.message || error);
        }
      });

      return () => {
        isActive = false;
        socket?.deactivate();
      };
    }, [activeTrip?.id])
  );

  return (
    <View style={[styles.container, themed.screen]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, isWeb && styles.scrollContentWeb]}>
        
        {/* Cabecera del Estudiante */}
        <Surface style={[styles.headerCard, themed.surface]} elevation={1}>
          <View style={styles.headerProfile}>
            <Avatar.Text 
              size={40} 
              label={selectedStudent ? getInitials(selectedStudent.nombre) : '??'} 
              backgroundColor={colors.primary} 
              color={colors.textOnPrimary} 
            />
            <View style={styles.headerTextCol}>
              <Text style={[styles.studentName, themed.text]}>{selectedStudent?.nombre || t('trackSelectStudent')}</Text>
              <Text style={[styles.studentStatus, themed.textSecondary]}>{t('trackOnline')}</Text>
            </View>
          </View>
          <IconButton 
            icon="refresh" 
            size={20} 
            style={[styles.refreshBtn, themed.surfaceSecondary]} 
            iconColor={colors.textSecondary} 
            onPress={refreshTracking}
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
                  themed.surface,
                  selectedStudent?.id === student.id && { borderColor: colors.primary, borderWidth: 2 }
                ]}
              >
                <Avatar.Text 
                  size={42} 
                  label={getInitials(student.nombre)} 
                  backgroundColor={colors.primary} 
                  color={colors.textOnPrimary} 
                />
                <Text style={[styles.selectorLabel, themed.textSecondary, selectedStudent?.id === student.id && { color: colors.primary, fontWeight: 'bold' }]} numberOfLines={1}>
                  {student.nombre.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tarjeta del Mapa */}
        <Surface style={[styles.mapCard, themed.surface]} elevation={1}>
          {isLoading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <SafeMap 
              studentLocation={studentLocation}
              trail={trail}
              safeZones={safeZones}
              assignedRoute={assignedRoute}
              initialRegion={INITIAL_REGION} 
              style={styles.map}
            />
          )}
          <IconButton 
            icon="crosshairs-gps" 
            mode="contained" 
            containerColor={colors.surface}
            iconColor={colors.primary}
            style={styles.mapFab} 
            onPress={refreshTracking}
          />
          
          {/* Leyenda del Mapa */}
          <View style={[styles.mapLegend, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.PRIMARIO }]} />
              <Text style={[styles.legendText, themed.text]}>{t('trackCurrentLocation')}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: COLORS.PRIMARIO }]} />
              <Text style={[styles.legendText, themed.text]}>{t('trackJourney')}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: COLORS.TEXTO_SECUNDARIO, borderStyle: 'dashed' }]} />
              <Text style={[styles.legendText, themed.text]}>{t('trackAssignedRoute')}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.ACENTO }]} />
              <Text style={[styles.legendText, themed.text]}>{t('trackSafeZone')}</Text>
            </View>
          </View>
        </Surface>

        {/* Última Actualización */}
        <Surface style={[styles.infoCard, themed.surface]} elevation={1}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.cardTitle, themed.text]}>{t('trackLastUpdate')}</Text>
              <Text style={[styles.cardSubtitle, themed.textSecondary]}>
                {trackingError || (studentLocation
                  ? `Última coordenada: ${studentLocation.recordedAt || 'disponible'}`
                  : activeTrip
                    ? 'No hay coordenadas para este viaje'
                    : selectedStudent
                      ? 'No hay viaje activo para este estudiante'
                      : 'Selecciona un estudiante')}
              </Text>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.activeBadgeText, { color: studentLocation ? colors.success : colors.warning }]}>
                {studentLocation ? t('trackActive') : 'Sin datos'}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Estado Actual */}
        <Surface style={[styles.infoCard, themed.surface]} elevation={1}>
          <Text style={[styles.cardTitle, themed.text]}>{t('trackCurrentStatus')}</Text>
          
          <View style={[styles.statusRowWrapper, themed.surfaceSecondary]}>
            <MaterialCommunityIcons name="target" size={16} color={COLORS.ALERTA} style={styles.statusIcon} />
            <Text style={[styles.statusText, themed.text]}>
              {trackingError || routeError || (activeTrip
                ? 'Viaje activo'
                : selectedStudent
                  ? 'Sin viaje activo'
                  : t('trackSelectStudent'))}
            </Text>
          </View>
          
          <View style={[styles.statusRowWrapper, themed.surfaceSecondary]}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color={COLORS.ADVERTENCIA} style={styles.statusIcon} />
            <Text style={[styles.statusText, themed.text]}>{t('trackSpeed')} -- km/h</Text>
          </View>
          
          <View style={[styles.statusRowWrapper, themed.surfaceSecondary]}>
            <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.PRIMARIO} style={styles.statusIcon} />
            <Text style={[styles.statusText, themed.text]}>
              {studentLocation
                ? `${studentLocation.latitude.toFixed(6)}, ${studentLocation.longitude.toFixed(6)}`
                : 'No hay ubicación disponible para este estudiante'}
            </Text>
          </View>
        </Surface>

        {/* Alerta Reciente */}
        <Surface style={[styles.infoCard, themed.surface]} elevation={1}>
          <Text style={[styles.cardTitle, themed.text]}>{t('trackRecentAlert')}</Text>
          <View style={[styles.alertBox, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.alertBoxTitle, { color: colors.success }]}>Sin alertas recientes</Text>
            <Text style={[styles.alertBoxSub, { color: colors.success }]}>Cuando exista una notificación real aparecerá aquí.</Text>
          </View>
        </Surface>

        {/* Botones de Acción */}
        <View style={styles.actionButtons}>
          <Button 
            mode="outlined" 
            style={[styles.historyBtn, { borderColor: colors.primary, backgroundColor: colors.surfaceSecondary }]} 
            textColor={colors.primary}
            onPress={() => router.push('/(tabs)/history')}
            contentStyle={styles.btnContent}
          >
            {t('live') === 'Live' ? 'View History' : 'Ver Historial'}
          </Button>
          <Button 
            mode="contained" 
            style={styles.routeBtn} 
            buttonColor={colors.primary}
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
