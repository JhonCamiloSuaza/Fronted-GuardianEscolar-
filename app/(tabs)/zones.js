import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, Avatar, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../../constants/colors';
import SafeMap from '../../components/SafeMap';
import { getStudents, addZone, updateZone, deleteZone, getInitials, addRoute, updateRoute, deleteRoute } from '../../utils/studentStorage';
import { useLanguage } from '../../contexts/LanguageContext';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

const EMPTY_ZONE = { name: '', type: 'Personalizado', address: '', radius: '100 Metros', color: COLORS.PRIMARIO };

export default function ZonesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('zones'); // 'zones' or 'routes'

  const [modalVisible, setModalVisible] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [form, setForm] = useState(EMPTY_ZONE);

  const [modalRouteVisible, setModalRouteVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const EMPTY_ROUTE = { name: '', start: '', end: '' };
  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE);

  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const data = await getStudents();
    setStudents(data);
    setSelectedStudent(prev => {
      if (prev) {
        return data.find(s => s.id === prev.id) || prev;
      }
      return prev;
    });
  }

  function openAddZone() {
    setEditingZone(null);
    setForm(EMPTY_ZONE);
    setModalVisible(true);
  }

  function openEditZone(zone) {
    setEditingZone(zone);
    setForm(zone);
    setModalVisible(true);
  }

  async function handleSaveZone() {
    if (!form.name.trim() || !form.address.trim()) {
      Alert.alert(t('zonesRequiredFields'), t('zonesRequiredZoneMsg'));
      return;
    }
    setLoading(true);
    try {
      if (editingZone) {
        await updateZone(selectedStudent.id, editingZone.id, form);
      } else {
        await addZone(selectedStudent.id, form);
      }
      await loadData();
      setModalVisible(false);
    } finally {
      setLoading(false);
    }
  }

  function confirmDeleteZone(zone) {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`¿Eliminar la zona "${zone.name}"?`);
      if (confirmed) {
        (async () => {
          await deleteZone(selectedStudent.id, zone.id);
          await loadData();
        })();
      }
      return;
    }

    Alert.alert(
      'Eliminar Zona',
      `¿Eliminar la zona "${zone.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteZone(selectedStudent.id, zone.id);
            await loadData();
          },
        },
      ]
    );
  }

  function openAddRoute() {
    setEditingRoute(null);
    setRouteForm(EMPTY_ROUTE);
    setModalRouteVisible(true);
  }

  function openEditRoute(route) {
    setEditingRoute(route);
    setRouteForm(route);
    setModalRouteVisible(true);
  }

  async function handleSaveRoute() {
    if (!routeForm.name.trim() || !routeForm.start.trim() || !routeForm.end.trim()) {
      Alert.alert(t('zonesRequiredFields'), t('zonesRequiredRouteMsg'));
      return;
    }
    setLoading(true);
    try {
      if (editingRoute) {
        await updateRoute(selectedStudent.id, editingRoute.id, routeForm);
      } else {
        await addRoute(selectedStudent.id, routeForm);
      }
      await loadData();
      setModalRouteVisible(false);
    } finally {
      setLoading(false);
    }
  }

  function confirmDeleteRoute(route) {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`¿Eliminar la ruta "${route.name}"?`);
      if (confirmed) {
        (async () => {
          await deleteRoute(selectedStudent.id, route.id);
          await loadData();
        })();
      }
      return;
    }

    Alert.alert(
      'Eliminar Ruta',
      `¿Eliminar la ruta "${route.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteRoute(selectedStudent.id, route.id);
            await loadData();
          },
        },
      ]
    );
  }

  if (!selectedStudent) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Surface style={styles.selectCard} elevation={1}>
            <Text style={styles.selectTitle}>{t('zonesSelectStudent')}</Text>
            {students.length === 0 ? (
              <View style={styles.emptyCenter}>
                <Text style={styles.emptyText}>{t('zonesNoStudents')}</Text>
                <Button mode="contained" onPress={() => router.push('/(tabs)/student')} style={{ marginTop: 10 }}>
                  {t('zonesGoStudents')}
                </Button>
              </View>
            ) : (
              <View style={styles.studentGrid}>
                {students.map(student => (
                  <Surface
                    key={student.id}
                    style={[styles.studentSelector, { borderLeftWidth: 4, borderLeftColor: COLORS.PRIMARIO }]}
                    elevation={1}
                  >
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => setSelectedStudent(student)}
                    >
                    <Avatar.Text
                      size={50}
                      label={student.label || getInitials(student.nombre)}
                      backgroundColor={COLORS.PRIMARIO}
                      color={COLORS.BLANCO}
                    />
                    <View style={styles.studentSelectorInfo}>
                      <Text style={styles.studentSelectorName}>{student.nombre}</Text>
                      <Text style={styles.studentSelectorSub}>{t('zonesConfigZones')}</Text>
                    </View>
                    </TouchableOpacity>
                  </Surface>
                ))}
              </View>
            )}
          </Surface>
        </ScrollView>
      </View>
    );
  }

  const currentZones = selectedStudent.zones || [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Botón Volver */}
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedStudent(null)}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.PRIMARIO} />
          <Text style={styles.backBtnText}>{t('zonesChangeStudent')}</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t('zonesTitle')}</Text>
            <Text style={styles.subtitle}>{t('zonesFor')} <Text style={{ fontWeight: 'bold', color: COLORS.PRIMARIO }}>{selectedStudent.nombre}</Text></Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'zones' && styles.tabActive]}
            onPress={() => setActiveTab('zones')}
          >
            <Text style={[styles.tabText, activeTab === 'zones' && styles.tabTextActive]}>{t('zonesSafeZones')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'routes' && styles.tabActive]}
            onPress={() => setActiveTab('routes')}
          >
            <Text style={[styles.tabText, activeTab === 'routes' && styles.tabTextActive]}>{t('zonesSavedRoutes')}</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'zones' && (
          <>
            <View style={styles.actionRow}>
              <Text style={styles.countText}>{currentZones.length} {t('zonesConfigured')}</Text>
              <TouchableOpacity style={styles.addBtn} onPress={openAddZone}>
                <Text style={styles.addBtnText}>{t('zonesNewZone')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.zonesGrid}>
              {currentZones.length === 0 ? (
                <Text style={styles.emptyTextZone}>{t('zonesNoZones')}</Text>
              ) : (
                currentZones.map(zone => {
                  const zoneColor = zone.type === 'Escuela' ? COLORS.PRIMARIO : (zone.type === 'Casa' ? COLORS.ACENTO : COLORS.ALERTA);
                  return (
                    <Surface key={zone.id} style={[styles.zoneCard, { borderLeftWidth: 4, borderLeftColor: zoneColor }]} elevation={1}>
                      <View style={styles.zoneHeader}>
                        <View style={[styles.zoneIcon, { backgroundColor: zoneColor }]} />
                        <View>
                          <Text style={styles.zoneName}>{zone.name}</Text>
                          <Text style={styles.zoneType}>{zone.type}</Text>
                        </View>
                      </View>
                    <View style={styles.zoneBody}>
                      <Text style={styles.zoneLabel}>{t('live') === 'Live' ? 'Address:' : 'Dirección:'}</Text>
                      <Text style={styles.zoneValue} numberOfLines={1}>{zone.address}</Text>
                      <View style={styles.zoneRow}>
                        <Text style={styles.zoneLabel}>{t('live') === 'Live' ? 'Alert Radius:' : 'Radio Alerta:'}</Text>
                        <Text style={styles.zoneValue}>{zone.radius}</Text>
                      </View>
                    </View>
                    <View style={styles.zoneFooter}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEditZone(zone)}>
                        <Text style={styles.editBtnText}>{t('live') === 'Live' ? 'Edit' : 'Editar'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDeleteZone(zone)}>
                        <Text style={styles.deleteBtnText}>{t('live') === 'Live' ? 'Delete' : 'Eliminar'}</Text>
                      </TouchableOpacity>
                    </View>
                    </Surface>
                  );
                })
              )}
            </View>

            <Surface style={styles.mapCard} elevation={1}>
              <Text style={styles.mapCardTitle}>{t('live') === 'Live' ? 'Map Preview' : 'Vista Previa del Mapa'}</Text>
              <View style={styles.mapContainer}>
                 <SafeMap
                    style={styles.map}
                    initialRegion={{
                      latitude: 4.5709,
                      longitude: -74.2973,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }}
                    markers={currentZones.map((z, i) => {
                      const markerColor = z.type === 'Escuela' ? COLORS.PRIMARIO : (z.type === 'Casa' ? COLORS.ACENTO : COLORS.ALERTA);
                      return {
                        lat: 4.5709 + (i * 0.005),
                        lng: -74.2973 + (i * 0.005),
                        color: markerColor,
                        title: z.name
                      };
                    })}
                 />
              </View>
            </Surface>
          </>
        )}

        {activeTab === 'routes' && (
          <>
            <View style={styles.actionRow}>
              <Text style={styles.countText}>{(selectedStudent.routes || []).length} {t('live') === 'Live' ? 'saved routes' : 'rutas guardadas'}</Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: COLORS.ACENTO }]} onPress={openAddRoute}>
                <Text style={styles.addBtnText}>{t('live') === 'Live' ? '+ New Route' : '+ Nueva Ruta'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.zonesGrid}>
              {(selectedStudent.routes || []).length === 0 ? (
                <Text style={styles.emptyTextZone}>{t('live') === 'Live' ? 'No routes configured for this student.' : 'No hay rutas configuradas para este estudiante.'}</Text>
              ) : (
                (selectedStudent.routes || []).map(route => (
                  <Surface key={route.id} style={[styles.zoneCard, { paddingBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.ACENTO }]} elevation={1}>
                    <View style={styles.routeHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.routeName}>{route.name}</Text>
                        <Text style={styles.routeAssign}>{t('live') === 'Live' ? 'Assigned to:' : 'Asignada a:'} {selectedStudent.nombre}</Text>
                      </View>
                      <View style={styles.routeStatus}>
                         <MaterialCommunityIcons name="radiobox-marked" size={12} color={COLORS.ACENTO} />
                         <Text style={styles.routeStatusText}>{t('live') === 'Live' ? 'Active' : 'Activa'}</Text>
                      </View>
                    </View>

                    <View style={styles.routeTimeline}>
                      <View style={styles.timelineDotGreen} />
                      <Text style={styles.timelineText}>{route.start}</Text>
                      <View style={styles.timelineLine} />
                      <View style={styles.timelineDotRed} />
                      <Text style={styles.timelineText}>{route.end}</Text>
                    </View>

                    <View style={styles.zoneFooter}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEditRoute(route)}>
                        <Text style={styles.editBtnText}>{t('live') === 'Live' ? 'Edit' : 'Editar'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDeleteRoute(route)}>
                        <Text style={styles.deleteBtnText}>{t('live') === 'Live' ? 'Delete' : 'Eliminar'}</Text>
                      </TouchableOpacity>
                    </View>
                  </Surface>
                ))
              )}
            </View>
          </>
        )}

      </ScrollView>

      {/* Modal Agregar / Editar Zona */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Surface style={styles.modalSheet} elevation={5}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: form.color || COLORS.PRIMARIO }]}>{editingZone ? 'Editar Zona' : 'Nueva Zona Segura'}</Text>
                <IconButton icon="close" size={22} onPress={() => setModalVisible(false)} />
              </View>

              <ScrollView>
                <ZField label="Nombre de la zona" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Ej: Casa, Escuela..." color={form.color} />
                <ZField label="Dirección" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Ej: Calle 123..." color={form.color} />
                <ZField label="Radio de Alerta" value={form.radius} onChange={v => setForm(f => ({ ...f, radius: v }))} placeholder="Ej: 100 Metros" color={form.color} />

                <View style={styles.typeSelector}>
                  <Text style={styles.fieldLabel}>Tipo de Zona</Text>
                  <View style={styles.typeRow}>
                    {['Casa', 'Escuela', 'Personalizado'].map(t => {
                      const isActive = form.type === t;
                      const activeColor = t === 'Casa' ? COLORS.ACENTO : t === 'Escuela' ? COLORS.PRIMARIO : COLORS.ALERTA;

                      return (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.typeChip,
                            isActive && { backgroundColor: activeColor, borderColor: activeColor }
                          ]}
                          onPress={() => setForm(f => ({ ...f, type: t, color: activeColor }))}
                        >
                          <Text style={[styles.typeChipText, isActive && styles.typeChipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <Button
                  mode="contained"
                  onPress={handleSaveZone}
                  loading={loading}
                  style={[styles.saveBtn, { backgroundColor: form.color || COLORS.PRIMARIO }]}
                >
                  {editingZone ? 'Guardar Cambios' : 'Crear Zona Segura'}
                </Button>

                {editingZone && (
                  <Button
                    mode="text"
                    textColor={COLORS.ALERTA}
                    onPress={() => {
                      setModalVisible(false);
                      confirmDeleteZone(editingZone);
                    }}
                    style={{ marginTop: 10 }}
                  >
                    Eliminar Zona
                  </Button>
                )}
              </ScrollView>
            </Surface>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal Agregar/Editar Ruta */}
      <Modal visible={modalRouteVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Surface style={styles.modalSheet} elevation={5}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingRoute ? 'Editar Ruta' : 'Nueva Ruta'}</Text>
                <IconButton icon="close" size={20} onPress={() => setModalRouteVisible(false)} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <ZField
                  label="Nombre de la Ruta *"
                  value={routeForm.name}
                  onChange={v => setRouteForm({ ...routeForm, name: v })}
                  placeholder="Ej. Casa - Colegio"
                />
                <ZField
                  label="Dirección Inicial"
                  value={routeForm.start}
                  onChange={v => setRouteForm({ ...routeForm, start: v })}
                  placeholder="Lugar de inicio"
                />
                <ZField
                  label="Dirección Final"
                  value={routeForm.end}
                  onChange={v => setRouteForm({ ...routeForm, end: v })}
                  placeholder="Lugar de destino"
                />

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Estudiante</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: COLORS.GRIS_BORDE, color: COLORS.TEXTO_SECUNDARIO }]}
                    value={selectedStudent?.nombre}
                    editable={false}
                  />
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalRouteVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <Button
                    mode="contained"
                    onPress={handleSaveRoute}
                    loading={loading}
                    style={[styles.saveBtn, { backgroundColor: COLORS.ACENTO }]}
                  >
                    {editingRoute ? 'Guardar Cambios' : 'Crear Ruta'}
                  </Button>
                </View>

                {editingRoute && (
                  <Button
                    mode="text"
                    textColor={COLORS.ALERTA}
                    onPress={() => {
                      setModalRouteVisible(false);
                      confirmDeleteRoute(editingRoute);
                    }}
                    style={{ marginTop: 10 }}
                  >
                    Eliminar Ruta
                  </Button>
                )}
              </ScrollView>
            </Surface>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function ZField({ label, value, onChange, placeholder, color }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, { color: COLORS.TEXTO_GENERAL }, color && { borderColor: color, borderWidth: 1.5 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXTO_SECUNDARIO}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.FONDO_PRINCIPAL },
  scrollContent: { padding: 16, paddingBottom: 40 },
  selectCard: { backgroundColor: COLORS.FONDO_TARJETA, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: COLORS.GRIS_BORDE },
  selectTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.NEGRO, marginBottom: 16 },
  emptyCenter: { alignItems: 'center', padding: 20 },
  emptyText: { color: COLORS.TEXTO_SECUNDARIO, fontSize: 14 },
  emptyTextZone: { textAlign: 'center', color: COLORS.TEXTO_SECUNDARIO, fontSize: 14, width: '100%', paddingVertical: 20 },
  studentGrid: { flexDirection: isWeb ? 'row' : 'column', gap: 12 },
  studentSelector: { backgroundColor: COLORS.BLANCO, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.GRIS_BORDE, marginBottom: 8, flex: isWeb ? 1 : undefined },
  studentSelectorInfo: { marginLeft: 12 },
  studentSelectorName: { fontSize: 14, fontWeight: 'bold', color: COLORS.NEGRO },
  studentSelectorSub: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO, marginTop: 2 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtnText: { color: COLORS.PRIMARIO, fontSize: 14, marginLeft: 4, fontWeight: '500' },
  headerRow: { marginTop: 20, marginBottom: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.TEXTO_GENERAL },
  subtitle: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO, marginTop: 2 },
  headerBtn: { backgroundColor: COLORS.BLANCO, borderRadius: 8 },
  tabsContainer: { flexDirection: 'row', backgroundColor: COLORS.GRIS_BORDE, borderRadius: 8, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: COLORS.BLANCO, elevation: 2 },
  tabText: { fontSize: 14, color: COLORS.TEXTO_SECUNDARIO, fontWeight: '500' },
  tabTextActive: { color: COLORS.PRIMARIO, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  countText: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO },
  addBtn: { backgroundColor: COLORS.ACENTO, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addBtnText: { color: COLORS.BLANCO, fontSize: 12, fontWeight: 'bold' },
  zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  zoneCard: { width: isWeb ? '48%' : '100%', backgroundColor: COLORS.BLANCO, borderRadius: 8, padding: 12, marginBottom: 8 },
  zoneHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: COLORS.GRIS_BORDE },
  zoneIcon: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  zoneName: { fontSize: 16, fontWeight: 'bold', color: COLORS.NEGRO },
  zoneType: { fontSize: 12, color: COLORS.TEXTO_SECUNDARIO },
  zoneBody: { padding: 12 },
  zoneLabel: { fontSize: 11, color: COLORS.TEXTO_SECUNDARIO, marginBottom: 2 },
  zoneValue: { fontSize: 13, color: COLORS.TEXTO_GENERAL, fontWeight: '500', marginBottom: 10 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderColor: COLORS.GRIS_BORDE },
  routeName: { fontSize: 16, fontWeight: 'bold', color: COLORS.NEGRO },
  routeAssign: { fontSize: 11, color: COLORS.TEXTO_SECUNDARIO, marginTop: 2 },
  routeStatus: { fontSize: 12, color: COLORS.ACENTO_OSCURO, fontWeight: 'bold' },
  routeStatusInactive: { color: COLORS.TEXTO_SECUNDARIO },
  routeTimeline: { padding: 12, flexDirection: 'row', alignItems: 'center' },
  timelineContainer: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  timelineDotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.ACENTO },
  timelineDotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.ALERTA },
  timelineLine: { flex: 1, height: 2, backgroundColor: COLORS.GRIS_BORDE, marginHorizontal: 8 },
  timelineText: { fontSize: 12, color: COLORS.NEGRO, marginHorizontal: 6, fontWeight: '500' },
  zoneFooter: { flexDirection: 'row', padding: 12, gap: 10, paddingTop: 0 },
  editBtn: { flex: 1, backgroundColor: COLORS.FONDO_PRINCIPAL, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  editBtnText: { color: COLORS.PRIMARIO, fontWeight: '600', fontSize: 13 },
  deleteBtn: { flex: 1, backgroundColor: COLORS.ALERTA_CLARO, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  deleteBtnText: { color: COLORS.ALERTA, fontWeight: '600', fontSize: 13 },
  mapCard: { height: 350, backgroundColor: COLORS.BLANCO, borderRadius: 12, overflow: 'hidden' },
  mapCardTitle: { padding: 12, fontSize: 16, fontWeight: 'bold', color: COLORS.NEGRO, borderBottomWidth: 1, borderBottomColor: COLORS.GRIS_BORDE },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.BLANCO, borderRadius: 12, padding: 20, maxHeight: '90%' },
  modalSheet: { backgroundColor: COLORS.BLANCO, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.NEGRO },
  inputBox: { marginBottom: 16 },
  fieldGroup: { marginBottom: 15 },
  fieldLabel: { fontSize: 13, color: COLORS.TEXTO_SECUNDARIO, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: COLORS.FONDO_PRINCIPAL, borderWidth: 1, borderColor: COLORS.GRIS_BORDE, borderRadius: 8, padding: 12, fontSize: 14, color: COLORS.TEXTO_GENERAL },
  typeSelector: { marginBottom: 20 },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.GRIS_BORDE },
  typeChipActive: { backgroundColor: COLORS.PRIMARIO, borderColor: COLORS.PRIMARIO },
  typeChipText: { fontSize: 11, color: COLORS.TEXTO_SECUNDARIO },
  typeChipTextActive: { color: COLORS.BLANCO, fontWeight: 'bold' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
  cancelBtnText: { color: COLORS.TEXTO_SECUNDARIO, fontWeight: 'bold' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', backgroundColor: COLORS.PRIMARIO },
  saveBtnText: { color: COLORS.BLANCO, fontWeight: 'bold' }
});
