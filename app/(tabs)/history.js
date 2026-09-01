import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Avatar, IconButton, Surface, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalendarDatePicker from '../../components/common/CalendarDatePicker';
import JsonView from '../../components/common/JsonView';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { deleteHistory, deleteNotification, getHistory, getStudents } from '../../utils/studentStorage';

const MOCK_HISTORY = [
  { id: 'h1', estudiante: 'Carlos Perez', fecha: '2025-04-02', horaInicio: '7:15 AM', horaFin: '7:45 AM', duracion: '30 min', distancia: '4.2 km', estado: 'Completado', alerta: false, ruta: 'Casa - Colegio' },
  { id: 'h2', estudiante: 'Carlos Perez', fecha: '2025-04-01', horaInicio: '2:30 PM', horaFin: '3:10 PM', duracion: '40 min', distancia: '4.5 km', estado: 'Completado', alerta: false, ruta: 'Colegio - Casa' },
  { id: 'h3', estudiante: 'Maria Perez', fecha: '2025-04-02', horaInicio: '7:20 AM', horaFin: '7:50 AM', duracion: '30 min', distancia: '4.1 km', estado: 'En Proceso', alerta: false, ruta: 'Casa - Colegio' },
  { id: 'h4', estudiante: 'Carlos Perez', fecha: '2025-03-31', horaInicio: '7:15 AM', horaFin: '7:55 AM', duracion: '40 min', distancia: '4.2 km', estado: 'Con Incidente', alerta: true, ruta: 'Casa - Colegio' },
];

