import { StyleSheet } from 'react-native'
import { Button } from 'react-native-paper'

import { COLORS } from '../../config/constants'

export default function CustomButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  mode = 'contained',
  style,
}) {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      style={[styles.button, style]}
      contentStyle={styles.content}
      labelStyle={styles.label}
    >
      {title}
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    marginVertical: 6,
  },
  content: {
    height: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
})