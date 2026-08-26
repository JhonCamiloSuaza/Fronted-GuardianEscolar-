import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';

export default function InfoScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const isSmall = width < 420;
  const isCompactHeight = height < 760;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.PRIMARIO} />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentBlock, isMobile && styles.contentBlockMobile]}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={[styles.logo, isMobile && styles.logoMobile, isCompactHeight && styles.logoCompact]}
            contentFit="contain"
          />

          <Text style={[styles.title, isMobile && styles.titleMobile, isSmall && styles.titleSmall]}>{t('appName')}</Text>

          <Text style={[styles.description, isMobile && styles.descriptionMobile, isSmall && styles.descriptionSmall]}>
            {t('live') === 'Live' ? 'Real-time family safety' : 'Seguridad familiar en tiempo real'}
          </Text>

          <Text style={[styles.featureText, isMobile && styles.featureTextMobile, isSmall && styles.featureTextSmall, styles.mainParagraph]}>
            {t('live') === 'Live'
              ? 'Track your children, get alerts if they deviate from their route and review their travel history — all from your phone.'
              : 'Rastrea a tus hijos, recibe alertas si se desvían de su ruta y revisa su historial de recorridos — todo desde tu celular.'}
          </Text>

          <Text style={[styles.featureText, isMobile && styles.featureTextMobile, isSmall && styles.featureTextSmall, styles.summaryLine]}>
            {t('live') === 'Live' ? 'Every 30 sec · Instant alerts · Full history' : 'Cada 30 segundos · Alertas instantáneas · Historial completo'}
          </Text>

          <TouchableOpacity
            style={[styles.arrowButton, isMobile && styles.arrowButtonMobile]}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-right" size={30} color={COLORS.BLANCO} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.FONDO_PRINCIPAL,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  containerMobile: {
    paddingHorizontal: 24,
  },
  contentBlock: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  contentBlockMobile: {
    maxWidth: 360,
    width: '100%',
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 14,
  },
  logoMobile: {
    width: 110,
    height: 110,
    marginBottom: 10,
  },
  logoCompact: {
    width: 96,
    height: 96,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARIO,
    textAlign: 'center',
    marginBottom: 20,
  },
  titleMobile: {
    fontSize: 28,
    marginBottom: 12,
  },
  description: {
    fontSize: 18,
    color: COLORS.PRIMARIO,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  descriptionMobile: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.PRIMARIO,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 340,
    alignSelf: 'center',
  },
  featureTextMobile: {
    fontSize: 12,
    lineHeight: 19,
    maxWidth: 300,
  },
  mainParagraph: {
    marginBottom: 12,
  },
  summaryLine: {
    marginBottom: 24,
  },
  titleSmall: {
    fontSize: 42,
  },
  descriptionSmall: {
    fontSize: 16,
    lineHeight: 24,
  },
  featureTextSmall: {
    fontSize: 14,
    lineHeight: 22,
  },
  arrowButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.PRIMARIO,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  arrowButtonMobile: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});
