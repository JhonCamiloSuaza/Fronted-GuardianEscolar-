export const validators = {
  email: (email) => {
    if (!email) return 'El correo es requerido';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email.trim())) return 'El correo no es válido';
    return null;
  },

  password: (password) => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'Debe incluir una mayúscula';
    if (!/[a-z]/.test(password)) return 'Debe incluir una minúscula';
    if (!/[0-9]/.test(password)) return 'Debe incluir un número';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Debe incluir un carácter especial';
    return null;
  },

  nombre: (nombre) => {
    if (!nombre) return 'El nombre es requerido';
    if (nombre.trim().length < 2) return 'El nombre es muy corto';
    return null;
  },

  phone: (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return 'El teléfono es requerido';
    if (digits.length < 7 || digits.length > 15) return 'El teléfono no es válido';
    return null;
  },

  age: (age) => {
    const value = Number(age);
    if (!String(age || '').trim()) return 'La edad es requerida';
    if (!Number.isInteger(value) || value < 1 || value > 100) return 'La edad debe estar entre 1 y 100';
    return null;
  },

  confirmPassword: (password, confirm) => {
    if (!confirm) return 'Confirma tu contraseña';
    if (password !== confirm) return 'Las contraseñas no coinciden';
    return null;
  },
};
