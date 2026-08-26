import { storage } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNTS_KEY = 'gps_guardian_accounts';

// ─── Helpers de cuentas guardadas ───────────────────────────────────────────
const getAccounts = async () => {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    // Cuenta demo pre-cargada para pruebas
    const hasDemo = saved.some(a => a.email === 'demo@guardian.com');
    if (!hasDemo) {
      saved.push({ id: 0, email: 'demo@guardian.com', password: 'Demo@1234', name: 'Usuario Demo', role: 'PARENT' });
    }
    return saved;
  } catch {
    return [{ id: 0, email: 'demo@guardian.com', password: 'Demo@1234', name: 'Usuario Demo', role: 'PARENT' }];
  }
};

const saveAccounts = async (accounts) => {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

// ─── Servicio de autenticación ───────────────────────────────────────────────
export const authService = {

  /**
   * Update 2FA: activa o desactiva el 2FA para el usuario
   */
  update2FA: async (email, enabled, method = 'email') => {
    const accounts = await getAccounts();
    const normalizedEmail = email.trim().toLowerCase();
    const accountIndex = accounts.findIndex(a => a.email.toLowerCase() === normalizedEmail);

    if (accountIndex !== -1) {
      accounts[accountIndex].twoFAEnabled = enabled;
      accounts[accountIndex].twoFAMethod = method;
      await saveAccounts(accounts);
      return true;
    }
    throw new Error('Usuario no encontrado');
  },

  /**
   * Login: valida email y contraseña.
   * Si tiene 2FA activo, devuelve un flag para que el UI pida el código.
   */
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const accounts = await getAccounts();
          const normalizedEmail = email.trim().toLowerCase();

          const account = accounts.find(
            a => a.email.toLowerCase() === normalizedEmail
          );

          if (!account) {
            reject(new Error('No existe una cuenta con ese correo electrónico.'));
            return;
          }

          if (account.password !== password) {
            reject(new Error('La contraseña es incorrecta. Por favor inténtalo de nuevo.'));
            return;
          }

          // SI TIENE 2FA ACTIVO, NO INICIAMOS SESIÓN AÚN
          if (account.twoFAEnabled) {
            resolve({
              requires2FA: true,
              method: account.twoFAMethod || 'email',
              email: account.email
            });
            return;
          }

          const fakeToken = `mock_token_${account.id}_${Date.now()}`;
          const sessionUser = {
            id: account.id,
            email: account.email,
            name: account.name,
            role: account.role,
            phone: account.phone || '',
            twoFAEnabled: account.twoFAEnabled || false,
            twoFAMethod: account.twoFAMethod || 'email'
          };

          await storage.setToken(fakeToken);
          await storage.setUser(sessionUser);

          resolve({ token: fakeToken, user: sessionUser });
        } catch (error) {
          reject(error);
        }
      }, 800);
    });
  },

  /**
   * Finalizar Login 2FA: Una vez validado el código en el UI.
   */
  complete2FALogin: async (email) => {
    const accounts = await getAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());

    if (!account) throw new Error('Usuario no encontrado');

    const fakeToken = `mock_token_2fa_${account.id}_${Date.now()}`;
    const sessionUser = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      phone: account.phone || '',
      twoFAEnabled: account.twoFAEnabled || false,
      twoFAMethod: account.twoFAMethod || 'email'
    };

    await storage.setToken(fakeToken);
    await storage.setUser(sessionUser);

    return { token: fakeToken, user: sessionUser };
  },

  /**
   * Register: guarda la cuenta nueva en AsyncStorage.
   * Lanza error si el correo ya está registrado.
   */
  register: async ({ name, email, password, phone }) => {
    const accounts = await getAccounts();
    const normalizedEmail = email.trim().toLowerCase();

    const exists = accounts.find(a => a.email.toLowerCase() === normalizedEmail);
    if (exists) {
      throw new Error('Ya existe una cuenta con ese correo electrónico.');
    }

    const newAccount = {
      id: Date.now(),
      email: normalizedEmail,
      password,
      name: name.trim(),
      phone: phone || '',
      role: 'PARENT',
      twoFAEnabled: false,
      twoFAMethod: 'email'
    };

    accounts.push(newAccount);
    await saveAccounts(accounts);

    return { success: true, user: { id: newAccount.id, email: newAccount.email, name: newAccount.name, phone: newAccount.phone } };
  },

  /**
   * Update Password: cambia la contraseña validando la actual
   */
  updatePassword: async (email, currentPassword, newPassword) => {
    const accounts = await getAccounts();
    const normalizedEmail = email.trim().toLowerCase();

    const accountIndex = accounts.findIndex(a => a.email.toLowerCase() === normalizedEmail);
    if (accountIndex === -1) {
      throw new Error('Usuario no encontrado.');
    }

    if (accounts[accountIndex].password !== currentPassword) {
      throw new Error('La contraseña actual es incorrecta.');
    }

    accounts[accountIndex].password = newPassword;
    await saveAccounts(accounts);
    return true;
  },

  /**
   * Update Profile: actualiza nombre y teléfono del usuario
   */
  updateProfile: async (email, newName, newPhone) => {
    const accounts = await getAccounts();
    const normalizedEmail = email.trim().toLowerCase();
    const accountIndex = accounts.findIndex(a => a.email.toLowerCase() === normalizedEmail);

    if (accountIndex !== -1) {
      accounts[accountIndex].name = newName;
      accounts[accountIndex].phone = newPhone;
      await saveAccounts(accounts);
      return { ...accounts[accountIndex] };
    }
    throw new Error('Usuario no encontrado');
  },

  logout: async () => {
    await storage.clearAll();
  },

  refreshToken: async () => {
    throw new Error('Refresh token no implementado aún');
  },
};