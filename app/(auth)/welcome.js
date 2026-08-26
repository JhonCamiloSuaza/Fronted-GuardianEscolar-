import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../../translations';
import { Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, lang, setLanguage } = useLanguage();
  const [langModalVisible, setLangModalVisible] = React.useState(false);

  const renderLangItem = ({ item }) => {
    const isSelected = lang === item.code;
    return (
      <TouchableOpacity
        style={[styles.langItem, isSelected && styles.langItemActive, !item.available && { opacity: 0.5 }]}
        onPress={() => {
          if (!item.available) {
            Alert.alert(t('langComingSoon'), `${item.label} no está disponible aún.`);
            return;
          }
          setLanguage(item.code);
          setLangModalVisible(false);
        }}
      >
        <Text style={styles.langFlag}>{item.flag}</Text>
        <Text style={[styles.langLabel, isSelected && styles.langLabelActive]}>{item.label}</Text>
        {isSelected && <MaterialCommunityIcons name="check" size={20} color={COLORS.ACENTO} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.globeButton}
          onPress={() => setLangModalVisible(true)}
        >
          <MaterialCommunityIcons name="web" size={26} color={COLORS.PRIMARIO} />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.appName}>{t('appName')}</Text>
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() => router.push('/(auth)/info')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="arrow-right" size={30} color={COLORS.BLANCO} />
        </TouchableOpacity>
      </View>

      <Modal visible={langModalVisible} transparent animationType="fade" onRequestClose={() => setLangModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setLangModalVisible(false)} style={{ marginRight: 15, padding: 4 }}>
                <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.PRIMARIO} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>{t('profileSelectLang')}</Text>
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
    backgroundColor: COLORS.FONDO_PRINCIPAL,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 230,
    height: 230,
    marginBottom: 18,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARIO,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 40,
    paddingHorizontal: 10,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARIO,
    marginBottom: 20,
    textAlign: 'center',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  langItemActive: {
    backgroundColor: COLORS.FONDO_PRINCIPAL,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  langFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  langLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXTO_SECUNDARIO,
  },
  langLabelActive: {
    color: COLORS.PRIMARIO,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.FONDO_SECUNDARIO,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: COLORS.TEXTO_SECUNDARIO,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
