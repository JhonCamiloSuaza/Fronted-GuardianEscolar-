import { storage } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNTS_KEY = 'gps_guardian_accounts';
const RECOVERY_RATE_KEY = 'gps_guardian_recovery_attempts';
const RECOVERY_SESSION_KEY = 'gps_guardian_recovery_session';
const RECOVERY_WINDOW_MS = 15 * 60 * 1000;
const RECOVERY_MAX_ATTEMPTS = 5;
const RECOVERY_OTP_TTL_MS = 5 * 60 * 1000;
const RECOVERY_OTP_MAX_ATTEMPTS = 5;
const RECOVERY_DEMO_CODE = '847291';
const RECOVERY_GENERIC_MESSAGE = 'Si existe una cuenta asociada, hemos enviado las instrucciones para recuperar tu contraseña.';

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
   * Si tiene 2FA activo, devuelve un flag para que el UI pida el codigo.
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
   * Finalizar Login 2FA: Una vez validado el codigo en el UI.
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
   * Register: guardar? la cuenta nueva en AsyncStorage.
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
   * Detecta automaticamente si el dato ingresado corresponde a correo o telefono registrado.
   */
  findRecoveryContact: async (contact) => {
    const accounts = await getAccounts();
    const normalized = contact.trim().toLowerCase();
    const onlyDigits = contact.replace(/\D/g, '');

    const account = accounts.find((item) => {
      const accountDigits = (item.phone || '').replace(/\D/g, '');
      return item.email.toLowerCase() === normalized || (onlyDigits.length >= 7 && accountDigits.endsWith(onlyDigits));
    });

    if (!account) {
      throw new Error('No existe una cuenta asociada a ese correo o telefono.');
    }

    return {
      exists: true,
      method: account.email.toLowerCase() === normalized ? 'email' : 'phone',
      email: account.email,
      phone: account.phone || '',
    };
  },

  /**
   * Solicita recuperacion sin revelar si el usuario existe.
   * Detecta correo/telefono internamente y aplica un rate limit local báb?sico.
   */
  requestPasswordRecovery: async (contact) => {
    const normalizedContact = contact.trim().toLowerCase();
    const now = Date.now();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedContact);
    const phoneDigits = contact.replace(/\D/g, '');
    const isPhone = phoneDigits.length >= 7 && phoneDigits.length <= 15;

    if (!isEmail && !isPhone) {
      throw new Error('Ingresa un correo electrónico o teléfono válido.');
    }

    const attemptsRaw = await AsyncStorage.getItem(RECOVERY_RATE_KEY);
    const attempts = attemptsRaw ? JSON.parse(attemptsRaw) : {};
    const rateKey = isEmail ? normalizedContact : phoneDigits;
    const recentAttempts = (attempts[rateKey] || []).filter((timestamp) => now - timestamp < RECOVERY_WINDOW_MS);

    if (recentAttempts.length >= RECOVERY_MAX_ATTEMPTS) {
      throw new Error('Demasiados intentos. Inténtalo nuevamente en unos minutos.');
    }

    attempts[rateKey] = [...recentAttempts, now];
    await AsyncStorage.setItem(RECOVERY_RATE_KEY, JSON.stringify(attempts));

    const startedAt = Date.now();
    let recoverySession = null;
    try {
      const accounts = await getAccounts();
      const account = accounts.find((item) => {
        const accountDigits = (item.phone || '').replace(/\D/g, '');
        return item.email.toLowerCase() === normalizedContact || (isPhone && accountDigits.endsWith(phoneDigits));
      });

      if (account) {
        const accountHasEmail = Boolean(account.email);
        const accountHasPhone = Boolean((account.phone || '').replace(/\D/g, ''));
        const preferredMethod = account.recoveryPriority?.[0] || account.recoveryMethod || account.twoFAMethod || 'email';
        const method = preferredMethod === 'phone' && accountHasPhone ? 'phone' : accountHasEmail ? 'email' : accountHasPhone ? 'phone' : null;

        recoverySession = {
          accountId: account.id,
          contactKey: rateKey,
          code: RECOVERY_DEMO_CODE,
          method,
          expiresAt: now + RECOVERY_OTP_TTL_MS,
          attempts: 0,
          verified: false,
          used: false,
        };
      }
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 700) {
        await new Promise(resolve => setTimeout(resolve, 700 - elapsed));
      }
    }

    await AsyncStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify(recoverySession || {
      accountId: null,
      contactKey: rateKey,
      code: null,
      method: null,
      expiresAt: now + RECOVERY_OTP_TTL_MS,
      attempts: 0,
      verified: false,
      used: false,
    }));

    return { success: true, message: RECOVERY_GENERIC_MESSAGE };
  },

  getRecoverySession: async () => {
    const raw = await AsyncStorage.getItem(RECOVERY_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  verifyRecoveryCode: async (code) => {
    const session = await authService.getRecoverySession();
    const now = Date.now();

    if (!session || session.used) {
      throw new Error('Código inválido');
    }

    if (now > session.expiresAt) {
      await AsyncStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify({ ...session, used: true }));
      throw new Error('El código ha expirado');
    }

    if (session.attempts >= RECOVERY_OTP_MAX_ATTEMPTS) {
      await AsyncStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify({ ...session, used: true }));
      throw new Error('Código inválido');
    }

    const nextSession = { ...session, attempts: session.attempts + 1 };
    if (!session.accountId || code !== session.code) {
      await AsyncStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify(nextSession));
      throw new Error('Código inválido');
    }

    await AsyncStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify({
      ...nextSession,
      verified: true,
      code: null,
    }));

    return { success: true };
  },

  completeRecoveryLogin: async () => {
    const session = await authService.getRecoverySession();
    if (!session?.verified || session.used || !session.accountId) {
      throw new Error('Verificacion requerida');
    }

    const accounts = await getAccounts();
    const account = accounts.find(a => a.id === session.accountId);
    if (!account) throw new Error('Verificacion requerida');

    const fakeToken = `mock_recovery_${account.id}_${Date.now()}`;
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
    await AsyncStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify({ ...session, used: true }));

    return { token: fakeToken, user: sessionUser };
  },

  resetRecoveredPassword: async (newPassword) => {
    const session = await authService.getRecoverySession();
    if (!session?.verified || session.used || !session.accountId) {
      throw new Error('Verificacion requerida');
    }

    const accounts = await getAccounts();
    const accountIndex = accounts.findIndex(a => a.id === session.accountId);
    if (accountIndex === -1) throw new Error('Verificacion requerida');

    accounts[accountIndex].password = newPassword;
    await saveAccounts(accounts);
    await AsyncStorage.setItem(RECOVERY_SESSION_KEY, JSON.stringify({ ...session, used: true }));

    return true;
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
   * Valida la contrase?a actual sin modificar la cuenta.
   */
  validatePassword: async (email, currentPassword) => {
    const accounts = await getAccounts();
    const normalizedEmail = email.trim().toLowerCase();
    const account = accounts.find(a => a.email.toLowerCase() === normalizedEmail);

    if (!account) throw new Error('Usuario no encontrado.');
    if (account.password !== currentPassword) throw new Error('La contrase?a actual es incorrecta.');
    return true;
  },

  /**
   * Cambia el correo solo despu?s de validar la contrase?a actual.
   */
  updateEmail: async (email, currentPassword, newEmail) => {
    const accounts = await getAccounts();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedNewEmail = newEmail.trim().toLowerCase();
    const accountIndex = accounts.findIndex(a => a.email.toLowerCase() === normalizedEmail);

    if (accountIndex === -1) throw new Error('Usuario no encontrado.');
    if (accounts[accountIndex].password !== currentPassword) throw new Error('La contrase?a actual es incorrecta.');
    if (accounts.some((item, index) => index !== accountIndex && item.email.toLowerCase() === normalizedNewEmail)) {
      throw new Error('Ya existe una cuenta con ese correo electr?nico.');
    }

    accounts[accountIndex].email = normalizedNewEmail;
    await saveAccounts(accounts);
    return { ...accounts[accountIndex] };
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

