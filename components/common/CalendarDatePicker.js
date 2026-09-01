import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateKey(date) {
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromDateKey(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let i = 0; i < mondayOffset; i += 1) {
    days.push(null);
  }
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }
  while (days.length % 7 !== 0) {
    days.push(null);
  }
  return days;
}

export default function CalendarDatePicker({ value, onChange, label, placeholder = 'Seleccionar fecha' }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const selectedDate = fromDateKey(value);
  const [visible, setVisible] = useState(false);
  const [monthDate, setMonthDate] = useState(selectedDate || new Date());
  const days = useMemo(() => getCalendarDays(monthDate), [monthDate]);

  const monthLabel = monthDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  const changeMonth = (offset) => {
    setMonthDate(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const selectDate = (date) => {
    onChange(toDateKey(date));
    setVisible(false);
  };

  const clearDate = () => {
    onChange('');
    setVisible(false);
  };

  return (
    <>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.primary} />
        <Text style={[styles.triggerText, { color: value ? colors.text : colors.textSecondary }]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setVisible(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(event) => event.stopPropagation()}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <IconButton icon="chevron-left" iconColor={colors.text} onPress={() => changeMonth(-1)} />
              <Text style={[styles.monthTitle, { color: colors.text }]}>{monthLabel}</Text>
              <IconButton icon="chevron-right" iconColor={colors.text} onPress={() => changeMonth(1)} />
            </View>

            <View style={styles.weekRow}>
              {WEEK_DAYS.map(day => (
                <Text key={day} style={[styles.weekDay, { color: colors.textSecondary }]}>{day}</Text>
              ))}
            </View>

            <ScrollView contentContainerStyle={styles.daysGrid}>
              {days.map((date, index) => {
                const dateKey = toDateKey(date);
                const isSelected = value && dateKey === value;
                return (
                  <TouchableOpacity
                    key={`${dateKey || 'empty'}-${index}`}
                    disabled={!date}
                    style={[
                      styles.dayCell,
                      date && { borderColor: colors.border },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => selectDate(date)}
                  >
                    <Text style={[
                      styles.dayText,
                      { color: date ? colors.text : 'transparent' },
                      isSelected && { color: colors.textOnPrimary, fontWeight: '700' },
                    ]}>
                      {date ? date.getDate() : 0}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.actions}>
              <Button mode="text" textColor={colors.textSecondary} onPress={clearDate}>Limpiar</Button>
              <Button mode="contained" buttonColor={colors.primary} textColor={colors.textOnPrimary} onPress={() => setVisible(false)}>Cerrar</Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  trigger: {
    minHeight: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  monthTitle: {
    textTransform: 'capitalize',
    fontSize: 16,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
});
