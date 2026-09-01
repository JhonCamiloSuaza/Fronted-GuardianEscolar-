import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native'

import { COLORS } from '../../config/constants'

export default function ScreenContainer({
  children,
  scroll = false,
  style,
}) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, style]}>{children}</View>
  )

  return <SafeAreaView style={styles.container}>{content}</SafeAreaView>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
})