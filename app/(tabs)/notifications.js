import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text as RNText,
  Dimensions,
  Alert,
  RefreshControl,
  Platform
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { COLORS } from '../../constants/colors';
import { useFocusEffect } from 'expo-router';
import { getStudents, getNotifications, deleteNotification, deleteHistory } from '../../utils/studentStorage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const isWeb = Dimensions.get('window').width > 768;

const NOTIFICATIONS = [
  { id: 1, type: 'Exitosas',     name: 'Maria Pérez',  message: 'Maria llegó a zona segura: Colegio San Jose', time: 'Hace 15 Minutos', color: COLORS.ACENTO },
  { id: 2, type: 'Informativas', name: 'Carlos Pérez', message: 'Carlos está en camino a casa',                time: 'Hace 15 Minutos', color: COLORS.PRIMARIO },
  { id: 3, type: 'Advertencias', name: 'Carlos Pérez', message: 'Carlos salió de la zona segura',             time: 'Hace 18 Minutos', color: COLORS.ALERTA },
  { id: 4, type: 'Exitosas',     name: 'Carlos Pérez', message: 'Carlos llegó a zona segura: Casa',           time: 'Hace 18 Minutos', color: COLORS.ACENTO },
  { id: 5, type: 'Informativas', name: 'Maria Pérez',  message: 'Trayecto completado sin incidentes',         time: 'Hace 30 Minutos', color: COLORS.PRIMARIO },
];

const CHIP_COLORS = {
  Todas:        { active: COLORS.PRIMARIO,  inactive: COLORS.GRIS_BORDE },
  Exitosas:     { active: COLORS.ACENTO,    inactive: COLORS.GRIS_BORDE },
  Advertencias: { active: COLORS.ALERTA,    inactive: COLORS.GRIS_BORDE },
  Informativas: { active: COLORS.PRIMARIO,  inactive: COLORS.GRIS_BORDE },
};

