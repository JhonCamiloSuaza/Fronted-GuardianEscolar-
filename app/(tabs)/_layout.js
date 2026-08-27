import React, { useState, useEffect, useRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, useWindowDimensions, View, Animated, Platform, Modal, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../../translations';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

function CustomHeader() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWeb = width > 768;
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLanguage } = useLanguage();
  const [isOnline, setIsOnline] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState(lang);

  // Animación para el punto LIVE
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const url = Platform.OS === 'web'
          ? 'https://captive.apple.com/generate_204'
          : 'http://connectivitycheck.gstatic.com/generate_204';
        await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          ...(Platform.OS === 'web' ? { mode: 'no-cors' } : {})
        });
        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch (e) {
        setIsOnline(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 3000);
    if (Platform.OS === 'web') {
      const handleStatus = () => { setIsOnline(navigator.onLine); checkConnection(); };
      window.addEventListener('online', handleStatus);
      window.addEventListener('offline', handleStatus);
      return () => {
        clearInterval(interval);
        window.removeEventListener('online', handleStatus);
        window.removeEventListener('offline', handleStatus);
      };
    }
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  // Sync selectedLang with global lang
  useEffect(() => { setSelectedLang(lang); }, [lang]);

  const navItems = [
    { labelKey: 'navDashboard', route: '/(tabs)' },
    { labelKey: 'navStudent', route: '/(tabs)/student' },
    { labelKey: 'navTracking', route: '/(tabs)/tracking' },
    { labelKey: 'navZones', route: '/(tabs)/zones' },
    { labelKey: 'navNotifications', route: '/(tabs)/notifications' },
    { labelKey: 'navHistory', route: '/(tabs)/history' },
    { labelKey: 'navProfile', route: '/(tabs)/profile' },
  ];

  const handleApplyLanguage = () => {
    setLanguage(selectedLang);
    setLangModalVisible(false);
  };

  return (
    <View style={{ backgroundColor: COLORS.PRIMARIO, paddingTop: insets.top }}>
      <View style={styles.header}>
        {/* Marca + Badge LIVE */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={styles.headerBrand}>{t('appName')}</Text>
          <View style={[styles.connectionBadge, !isOnline && styles.connectionBadgeOffline]}>
            <Animated.View style={[styles.statusDot, { opacity: pulseAnim }, !isOnline && styles.statusDotOffline]} />
            <Text style={styles.statusText}>{isOnline ? t('live') : t('offline')}</Text>
          </View>
        </View>

        {/* Nav Web */}
        {isWeb && (
          <View style={styles.navLinks}>
            {navItems.map((item) => {
              const isActive = pathname === item.route || (item.route === '/(tabs)' && pathname === '/');
              return (
                <TouchableOpacity key={item.route} onPress={() => router.push(item.route)}>
                  <Text style={[styles.navLink, isActive && styles.navLinkActive]}>
                    {t(item.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Globo de idioma */}
        <TouchableOpacity onPress={() => setLangModalVisible(true)} style={styles.globeBtn}>
          <MaterialCommunityIcons name="web" size={22} color="#fff" />
          <Text style={styles.langCode}>{lang.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de idioma */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <Pressable style={styles.langModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.langModalTitle}>{t('langTitle')}</Text>
            <Text style={styles.langModalSub}>{t('langSubtitle')}</Text>

            {SUPPORTED_LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[
                  styles.langOption,
                  selectedLang === l.code && styles.langOptionSelected,
                  !l.available && styles.langOptionDisabled,
                ]}
                onPress={() => l.available && setSelectedLang(l.code)}
                disabled={!l.available}
              >
                <Text style={styles.langFlag}>{l.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.langLabel,
                    selectedLang === l.code && styles.langLabelSelected,
                    !l.available && styles.langLabelDisabled,
                  ]}>
                    {l.label}
                  </Text>
                  {!l.available && (
                    <Text style={styles.comingSoonLabel}>{t('langComingSoon')}</Text>
                  )}
                </View>
                {selectedLang === l.code && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.ACENTO} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyLanguage}>
              <Text style={styles.applyBtnText}>{t('langSave')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setLangModalVisible(false)} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: COLORS.TEXTO_SECUNDARIO, fontSize: 13 }}>✕ Cerrar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function TabLayoutInner() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.PRIMARIO,
        tabBarInactiveTintColor: COLORS.TEXTO_SECUNDARIO,
        headerShown: true,
        header: () => <CustomHeader />,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 10,
          backgroundColor: COLORS.BLANCO,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabDashboard'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="student"
        options={{
          title: t('tabStudent'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-school" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabNotifications'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: t('tabTracking'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-search-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabHistory'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="zones"
        options={{
          title: t('tabZones'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-path" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <TabLayoutInner />;
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.PRIMARIO,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerBrand: {
    color: COLORS.BLANCO,
    fontSize: 18,
    fontWeight: 'bold',
  },
  navLinks: {
    flexDirection: 'row',
    gap: 25,
  },
  navLink: {
    color: COLORS.BLANCO,
    fontSize: 14,
    opacity: 0.7,
  },
  navLinkActive: {
    opacity: 1,
    fontWeight: 'bold',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#ffffff40',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  statusText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  connectionBadgeOffline: {
    backgroundColor: '#EF444420',
    borderColor: '#EF444440',
  },
  statusDotOffline: {
    backgroundColor: '#EF4444',
  },
  globeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: '#ffffff20',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#ffffff40',
  },
  langCode: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: 320,
    maxWidth: '90%',
    elevation: 10,
  },
  langModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARIO,
    marginBottom: 4,
  },
  langModalSub: {
    fontSize: 12,
    color: COLORS.TEXTO_SECUNDARIO,
    marginBottom: 18,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  langOptionSelected: {
    borderColor: COLORS.ACENTO,
    backgroundColor: COLORS.ACENTO + '10',
  },
  langOptionDisabled: {
    opacity: 0.5,
  },
  langFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  langLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  langLabelSelected: {
    color: COLORS.PRIMARIO,
  },
  langLabelDisabled: {
    color: '#9CA3AF',
  },
  comingSoonLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  applyBtn: {
    backgroundColor: COLORS.PRIMARIO,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
