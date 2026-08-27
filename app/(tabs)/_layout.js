import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARIO,
        tabBarInactiveTintColor: COLORS.TEXTO_SECUNDARIO,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
      }}
    >
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
        name="tracking"
        options={{
          title: t('tabTracking'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-search-outline" color={color} size={size} />
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
    </Tabs>
  );
}