export default function NotificationsScreen() {
  const [filter, setFilter] = useState('all');
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);
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

  const FILTERS_KEYS = [
    { key: 'all',  label: () => t('notifAll'),      type: null },
    { key: 'Exitosas',    label: () => t('notifSuccess'),   type: 'Exitosas' },
    { key: 'Advertencias', label: () => t('notifWarnings'), type: 'Advertencias' },
    { key: 'Informativas', label: () => t('notifInfo'),     type: 'Informativas' },
  ];

  const CHIP_COLORS = {
    all:          { active: colors.primary, inactive: colors.surfaceSecondary },
    Exitosas:     { active: colors.success, inactive: colors.surfaceSecondary },
    Advertencias: { active: colors.error,   inactive: colors.surfaceSecondary },
    Informativas: { active: colors.primary, inactive: colors.surfaceSecondary },
  };

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [])
  );

  async function loadStudents() {
    setRefreshing(true);
    setTimeout(async () => {
      const [studentData, storedNotifs] = await Promise.all([getStudents(), getNotifications()]);
      setStudents(studentData);
      
      // Combinar notificaciones estáticas + almacenadas + dinámicas de registro
      let combined = [...storedNotifs, ...NOTIFICATIONS];
      
      studentData.forEach((student) => {
        if (!combined.find(n => n.id === `new-${student.id}`)) {
          combined.push({
            id: `new-${student.id}`,
            type: 'Exitosas',
            name: student.nombre,
            message: `${student.nombre} ha sido registrado correctamente y está bajo protección.`,
            time: 'Reciente',
            color: COLORS.ACENTO
          });
        }
      });

      setNotifications(combined);
      setRefreshing(false);
    }, 1000);
  }

  function confirmDeleteNotif(item) {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('delete') + '?');
      if (confirmed) {
        (async () => {
          if (item.id.toString().startsWith('new-') || NOTIFICATIONS.find(n => n.id === item.id)) {
            setNotifications(prev => prev.filter(n => n.id !== item.id));
          } else {
            await deleteNotification(item.id);
            await deleteHistory(item.id); // Sincronizar borrado con historial
            await loadStudents();
          }
        })();
      }
      return;
    }

    Alert.alert(
      t('delete'),
      t('delete') + '?',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            if (item.id.toString().startsWith('new-') || NOTIFICATIONS.find(n => n.id === item.id)) {
              setNotifications(prev => prev.filter(n => n.id !== item.id));
            } else {
              await deleteNotification(item.id);
              await deleteHistory(item.id); // Sincronizar borrado con historial
              await loadStudents();
            }
          }
        }
      ]
    );
  }

  const filterCounts = {
    all: notifications.length,
    Exitosas:     notifications.filter(n => n.type === 'Exitosas').length,
    Advertencias: notifications.filter(n => n.type === 'Advertencias').length,
    Informativas: notifications.filter(n => n.type === 'Informativas').length,
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  return (
    <View style={[styles.container, themed.screen]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isWeb && styles.scrollContentWeb]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadStudents} colors={[COLORS.PRIMARIO]} tintColor={COLORS.PRIMARIO} />
        }
      >
        {/* Título */}
        <View style={styles.titleRow}>
          <View>
            <RNText style={[styles.pageTitle, themed.text]}>{t('notifTitle')}</RNText>
            <RNText style={[styles.pageSubtitle, themed.textSecondary]}>{notifications.length} {t('notifSubtitle')}</RNText>
          </View>
          <TouchableOpacity 
            style={[styles.markAllBtn, themed.surfaceSecondary]}
            onPress={() => Alert.alert(t('notifTitle'), t('notifMarked'))}
          >
            <RNText style={[styles.markAllText, themed.textSecondary]}>{t('notifMarkAll')}</RNText>
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <View style={[styles.filterCard, themed.surface]}>
          <RNText style={[styles.filterLabel, themed.textSecondary]}>{t('notifFilter')}</RNText>
          <View style={styles.chipsRow}>
            {FILTERS_KEYS.map((f) => {
              const isActive = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[
                    styles.chip,
                    { backgroundColor: isActive ? CHIP_COLORS[f.key].active : CHIP_COLORS[f.key].inactive, borderColor: isActive ? CHIP_COLORS[f.key].active : colors.border }
                  ]}
                  activeOpacity={0.8}
                >
                  <RNText style={[styles.chipText, themed.text, isActive && styles.chipTextActive]}>
                    {f.label()} ({filterCounts[f.key]})
                  </RNText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notificaciones */}
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.notifCard, themed.surface]}
              onPress={() => Alert.alert(t('notifDetail'), item.message)}
            >
              <View style={styles.notifRow}>
                <View style={[styles.colorCircle, { backgroundColor: item.color }]} />
                <View style={styles.notifInfo}>
                  <RNText style={[styles.notifName, themed.text]}>{item.name}</RNText>
                  <RNText style={[styles.notifMessage, themed.text]}>
                    {t('live') === 'Live' 
                      ? item.message
                          .replace('llegó a zona segura', 'arrived at safe zone')
                          .replace('está en camino a casa', 'is on his way home')
                          .replace('está en camino', 'is on the way')
                          .replace('salió de la zona segura', 'left the safe zone')
                          .replace('Trayecto completado sin incidentes', 'Journey completed without incidents')
                          .replace('ha sido registrado correctamente y está bajo protección.', 'has been successfully registered and is under protection.')
                          .replace('Colegio San Jose', 'School San Jose')
                          .replace('(Alerta)', '(Alert)')
                          .replace('(Trayecto)', '(Journey)')
                          .replace('(Seguro)', '(Safe)')
                      : item.message}
                  </RNText>
                  <RNText style={[styles.notifTime, themed.textSecondary]}>
                    {t('live') === 'Live' 
                      ? item.time.replace('Hace ', '').replace(' Minutos', ' min ago').replace('Reciente', 'Just now').replace('Ahora', 'Just now')
                      : item.time}
                  </RNText>
                </View>
                <TouchableOpacity 
                  style={{ padding: 8, justifyContent: 'center' }} 
                  onPress={() => confirmDeleteNotif(item)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <RNText style={[styles.emptyText, themed.textSecondary]}>{t('notifEmpty')}</RNText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.FONDO_PRINCIPAL,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  scrollContentWeb: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: isWeb ? 20 : 16,
    fontWeight: 'bold',
    color: COLORS.TEXTO_GENERAL,
  },
  pageSubtitle: {
    fontSize: 12,
    color: COLORS.TEXTO_SECUNDARIO,
    marginTop: 2,
  },
  markAllBtn: {
    borderWidth: 1,
    borderColor: COLORS.GRIS_BORDE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 11,
    color: COLORS.TEXTO_SECUNDARIO,
  },
  filterCard: {
    backgroundColor: COLORS.FONDO_TARJETA,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.GRIS_BORDE,
  },
  filterLabel: {
    fontSize: 12,
    color: COLORS.TEXTO_SECUNDARIO,
    marginBottom: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chip: {
    width: '48%',
    borderRadius: 20,
    paddingVertical: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 11,
    color: COLORS.TEXTO_GENERAL,
    fontWeight: '500',
    textAlign: 'center',
  },
  chipTextActive: {
    color: COLORS.BLANCO,
    fontWeight: 'bold',
  },
  notifCard: {
    backgroundColor: COLORS.FONDO_TARJETA,
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.GRIS_BORDE,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 14,
  },
  notifInfo: {
    flex: 1,
  },
  notifName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXTO_GENERAL,
    marginBottom: 2,
  },
  notifMessage: {
    fontSize: 13,
    color: COLORS.TEXTO_GENERAL,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    color: COLORS.TEXTO_SECUNDARIO,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXTO_SECUNDARIO,
  },
});
