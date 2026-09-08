import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const AUTH_DEVICE_ID_KEY = '@guardian_auth_device_id';

const randomId = () => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const detectBrowserName = (userAgent) => {
  if (/Edg\//.test(userAgent)) return 'Microsoft Edge';
  if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) return 'Google Chrome';
  if (/Firefox\//.test(userAgent)) return 'Mozilla Firefox';
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
  return 'Navegador web';
};

const detectOperatingSystem = (userAgent) => {
  if (/Windows NT 10\.0/.test(userAgent)) return 'Windows 10/11';
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Android/.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (/Mac OS X/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  return 'sistema web';
};

const getDeviceName = () => {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent || '';
      return `${detectBrowserName(userAgent)} en ${detectOperatingSystem(userAgent)}`;
    }
    return 'Navegador web';
  }

  return Device.deviceName || Device.modelName || `${Platform.OS} device`;
};

export const getAuthDeviceInfo = async () => {
  let deviceId = await AsyncStorage.getItem(AUTH_DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `auth-device-${randomId()}`;
    await AsyncStorage.setItem(AUTH_DEVICE_ID_KEY, deviceId);
  }

  return {
    deviceIdentifier: deviceId,
    deviceName: getDeviceName(),
    platform: Platform.OS.toUpperCase(),
    returnUrl: typeof window !== 'undefined' ? window.location.href : undefined,
  };
};