export default function HistoryScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 769;
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const colors = theme.colors;
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showReportJson, setShowReportJson] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    setRefreshing(true);
    setTimeout(async () => {
      const [studentData, storedHistory] = await Promise.all([getStudents(), getHistory()]);
      const combined = [...storedHistory, ...MOCK_HISTORY];
      studentData.forEach((student) => {
        if (!combined.find(item => item.estudiante === student.nombre)) {
          combined.push({
            id: `gen-${student.id}`,
            estudiante: student.nombre,
            fecha: new Date().toISOString().slice(0, 10),
            horaInicio: '7:30 AM',
            horaFin: '8:00 AM',
            duracion: '30 min',
            distancia: '3.8 km',
            estado: 'Completado',
            alerta: false,
            ruta: 'Casa - Colegio',
          });
        }
      });
      setHistory(combined);
      setRefreshing(false);
    }, 500);
  }

  function confirmDeleteHistory(item) {
    const removeItem = async () => {
      if (item.id.startsWith('gen-') || MOCK_HISTORY.find(mock => mock.id === item.id)) {
        setHistory(prev => prev.filter(entry => entry.id !== item.id));
      } else {
        await deleteHistory(item.id);
        await deleteNotification(item.id);
        await loadData();
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('histDeleteConfirm'))) removeItem();
      return;
    }

    Alert.alert(t('histDelete'), t('histDeleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: removeItem },
    ]);
  }

  const stats = {
    total: history.length,
    completados: history.filter(item => item.estado === 'Completado').length,
    incidentes: history.filter(item => item.estado === 'Con Incidente').length,
    enProceso: history.filter(item => item.estado === 'En Proceso').length,
    horas: history.reduce((acc, item) => acc + (parseInt(item.duracion, 10) || 0), 0) / 60,
  };

  const filteredHistory = history.filter((item) => {
    const matchesStudent = !filterStudent || item.estudiante.toLowerCase().includes(filterStudent.toLowerCase());
    const matchesDate = !filterDate || String(item.fecha).toLowerCase().includes(filterDate.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.estado === statusFilter;
    return matchesStudent && matchesDate && matchesStatus;
  });

  const getStatusColor = (item) => {
    if (item.alerta || item.estado === 'Con Incidente') return colors.error;
    if (item.estado === 'En Proceso') return colors.primary;
    return colors.accent;
  };

  const StatCard = ({ title, value, icon, color, type }) => {
    const isActive = statusFilter === type;
    return (
      <TouchableOpacity
        onPress={() => setStatusFilter(type)}
        activeOpacity={0.75}
        style={[
          styles.statCard,
          { backgroundColor: colors.surface, borderColor: isActive ? color : colors.border, borderLeftColor: color },
          isActive && { backgroundColor: color + '20' },
        ]}
      >
        <View style={[styles.statIconWrap, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={18} color={colors.textOnPrimary} />
          <Text style={[styles.statValue, { color: colors.textOnPrimary }]}>{value}</Text>
        </View>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = (item) => {
    const statusColor = getStatusColor(item);
    return (
      <Surface key={item.id} style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: statusColor }]} elevation={1}>
        <View style={styles.cardHeader}>
          <Avatar.Text size={44} label={item.estudiante.substring(0, 2).toUpperCase()} style={{ backgroundColor: statusColor }} color={colors.textOnPrimary} />
          <View style={styles.headerInfo}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.estudiante}</Text>
            <Text style={[styles.itemDate, { color: colors.textSecondary }]}>{item.fecha}</Text>
          </View>
          <IconButton icon="trash-can-outline" size={18} containerColor={colors.surfaceSecondary} iconColor={colors.error} onPress={() => confirmDeleteHistory(item)} />
        </View>

        <View style={[styles.detailsGrid, { backgroundColor: colors.surfaceSecondary }]}>
          <Detail label={item.horaFin && item.horaFin !== '--' ? `${t('histStart')} / ${t('histEnd')}` : t('histRegTime')} value={`${item.horaInicio}${item.horaFin && item.horaFin !== '--' ? ` - ${item.horaFin}` : ''}`} />
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('histStatus')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{item.estado}</Text>
            </View>
          </View>
          <Detail label={t('histObservation')} value={item.alerta ? t('histObsAlert') : t('histObsNormal')} danger={item.alerta} />
          <Detail label={t('histRoute')} value={item.ruta} />
        </View>
      </Surface>
    );
  };

  const Detail = ({ label, value, danger }) => (
    <View style={styles.detailItem}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: danger ? colors.error : colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWeb, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <View style={[styles.headerRow, !isWide && styles.headerRowMobile]}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>{t('histTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('histSubtitle')}</Text>
          </View>
          <TouchableOpacity style={[styles.reportBtn, { backgroundColor: colors.primary }]} onPress={() => setShowReportJson(true)}>
            <MaterialCommunityIcons name="code-json" size={18} color={colors.textOnPrimary} />
            <Text style={[styles.reportBtnText, { color: colors.textOnPrimary }]}>{t('histReport')}</Text>
          </TouchableOpacity>
        </View>

        <Surface style={[styles.filterBar, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={1}>
          <View style={[styles.filterGrid, { flexDirection: isWide ? 'row' : 'column', alignItems: isWide ? 'flex-end' : 'stretch' }]}>
            <View style={styles.filterCol}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>{t('tabStudent')}</Text>
              <TextInput
                mode="outlined"
                value={filterStudent}
                onChangeText={setFilterStudent}
                placeholder={t('histChildPlaceholder')}
                style={[styles.filterInput, { backgroundColor: colors.surfaceSecondary }]}
                textColor={colors.text}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                dense
              />
            </View>
            <View style={styles.filterCol}>
              <CalendarDatePicker value={filterDate} onChange={setFilterDate} label={t('histStart')} />
            </View>
            <TouchableOpacity style={[styles.clearBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => { setFilterStudent(''); setFilterDate(''); setStatusFilter('all'); }}>
              <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>{t('histClearFilter')}</Text>
            </TouchableOpacity>
          </View>
        </Surface>

        <View style={styles.statsGrid}>
          <StatCard title={t('histTotal')} value={stats.total} icon="format-list-bulleted" color={colors.textSecondary} type="all" />
          <StatCard title={t('histFilterCompleted')} value={stats.completados} icon="check-circle" color={colors.accent} type="Completado" />
          <StatCard title={t('histInProcess')} value={stats.enProceso} icon="bus-clock" color={colors.primary} type="En Proceso" />
          <StatCard title={t('histFilterIncident')} value={stats.incidentes} icon="alert-circle" color={colors.error} type="Con Incidente" />
        </View>

        <View style={styles.listContainer}>
          {filteredHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="magnify-close" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('histNoResults')}</Text>
            </View>
          ) : filteredHistory.map(renderHistoryItem)}
        </View>
      </ScrollView>

      <Modal visible={showReportJson} transparent animationType="fade" onRequestClose={() => setShowReportJson(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Surface style={[styles.reportModal, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={5}>
            <View style={styles.reportHeader}>
              <Text style={[styles.reportTitle, { color: colors.text }]}>{t('histReport')}</Text>
              <IconButton icon="close" iconColor={colors.textSecondary} onPress={() => setShowReportJson(false)} />
            </View>
            <JsonView data={{ filters: { student: filterStudent, date: filterDate, status: statusFilter }, stats, results: filteredHistory }} maxHeight={460} />
          </Surface>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  scrollContentWeb: { maxWidth: 1100, alignSelf: 'center', width: '100%', paddingTop: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10, gap: 12 },
  headerRowMobile: { alignItems: 'stretch' },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 12 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, gap: 6 },
  reportBtnText: { fontWeight: 'bold', fontSize: 13 },
  filterBar: { borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1 },
  filterGrid: { gap: 12 },
  filterCol: { flex: 1 },
  filterLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  filterInput: { height: 45 },
  clearBtn: { borderWidth: 1, paddingHorizontal: 20, height: 45, justifyContent: 'center', borderRadius: 8, alignItems: 'center' },
  clearBtnText: { fontSize: 13, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
  statCard: { flex: 1, minWidth: 150, borderRadius: 10, padding: 12, borderWidth: 1, borderLeftWidth: 4 },
  statIconWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, padding: 6, borderRadius: 6, alignSelf: 'flex-start' },
  statValue: { fontWeight: 'bold', fontSize: 16 },
  statTitle: { fontSize: 11, fontWeight: '500' },
  listContainer: { gap: 12 },
  historyCard: { borderRadius: 12, padding: 12, borderWidth: 1, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerInfo: { marginLeft: 12, flex: 1 },
  itemName: { fontSize: 15, fontWeight: 'bold' },
  itemDate: { fontSize: 12 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 10, borderRadius: 8 },
  detailItem: { minWidth: 150, flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  detailValue: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, marginTop: 2, alignSelf: 'flex-start' },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  reportModal: { width: '100%', maxWidth: 760, borderRadius: 12, padding: 16, borderWidth: 1 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reportTitle: { fontSize: 18, fontWeight: '700' },
});
