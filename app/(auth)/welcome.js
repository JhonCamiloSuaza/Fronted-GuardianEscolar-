import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <Text style={styles.appName}>GPS Guardian Escolar</Text>
        <TouchableOpacity style={styles.arrowButton} onPress={() => router.push('/(auth)/info')} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-right" size={30} color={COLORS.BLANCO} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.FONDO_PRINCIPAL },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  logo: { width: 230, height: 230, marginBottom: 18 },
  appName: { fontSize: 32, fontWeight: 'bold', color: COLORS.PRIMARIO, textAlign: 'center', marginBottom: 40 },
  arrowButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.PRIMARIO, justifyContent: 'center', alignItems: 'center', elevation: 4 },
});
