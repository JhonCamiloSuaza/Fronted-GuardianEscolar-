import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SUPPORTED_LANGUAGES } from '../../translations';

// ════════════════════════════════════════════════════════════════
// BREAKPOINTS RESPONSIVE
// ════════════════════════════════════════════════════════════════

const BREAKPOINTS = {
  mobile: 0,      // 0px - 480px
  tablet: 481,    // 481px - 768px
  desktop: 769,   // 769px - 1024px
  wide: 1025,     // 1025px+
};

const getScreenType = (width) => {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  if (width < BREAKPOINTS.wide) return 'desktop';
  return 'wide';
};

function CustomHeader() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const screenType = getScreenType(width);
  const isWeb = screenType === 'desktop' || screenType === 'wide';
  
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLanguage } = useLanguage();
  const { theme, isDark, toggleTheme } = useTheme();
  
  const [isOnline, setIsOnline] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState(lang);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ─── Verificar conexión ───
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

  // ─── Animación LIVE ───
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
    <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}>
      <View style={styles.header}>
        {/* Marca + Badge LIVE */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={[styles.headerBrand, { color: theme.colors.textOnPrimary }]}>{t('appName')}</Text>
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
                  <Text style={[styles.navLink, isActive && styles.navLinkActive, { color: theme.colors.textOnPrimary }]}>
                    {t(item.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Botones de control (Theme + Idioma) */}
        <View style={styles.controlsContainer}>
          {/* Toggle Dark Mode */}
          <TouchableOpacity 
            style={[styles.iconBtn, { borderColor: theme.colors.textOnPrimary + '40' }]}
            onPress={toggleTheme}
          >
            <MaterialCommunityIcons 
              name={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'} 
              size={18} 
              color={theme.colors.textOnPrimary}
            />
          </TouchableOpacity>

          {/* Selector de Idioma */}
          <TouchableOpacity 
            onPress={() => setLangModalVisible(true)} 
            style={[styles.globeBtn, { borderColor: theme.colors.textOnPrimary + '40' }]}
          >
            <MaterialCommunityIcons name="web" size={16} color={theme.colors.textOnPrimary} />
            <Text style={[styles.langCode, { color: theme.colors.textOnPrimary }]}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de idioma */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]} onPress={() => setLangModalVisible(false)}>
          <Pressable style={[styles.langModal, { backgroundColor: theme.colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.langModalTitle, { color: theme.colors.primary }]}>{t('langTitle')}</Text>
            <Text style={[styles.langModalSub, { color: theme.colors.textSecondary }]}>{t('langSubtitle')}</Text>

            {SUPPORTED_LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[
                  styles.langOption,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSecondary },
                  selectedLang === l.code && { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent + '15' },
                ]}
                onPress={() => setSelectedLang(l.code)}
              >
                <Text style={styles.langFlag}>{l.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.langLabel,
                    { color: theme.colors.text },
                    selectedLang === l.code && { color: theme.colors.primary, fontWeight: 'bold' },
                  ]}>
                    {l.label}
                  </Text>
                </View>
                {selectedLang === l.code && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.accent} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: theme.colors.primary }]} onPress={handleApplyLanguage}>
              <Text style={[styles.applyBtnText, { color: theme.colors.textOnPrimary }]}>{t('langSave')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setLangModalVisible(false)} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>✕ {t('close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function TabLayoutInner() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const screenType = getScreenType(width);
  const showTabBar = screenType !== 'wide' && screenType !== 'desktop';
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: true,
        header: () => <CustomHeader />,
        // ─── RESPONSIVE TABBAR ───
        tabBarStyle: showTabBar ? {
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          elevation: 8,
          backgroundColor: theme.colors.surface,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 10,
        } : {
          display: 'none', // ← Oculta en desktop/wide
        },
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
  headerContainer: {
    borderBottomWidth: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  headerBrand: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 28,
  },
  navLink: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '500',
  },
  navLinkActive: {
    opacity: 1,
    fontWeight: '700',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#4ADE80',
    marginRight: 5,
  },
  statusText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  connectionBadgeOffline: {
    backgroundColor: 'rgba(239,68,68,0.16)',
    borderColor: 'rgba(239,68,68,0.28)',
  },
  statusDotOffline: {
    backgroundColor: '#EF4444',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  globeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  langCode: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langModal: {
    borderRadius: 20,
    padding: 24,
    width: 320,
    maxWidth: '90%',
    elevation: 8,
  },
  langModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  langModalSub: {
    fontSize: 12,
    marginBottom: 16,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  langOptionDisabled: {
    opacity: 0.5,
  },
  langFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  langLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  langLabelDisabled: {
    color: '#9CA3AF',
  },
  comingSoonLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  applyBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  applyBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
