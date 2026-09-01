import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { translations } from '../translations';

const LANG_KEY = '@guardian_language';

const LanguageContext = createContext({
  lang: 'es',
  t: (key) => key,
  setLanguage: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('es');

  React.useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved && translations[saved]) {
        setLang(saved);
      }
    });
  }, []);

  const setLanguage = useCallback(async (code) => {
    if (translations[code]) {
      setLang(code);
      await AsyncStorage.setItem(LANG_KEY, code);
    }
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations.es?.[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
