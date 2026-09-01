import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import pt from './pt.json';

export const translations = { es, en, fr, pt };

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸', available: true },
  { code: 'en', label: 'English', flag: '🇺🇸', available: true },
  { code: 'fr', label: 'Français', flag: '🇫🇷', available: true },
  { code: 'pt', label: 'Português', flag: '🇧🇷', available: true },
];