import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

export default function InfoScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.PRIMARIO} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <Text style={styles.title}>GPS Guardian Escolar</Text>
        <Text style={styles.description}>Seguridad familiar en tiempo real</Text>
        <Text style={styles.paragraph}>Base inicial del frontend para seguimiento escolar, alertas y control familiar.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.FONDO_PRINCIPAL },
  topBar: { paddingHorizontal: 20, paddingTop: 10 },
  backButton: { padding: 10, alignSelf: 'flex-start' },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingBottom: 40 },
  logo: { width: 190, height: 190, marginBottom: 20 },
  title: { fontSize: 30, fontWeight: 'bold', color: COLORS.PRIMARIO, textAlign: 'center' },
  description: { fontSize: 18, color: COLORS.TEXTO_SECUNDARIO, textAlign: 'center', marginTop: 8 },
  paragraph: { fontSize: 16, color: COLORS.TEXTO_GENERAL, textAlign: 'center', lineHeight: 24, marginTop: 18 },
  primaryButton: { marginTop: 28, backgroundColor: COLORS.PRIMARIO, paddingVertical: 14, paddingHorizontal: 34, borderRadius: 12 },
  primaryButtonText: { color: COLORS.BLANCO, fontSize: 16, fontWeight: 'bold' },
});
