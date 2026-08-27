import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Modal, TouchableOpacity, ScrollView, Dimensions, Alert, Platform, RefreshControl } from 'react-native';
import { Text, Surface, Card, IconButton, Button, Avatar, Searchbar, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeMap from '../../components/SafeMap';
import { useFocusEffect } from 'expo-router';
import { getStudents, getHistory, deleteHistory, deleteNotification } from '../../utils/studentStorage';
import { useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

const MOCK_HISTORY = [
  {
    id: 'h1',
    estudiante: 'Carlos Pérez',
    fecha: '2 Abril 2025',
    horaInicio: '7:15 AM',
    horaFin: '7:45 AM',
    duracion: '30 min',
    distancia: '4.2 km',
    estado: 'Completado',
    alerta: false,
    ruta: 'Casa - Colegio',
    studentColor: COLORS.PRIMARIO,
  },
  {
    id: 'h2',
    estudiante: 'Carlos Pérez',
    fecha: '1 Abril 2025',
    horaInicio: '2:30 PM',
    horaFin: '3:10 PM',
    duracion: '40 min',
    distancia: '4.5 km',
    estado: 'Completado',
    alerta: false,
    ruta: 'Colegio - Casa',
    studentColor: COLORS.PRIMARIO,
  },
  {
    id: 'h3',
    estudiante: 'María Pérez',
    fecha: '2 Abril 2025',
    horaInicio: '7:20 AM',
    horaFin: '7:50 AM',
    duracion: '30 min',
    distancia: '4.1 km',
    estado: 'En Proceso',
    alerta: false,
    ruta: 'Casa - Colegio',
    studentColor: COLORS.ACENTO,
  },
  {
    id: 'h4',
    estudiante: 'Carlos Pérez',
    fecha: '31 Marzo 2025',
    horaInicio: '7:15 AM',
    horaFin: '7:55 AM',
    duracion: '40 min',
    distancia: '4.2 km',
    estado: 'Con Incidente',
    alerta: true,
    ruta: 'Casa - Colegio',
    studentColor: COLORS.PRIMARIO,
  }
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [students, setStudents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const { t } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setRefreshing(true);
    setTimeout(async () => {
      const [studentData, storedHistory] = await Promise.all([getStudents(), getHistory()]);
      setStudents(studentData);

      // Combinar historial estático + almacenado
      let combined = [...storedHistory, ...MOCK_HISTORY];

      // Generar historial ficticio para los estudiantes reales que no tienen registros
      studentData.forEach(student => {
        if (!combined.find(h => h.estudiante === student.nombre)) {
          combined.push({
            id: `gen-${student.id}`,
            estudiante: student.nombre,
            fecha: 'Hoy',
            horaInicio: '7:30 AM',
            horaFin: '8:00 AM',
            duracion: '30 min',
            distancia: '3.8 km',
            estado: 'Completado',
            alerta: false,
            ruta: 'Casa - Colegio',
            studentColor: COLORS.ACENTO,
          });
        }
      });
      setHistory(combined);
      setRefreshing(false);
    }, 1000);
  }

  function confirmDeleteHistory(item) {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('histDeleteConfirm'));
      if (confirmed) {
        (async () => {
          if (item.id.startsWith('gen-') || MOCK_HISTORY.find(m => m.id === item.id)) {
             setHistory(prev => prev.filter(h => h.id !== item.id));
          } else {
             await deleteHistory(item.id);
             await deleteNotification(item.id); // Sincronizar borrado con notificaciones
             await loadData();
          }
        })();
      }
      return;
    }

    Alert.alert(
      t('histDelete'),
      t('histDeleteConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            if (item.id.startsWith('gen-') || MOCK_HISTORY.find(m => m.id === item.id)) {
               setHistory(prev => prev.filter(h => h.id !== item.id));
            } else {
               await deleteHistory(item.id);
               await deleteNotification(item.id); // Sincronizar borrado con notificaciones
               await loadData();
            }
          }
        }
      ]
    );
  }

  // Calcular estadísticas reales
  const stats = {
    total: history.length,
    completados: history.filter(h => h.estado === 'Completado').length,
    incidentes: history.filter(h => h.estado === 'Con Incidente').length,
    enProceso: history.filter(h => h.estado === 'En Proceso').length,
    horas: history.reduce((acc, h) => acc + (parseInt(h.duracion) || 0), 0) / 60
  };

  const filteredHistory = history.filter(item => {
    const matchesStudent = filterStudent === '' || item.estudiante.toLowerCase().includes(filterStudent.toLowerCase());
    const matchesDate = filterDate === '' || item.fecha.toLowerCase().includes(filterDate.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.estado === statusFilter;
    return matchesStudent && matchesDate && matchesStatus;
  });

  const StatCard = ({ title, value, icon, color, type }) => {
    const isActive = statusFilter === type;
    return (
      <TouchableOpacity
        onPress={() => setStatusFilter(type)}
        activeOpacity={0.7}
        style={[
          styles.statCard,
          { borderLeftColor: color, borderLeftWidth: 4 },
          isActive && { backgroundColor: color + '25', borderColor: color, borderWidth: 2 }
        ]}
      >
        <Surface style={[styles.statIconWrap, { backgroundColor: color }]} elevation={2}>
          <MaterialCommunityIcons name={icon} size={18} color={COLORS.BLANCO} />
          <Text style={styles.statValue}>{value}</Text>
        </Surface>
        <Text style={styles.statTitle}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = ({ item }) => {
    const isAlerta = item.alerta || item.estado === 'Con Incidente';
    const isProceso = item.estado === 'En Proceso';
    const statusColor = isAlerta ? COLORS.ALERTA : isProceso ? COLORS.PRIMARIO : COLORS.ACENTO;

    return (
      <Surface style={[styles.historyCard, { borderLeftColor: statusColor, borderLeftWidth: 4 }]} elevation={1}>
        <View style={styles.cardHeader}>
          <Avatar.Text
            size={44}
            label={item.estudiante.substring(0, 2).toUpperCase()}
            style={{ backgroundColor: statusColor }}
            color={COLORS.BLANCO}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.itemName}>{item.estudiante}</Text>
            <Text style={styles.itemDate}>
              {t('live') === 'Live'
                ? (item.fecha || '')
                    .replace(/\s+de\s+/gi, ' ')
                    .replace(/enero/gi, 'January').replace(/febrero/gi, 'February').replace(/marzo/gi, 'March')
                    .replace(/abril/gi, 'April').replace(/mayo/gi, 'May').replace(/junio/gi, 'June')
                    .replace(/julio/gi, 'July').replace(/agosto/gi, 'August').replace(/septiembre/gi, 'September')
                    .replace(/octubre/gi, 'October').replace(/noviembre/gi, 'November').replace(/diciembre/gi, 'December')
                    .replace(/hoy/gi, t('today'))
                : item.fecha}
            </Text>
          </View>
          <IconButton
            icon="trash-can-outline"
            size={18}
            containerColor={COLORS.FONDO_PRINCIPAL}
            iconColor={COLORS.ALERTA}
            onPress={() => confirmDeleteHistory(item)}
          />
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{item.horaFin && item.horaFin !== '--' ? t('histStart') + ' / ' + t('histEnd') : t('histRegTime')}</Text>
            <Text style={styles.detailValue}>
              {t('live') === 'Live' && item.horaInicio
                ? item.horaInicio.replace(/[ap]\.?\s?m\.?/gi, (m) => m.toLowerCase().includes('a') ? 'AM' : 'PM')
                : item.horaInicio}
              {item.horaFin && item.horaFin !== '--'
                ? ` - ${t('live') === 'Live' ? item.horaFin.replace(/[ap]\.?\s?m\.?/gi, (m) => m.toLowerCase().includes('a') ? 'AM' : 'PM') : item.horaFin}`
                : ''}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('histStatus')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {item.estado === 'Completado' ? t('histCompleted') :
                 item.estado === 'En Proceso' ? t('histInProcess') :
                 item.estado === 'Con Incidente' ? t('histIncident') : item.estado}
              </Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('histObservation')}</Text>
            <Text style={[styles.detailValue, item.alerta && { color: COLORS.ALERTA }]}>
              {item.alerta ? t('histObsAlert') : t('histObsNormal')}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('histRoute')}</Text>
            <Text style={styles.detailValue}>
              {item.ruta === 'Actualización Manual' ? t('histManualUpdate') :
               item.ruta === 'Casa - Colegio' ? t('histHomeSchool') :
               item.ruta === 'Colegio - Casa' ? t('histSchoolHome') : item.ruta}
            </Text>
          </View>
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isWeb && styles.scrollContentWeb, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[COLORS.PRIMARIO]} tintColor={COLORS.PRIMARIO} />
        }
      >

        {/* Header Section */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t('histTitle')}</Text>
            <Text style={styles.subtitle}>{t('histSubtitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => Alert.alert(t('histReport'), t('loading'))}
          >
            <MaterialCommunityIcons name="file-document-outline" size={18} color={COLORS.BLANCO} />
            <Text style={styles.reportBtnText}>{t('histReport')}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Bar */}
        <Surface style={styles.filterBar} elevation={1}>
          <View style={styles.filterGrid}>
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>{t('tabStudent')}</Text>
              <TextInput
                mode="outlined"
                value={filterStudent}
                onChangeText={setFilterStudent}
                placeholder={t('histChildPlaceholder')}
                style={styles.filterInput}
                textColor={COLORS.TEXTO_GENERAL}
                outlineColor={COLORS.GRIS_BORDE}
                activeOutlineColor={COLORS.PRIMARIO}
                dense
              />
            </View>
            <View style={styles.filterCol}>
              <Text style={styles.filterLabel}>{t('histStart')}</Text>
              <TextInput
                mode="outlined"
                value={filterDate}
                onChangeText={setFilterDate}
                placeholder={t('live') === 'Live' ? "MM/DD/YYYY" : "DD/MM/AAAA"}
                style={styles.filterInput}
                textColor={COLORS.TEXTO_GENERAL}
                outlineColor={COLORS.GRIS_BORDE}
                activeOutlineColor={COLORS.PRIMARIO}
                dense
              />
            </View>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {setFilterStudent(''); setFilterDate(''); setStatusFilter('all');}}
            >
              <Text style={styles.clearBtnText}>{t('histClearFilter')}</Text>
            </TouchableOpacity>
          </View>
        </Surface>

        {/* Stats Section */}
        <View style={styles.statsGrid}>
          <StatCard title={t('histTotal')} value={stats.total} icon="format-list-bulleted" color={COLORS.NEGRO} type="all" />
          <StatCard title={t('histFilterCompleted')} value={stats.completados} icon="check-circle" color={COLORS.ACENTO} type="Completado" />
          <StatCard title={t('histInProcess')} value={stats.enProceso} icon="bus-clock" color={COLORS.PRIMARIO} type="En Proceso" />
          <StatCard title={t('histFilterIncident')} value={stats.incidentes} icon="alert-circle" color={COLORS.ALERTA} type="Con Incidente" />
        </View>

        {/* History List */}
        <View style={styles.listContainer}>
          {filteredHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="magnify-close" size={48} color={COLORS.GRIS_BORDE} />
              <Text style={styles.emptyText}>{t('histNoResults')}</Text>
            </View>
          ) : (
            filteredHistory.map(item => (
              <React.Fragment key={item.id}>
                {renderHistoryItem({ item })}
              </React.Fragment>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.FONDO_PRINCIPAL },
  scrollContent: { padding: 16 },
  scrollContentWeb: { maxWidth: 1000, alignSelf: 'center', width: '100%', paddingTop: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.NEGRO },
  subtitle: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO },
  reportBtn: { backgroundColor: COLORS.PRIMARIO, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  reportBtnText: { color: COLORS.BLANCO, fontWeight: 'bold', fontSize: 13 },

  filterBar: { backgroundColor: COLORS.BLANCO, borderRadius: 12, padding: 16, marginBottom: 20 },
  filterGrid: { flexDirection: isWeb ? 'row' : 'column', alignItems: isWeb ? 'flex-end' : 'stretch', gap: 12 },
  filterCol: { flex: 1 },
  filterLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.NEGRO, marginBottom: 4 },
  filterInput: { backgroundColor: COLORS.BLANCO, height: 45 },
  clearBtn: { backgroundColor: COLORS.BLANCO, borderWidth: 1, borderColor: COLORS.GRIS_BORDE, paddingHorizontal: 20, height: 40, justifyContent: 'center', borderRadius: 8, alignItems: 'center' },
  clearBtnText: { color: COLORS.TEXTO_SECUNDARIO, fontSize: 13, fontWeight: '500' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
  statCard: { flex: 1, minWidth: isWeb ? 130 : '45%', backgroundColor: COLORS.BLANCO, borderRadius: 10, padding: 12 },
  statIconWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, padding: 6, borderRadius: 6, alignSelf: 'flex-start' },
  statValue: { color: COLORS.BLANCO, fontWeight: 'bold', fontSize: 16 },
  statTitle: { fontSize: 11, color: COLORS.TEXTO_SECUNDARIO, fontWeight: '500' },

  listContainer: { gap: 12 },
  historyCard: { backgroundColor: COLORS.BLANCO, borderRadius: 12, padding: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerInfo: { marginLeft: 12, flex: 1 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: COLORS.NEGRO },
  itemDate: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8 },
  detailItem: { minWidth: isWeb ? 'auto' : '45%', flex: isWeb ? 1 : undefined },
  detailLabel: { fontSize: 10, color: COLORS.TEXTO_SECUNDARIO, fontWeight: 'bold', textTransform: 'uppercase' },
  detailValue: { fontSize: 13, color: COLORS.NEGRO, fontWeight: '500', marginTop: 2 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginTop: 2, alignSelf: 'flex-start' },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: COLORS.TEXTO_SECUNDARIO, fontSize: 14, fontWeight: '500' },
});
