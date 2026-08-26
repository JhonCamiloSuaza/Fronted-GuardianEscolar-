import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../translations';

const LANG_KEY = '@guardian_language';

const LanguageContext = createContext({
  lang: 'es',
  t: (key) => key,
  setLanguage: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('es');

  // Cargar idioma guardado al iniciar
  React.useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved && translations[saved]) {
        setLang(saved);
      }
    });
  }, []);

  const setLanguage = useCallback(async (code) => {
    if (translations[code] && !translations[code]._comingSoon) {
      setLang(code);
      await AsyncStorage.setItem(LANG_KEY, code);
    }
  }, []);

  // Función de traducción: t('key') → texto en el idioma activo
  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations['es']?.[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
