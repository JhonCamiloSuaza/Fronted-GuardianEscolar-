import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SUPPORTED_LANGUAGES } from '../../translations';

const ONBOARDING_KEY = '@guardian_onboarding_seen';

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t, lang, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const colors = theme.colors;
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [checkingSeen, setCheckingSeen] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const slides = useMemo(() => ([
    {
      icon: 'shield-check-outline',
      title: t('appName'),
      text: t('live') === 'Live' ? 'A school safety system for families.' : 'Sistema de seguridad escolar para familias.',
      detail: t('live') === 'Live'
        ? 'GPS School Guardian helps parents follow children, routes, zones and alerts from a single protected experience.'
        : 'GPS Guardian Escolar ayuda a acudientes a seguir hijos, rutas, zonas y alertas desde una experiencia protegida.',
    },
    {
      icon: 'map-marker-path',
      title: t('trackTitle'),
      text: t('live') === 'Live' ? 'Real-time GPS tracking and route monitoring.' : 'Rastreo GPS en tiempo real y monitoreo de rutas.',
      detail: t('live') === 'Live'
        ? 'View the current location, route status and recent movement updates without switching tools.'
        : 'Consulta ubicación actual, estado de ruta y actualizaciones recientes sin cambiar de herramienta.',
    },
    {
      icon: 'map-marker-radius-outline',
      title: t('zonesSafeZones'),
      text: t('live') === 'Live' ? 'Configure safe zones and automatic alerts.' : 'Configura zonas seguras y alertas automáticas.',
      detail: t('live') === 'Live'
        ? 'Create school, home or custom zones so the app can notify important arrivals and departures.'
        : 'Crea zonas de colegio, casa o personalizadas para recibir avisos de llegadas y salidas importantes.',
    },
    {
      icon: 'bell-ring-outline',
      title: t('tabNotifications'),
      text: t('live') === 'Live' ? 'Instant alerts and event history.' : 'Alertas instantáneas e historial de eventos.',
      detail: t('live') === 'Live'
        ? 'Keep warnings, successful arrivals and informational events organized for quick review.'
        : 'Mantén advertencias, llegadas exitosas y eventos informativos organizados para revisión rápida.',
    },
    {
      icon: 'login',
      title: t('live') === 'Live' ? 'Start' : 'Comenzar',
      text: t('live') === 'Live' ? 'Access your account to protect each route.' : 'Accede a tu cuenta para proteger cada ruta.',
      detail: t('live') === 'Live'
        ? 'You can sign in, create an account or recover access from the login screen.'
        : 'Podrás iniciar sesión, crear una cuenta o recuperar el acceso desde el login.',
    },
  ]), [t]);

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (seen === 'true') {
        router.replace('/(auth)/login');
        return;
      }
      setCheckingSeen(false);
    })();
  }, [router]);

  useEffect(() => {
    if (checkingSeen) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % slides.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [checkingSeen, slides.length]);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(auth)/login');
  };

  const renderLangItem = ({ item }) => {
    const isSelected = lang === item.code;
    return (
      <TouchableOpacity
        style={[
          styles.langItem,
          { borderBottomColor: colors.border },
          isSelected && { backgroundColor: colors.surfaceSecondary },
          !item.available && { opacity: 0.5 },
        ]}
        onPress={() => {
          if (!item.available) {
            Alert.alert(t('langComingSoon'), `${item.label} no esta disponible aun.`);
            return;
          }
          setLanguage(item.code);
          setLangModalVisible(false);
        }}
      >
        <Text style={styles.langFlag}>{item.flag}</Text>
        <Text style={[styles.langLabel, { color: isSelected ? colors.primary : colors.text }]}>{item.label}</Text>
        {isSelected && <MaterialCommunityIcons name="check" size={20} color={colors.accent} />}
      </TouchableOpacity>
    );
  };

  if (checkingSeen) {
    return <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.globeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setLangModalVisible(true)}
        >
          <MaterialCommunityIcons name="web" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(item) => item.icon}
          horizontal
          pagingEnabled
          scrollEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const next = Math.round(event.nativeEvent.contentOffset.x / width);
            setActiveIndex(next);
            setExpanded(false);
          }}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <MaterialCommunityIcons name={item.icon} size={44} color={colors.primary} />
              <Text style={[styles.slideTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.slideText, { color: colors.textSecondary }]}>{item.text}</Text>
              <TouchableOpacity
                style={[styles.detailButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => setExpanded(value => !value)}
                accessibilityRole="button"
                accessibilityLabel={expanded ? 'Contraer detalle' : 'Expandir detalle'}
              >
                <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.primary} />
              </TouchableOpacity>
              {expanded ? (
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.detail}</Text>
              ) : null}
            </View>
          )}
        />

        <View style={styles.indicators}>
          {slides.map((item, index) => (
            <View
              key={item.icon}
              style={[
                styles.indicator,
                { backgroundColor: index === activeIndex ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>

        <View style={styles.skipRow}>
          <Button
            mode="text"
            textColor={colors.primary}
            onPress={completeOnboarding}
            compact
          >
            {t('live') === 'Live' ? 'Skip' : 'Omitir'}
          </Button>
        </View>
      </View>

      <Modal visible={langModalVisible} transparent animationType="fade" onRequestClose={() => setLangModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setLangModalVisible(false)} style={styles.modalIconBtn}>
                <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.primary }]}>{t('profileSelectLang')}</Text>
            </View>
            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={renderLangItem}
              scrollEnabled={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  globeButton: {
    padding: 10,
    borderRadius: 25,
    borderWidth: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 8,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    minHeight: 220,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 14,
  },
  slideText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 360,
    marginTop: 10,
  },
  detailButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 380,
    marginTop: 10,
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  indicator: {
    width: 28,
    height: 4,
    borderRadius: 2,
  },
  continueButton: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 8,
    marginBottom: 24,
  },
  continueContent: {
    height: 48,
    flexDirection: 'row-reverse',
  },
  skipRow: {
    width: '92%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconBtn: {
    padding: 4,
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  langFlag: {
    fontSize: 24,
    marginRight: 14,
  },
  langLabel: {
    flex: 1,
    fontSize: 16,
  },
});
