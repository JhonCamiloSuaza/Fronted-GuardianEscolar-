import { memo, useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';

function JsonView({ data, maxHeight = 420 }) {
  const { theme } = useTheme();
  const json = useMemo(() => {
    try {
      return JSON.stringify(data ?? null, null, 2);
    } catch (error) {
      return JSON.stringify({ error: 'No se pudo serializar el JSON.' }, null, 2);
    }
  }, [data]);

  return (
    <ScrollView
      style={[
        styles.container,
        {
          maxHeight,
          backgroundColor: theme.colors.surfaceSecondary,
          borderColor: theme.colors.border,
        },
      ]}
      contentContainerStyle={styles.content}
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator
    >
      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
        <Text selectable style={[styles.code, { color: theme.colors.text }]}>
          {json}
        </Text>
      </ScrollView>
    </ScrollView>
  );
}

export default memo(JsonView);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
  },
  content: {
    minWidth: '100%',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    padding: 12,
  },
});
