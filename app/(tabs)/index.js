import React, { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Avatar, Button, Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getStudents, getInitials } from '../../utils/studentStorage';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const { t } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      getStudents().then(setStudents);
    }, [])
  );

  const StatCard = ({ title, value, subvalue, icon, iconColor, borderColor, onPress }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: borderColor }, isWeb && styles.statCardWeb]}
    >
      <Surface style={styles.surfaceInsideStat} elevation={1}>
        <View style={styles.statIconWrap}>
          <Avatar.Icon size={40} icon={icon} backgroundColor={iconColor} color={COLORS.BLANCO} />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statSubvalue}>{subvalue}</Text>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, isWeb && styles.scrollContentWeb]}>
        {/* Fila de Estadísticas */}
        <View style={styles.statsRow}>
          <StatCard
            title={t('dashStudents')}
            value={String(students.length)}
            subvalue={t('dashActive')}
            icon="account-group"
            iconColor={COLORS.ACENTO}
            borderColor={COLORS.ACENTO}
            onPress={() => router.push('/(tabs)/student')}
          />
          <StatCard
            title={t('dashMap')}
            value={t('dashLive')}
            subvalue={t('dashTracking')}
            icon="map-marker-radius"
            iconColor={COLORS.ACENTO}
            borderColor={COLORS.ACENTO}
            onPress={() => router.push('/(tabs)/tracking')}
          />
          <StatCard
            title={t('dashAlerts')}
            value="3"
            subvalue={t('dashNew')}
            icon="bell-alert"
            iconColor={COLORS.ACENTO}
            borderColor={COLORS.ACENTO}
            onPress={() => router.push('/(tabs)/notifications')}
          />
          <StatCard
            title={t('dashHistory')}
            value={t('dashLive').split(' ')[0]}
            subvalue={t('dashJourney')}
            icon="history"
            iconColor={COLORS.ACENTO}
            borderColor={COLORS.ACENTO}
            onPress={() => router.push('/(tabs)/history')}
          />
        </View>

        {/* Sección de Estudiantes */}
        <Surface style={styles.sectionCard} elevation={1}>
          {/* Header de sección */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashMyStudents')}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/student')}>
              <Text style={styles.addBtnText}>{t('dashAdd')}</Text>
            </TouchableOpacity>
          </View>

          {students.length === 0 ? (
            <TouchableOpacity onPress={() => router.push('/(tabs)/student')}>
              <Text style={{ color: COLORS.TEXTO_SECUNDARIO, textAlign: 'center', paddingVertical: 16, fontSize: 13 }}>
                {t('dashNoStudents')}
              </Text>
            </TouchableOpacity>
          ) : (
            students.map((student, index) => (
              <View key={student.id}>
                <View style={styles.studentItem}>
                  {student.foto ? (
                    <Avatar.Image size={isWeb ? 50 : 44} source={{ uri: student.foto }} />
                  ) : (
                    <Avatar.Text
                      size={isWeb ? 50 : 44}
                      label={student.label || getInitials(student.nombre)}
                      backgroundColor={COLORS.PRIMARIO}
                      color={COLORS.BLANCO}
                    />
                  )}
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.nombre}</Text>
                    <Text style={styles.studentSub}>
                      {t('live') === 'Live' && student.grado
                        ? student.grado.replace('ro Grado', 'rd Grade').replace('to Grado', 'th Grade').replace('do Grado', 'nd Grade').replace('er Grado', 'st Grade').replace('Grado', 'Grade').replace('1ro', '1st Grade').replace('2do', '2nd Grade').replace('3ro', '3rd Grade').replace('4to', '4th Grade').replace('5to', '5th Grade').replace('do', 'nd').replace('ro', 'rd').replace('to', 'th')
                        : student.grado}
                    </Text>
                    <Text style={styles.studentSub}>
                      {t('live') === 'Live' && student.colegio === 'Colegio San Jose' ? 'School San Jose' : student.colegio}
                    </Text>
                  </View>
                  <View style={styles.studentAction}>
                    <Button
                      mode="contained"
                      buttonColor={COLORS.ACENTO}
                      style={styles.mapBtn}
                      labelStyle={styles.mapBtnLabel}
                      compact
                      onPress={() => router.push({ pathname: '/(tabs)/tracking', params: { id: student.id, name: student.nombre } })}
                    >
                      {t('dashViewMap')}
                    </Button>
                    <Button
                      mode="outlined"
                      textColor={COLORS.PRIMARIO}
                      style={{ marginTop: 8, borderColor: COLORS.PRIMARIO, borderRadius: 8 }}
                      labelStyle={{ fontSize: 10 }}
                      compact
                      onPress={() => router.push({
                        pathname: '/student-dashboard',
                        params: {
                          id: student.id,
                          nombre: student.nombre,
                          grado: student.grado,
                          colegio: student.colegio,
                          edad: student.edad
                        }
                      })}
                    >
                      {t('dashViewStudent')}
                    </Button>
                  </View>
                </View>
                {index < students.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </Surface>

        {/* Sección de Notificaciones Recientes */}
        <Surface style={styles.sectionCard} elevation={1}>
          <View style={styles.notificationItem}>
            <View style={[styles.notifDot, { backgroundColor: COLORS.ACENTO }]} />
            <View style={styles.notifTextContainer}>
              <Text style={styles.notifTextBold}>
                {t('live') === 'Live' ? 'Maria arrived at safe zone: School San Jose' : 'Maria llegó a zona segura: Colegio San Jose'}
              </Text>
              <Text style={styles.notifTime}>{t('live') === 'Live' ? '15 min ago' : 'Hace 15 Minutos'}</Text>
            </View>
          </View>

          <View style={styles.notificationItem}>
            <View style={[styles.notifDot, { backgroundColor: COLORS.PRIMARIO }]} />
            <View style={styles.notifTextContainer}>
              <Text style={styles.notifTextBold}>
                {t('live') === 'Live' ? 'Carlos is on his way home' : 'Carlos está en camino a casa'}
              </Text>
              <Text style={styles.notifTime}>{t('live') === 'Live' ? '15 min ago' : 'Hace 15 Minutos'}</Text>
            </View>
          </View>

          <View style={styles.notificationItem}>
            <View style={[styles.notifDot, { backgroundColor: COLORS.ACENTO }]} />
            <View style={styles.notifTextContainer}>
              <Text style={styles.notifTextBold}>
                {t('live') === 'Live' ? 'Route completed without incidents - Maria' : 'Ruta completada sin incidentes - Maria'}
              </Text>
              <Text style={styles.notifTime}>{t('live') === 'Live' ? '5 hours ago' : 'Hace 5 horas'}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')}>
            <Text style={styles.viewAllLink}>{t('dashViewAll')}</Text>
          </TouchableOpacity>
        </Surface>
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
  /* ── Tarjetas de Estadísticas ── */
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.FONDO_TARJETA,
    padding: 14,
    borderRadius: 10,
    borderTopWidth: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardWeb: {
    minWidth: 180,
    padding: 18,
  },
  surfaceInsideStat: { padding: 12, flex: 1 },
  statIconWrap: {
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 13,
    color: COLORS.TEXTO_SECUNDARIO,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.NEGRO,
    marginTop: 2,
  },
  statSubvalue: {
    fontSize: 11,
    color: COLORS.TEXTO_SECUNDARIO,
  },
  /* ── Tarjeta Sección ── */
  sectionCard: {
    backgroundColor: COLORS.FONDO_TARJETA,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.GRIS_BORDE,
  },
  /* ── Estudiantes ── */
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  studentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  studentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.NEGRO,
  },
  studentSub: {
    fontSize: 12,
    color: COLORS.TEXTO_SECUNDARIO,
    marginTop: 1,
  },
  studentAction: {
    alignItems: 'flex-end',
  },
  mapBtn: {
    borderRadius: 6,
  },
  mapBtnLabel: {
    fontSize: 11,
    color: COLORS.BLANCO,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.FONDO_PRINCIPAL,
  },
  /* ── Notificaciones Recientes ── */
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.FONDO_PRINCIPAL,
  },
  notifDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 4,
  },
  notifTextContainer: {
    flex: 1,
  },
  notifTextBold: {
    fontSize: 13,
    color: COLORS.NEGRO,
    fontWeight: '600',
  },
  notifTime: {
    fontSize: 11,
    color: COLORS.TEXTO_SECUNDARIO,
    marginTop: 2,
  },
  viewAllLink: {
    textAlign: 'center',
    color: COLORS.PRIMARIO,
    marginTop: 14,
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ACENTO + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.ACENTO + '40',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ACENTO,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.ACENTO,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
