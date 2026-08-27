import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';

const STORAGE_KEY = '@guardian_estudiantes';
const NOTIF_KEY = '@guardian_notificaciones';
const HISTORY_KEY = '@guardian_historial';

// Datos por defecto (se cargan la primera vez)
const DEFAULT_STUDENTS = [
  {
    id: '1',
    nombre: 'Maria Pérez',
    grado: '3ro Grado',
    colegio: 'Colegio San Jose',
    edad: '9',
    label: 'MP',
    color: COLORS.PRIMARIO,
    zones: [
      { id: 'z1', name: 'Casa', type: 'Casa', address: 'Calle 45 #12-10', radius: '100 Metros', color: COLORS.PRIMARIO },
      { id: 'z2', name: 'Colegio San Jose', type: 'Escuela', address: 'Carrera 50 #15-30', radius: '150 Metros', color: COLORS.PRIMARIO },
    ],
    routes: [
      { id: 'r1', name: 'Casa - Colegio', start: 'Casa', end: 'Colegio San Jose', isActive: true }
    ]
  },
  {
    id: '2',
    nombre: 'Carlos Pérez',
    grado: '5to Grado',
    colegio: 'Colegio San Jose',
    edad: '11',
    label: 'CP',
    color: COLORS.PRIMARIO,
    zones: [],
    routes: []
  },
];

/** Genera iniciales a partir del nombre */
export function getInitials(nombre = '') {
  const parts = nombre.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() || '??';
}

/** Genera un ID único */
function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}

/** Obtener todos los estudiantes */
export async function getStudents() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      // Asegurar que todos tengan propiedad zones y routes
      return parsed.map(s => ({ ...s, zones: s.zones || [], routes: s.routes || [] }));
    }
    // Primera vez: guardar y retornar defaults
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STUDENTS));
    return DEFAULT_STUDENTS;
  } catch {
    return DEFAULT_STUDENTS;
  }
}

/** Agregar un nuevo estudiante */
export async function addStudent(studentData) {
  const students = await getStudents();
  const newStudent = {
    ...studentData,
    id: generateId(),
    label: getInitials(studentData.nombre),
    color: COLORS.PRIMARIO,
    zones: [],
    routes: []
  };
  const updated = [...students, newStudent];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/** Actualizar un estudiante existente */
export async function updateStudent(id, studentData) {
  const students = await getStudents();
  const updated = students.map(s =>
    s.id === id
      ? { ...s, ...studentData, label: getInitials(studentData.nombre), id }
      : s
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/** Eliminar un estudiante */
export async function deleteStudent(id) {
  const students = await getStudents();
  const studentToDelete = students.find(s => s.id === id);
  const updated = students.filter(s => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  if (studentToDelete) {
    const sName = studentToDelete.nombre.trim().toLowerCase();

    // Sincronizar borrado con Notificaciones
    const notifications = await getNotifications();
    const updatedNotifs = notifications.filter(n => {
      const matchId = n.studentId && n.studentId === id;
      const matchName = n.name && n.name.trim().toLowerCase() === sName;
      return !matchId && !matchName;
    });
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updatedNotifs));

    // Sincronizar borrado con Historial
    const history = await getHistory();
    const updatedHistory = history.filter(h => {
      const matchId = h.studentId && h.studentId === id;
      const matchName = h.estudiante && h.estudiante.trim().toLowerCase() === sName;
      return !matchId && !matchName;
    });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  }

  return updated;
}

/** Gestionar Zonas de un estudiante */

export async function addZone(studentId, zoneData) {
  const students = await getStudents();
  const newZone = { ...zoneData, id: generateId() };
  const updated = students.map(s =>
    s.id === studentId ? { ...s, zones: [...(s.zones || []), newZone] } : s
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.find(s => s.id === studentId).zones;
}

export async function updateZone(studentId, zoneId, zoneData) {
  const students = await getStudents();
  const updated = students.map(s => {
    if (s.id === studentId) {
      const updatedZones = s.zones.map(z => z.id === zoneId ? { ...z, ...zoneData, id: zoneId } : z);
      return { ...s, zones: updatedZones };
    }
    return s;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.find(s => s.id === studentId).zones;
}

export async function deleteZone(studentId, zoneId) {
  const students = await getStudents();
  const updated = students.map(s => {
    if (s.id === studentId) {
      return { ...s, zones: s.zones.filter(z => z.id !== zoneId) };
    }
    return s;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.find(s => s.id === studentId).zones;
}

/** Gestionar Rutas de un estudiante */

export async function addRoute(studentId, routeData) {
  const students = await getStudents();
  const newRoute = { ...routeData, id: Date.now().toString(), isActive: true };
  const updated = students.map(s =>
    s.id === studentId ? { ...s, routes: [...(s.routes || []), newRoute] } : s
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.find(s => s.id === studentId).routes;
}

export async function updateRoute(studentId, routeId, routeData) {
  const students = await getStudents();
  const updated = students.map(s => {
    if (s.id === studentId) {
      const updatedRoutes = (s.routes || []).map(r => r.id === routeId ? { ...r, ...routeData, id: routeId } : r);
      return { ...s, routes: updatedRoutes };
    }
    return s;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.find(s => s.id === studentId).routes;
}

export async function deleteRoute(studentId, routeId) {
  const students = await getStudents();
  const updated = students.map(s => {
    if (s.id === studentId) {
      return { ...s, routes: (s.routes || []).filter(r => r.id !== routeId) };
    }
    return s;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated.find(s => s.id === studentId).routes;
}

// ────── NOTIFICACIONES ──────

export async function getNotifications() {
  const data = await AsyncStorage.getItem(NOTIF_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addNotification(notif) {
  const current = await getNotifications();
  const newNotif = {
    id: Date.now().toString(),
    time: 'Ahora',
    ...notif
  };
  const updated = [newNotif, ...current].slice(0, 50); // Guardar últimas 50
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteNotification(id) {
  const current = await getNotifications();
  const updated = current.filter(n => n.id !== id);
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  return updated;
}

// ────── HISTORIAL ──────

export async function getHistory() {
  const data = await AsyncStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addHistory(entry) {
  const current = await getHistory();
  const newEntry = {
    id: Date.now().toString(),
    fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }),
    ...entry
  };
  const updated = [newEntry, ...current].slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteHistory(id) {
  const current = await getHistory();
  const updated = current.filter(h => h.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}
