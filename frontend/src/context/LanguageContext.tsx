import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  type LanguageCode,
  type LanguageMeta,
  SUPPORTED_LANGUAGES,
  translations,
  type TranslationType,
} from '../i18n/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguageMeta: LanguageMeta;
  supportedLanguages: LanguageMeta[];
  t: TranslationType;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'fintracker_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === 'undefined') return 'vi';
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && (saved === 'vi' || saved === 'en' || saved === 'zh' || saved === 'ja' || saved === 'ko')) {
      return saved;
    }
    // Auto-detect browser language if available
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('ko')) return 'ko';
    if (browserLang.startsWith('en')) return 'en';
    return 'vi';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.warn('Could not persist language to localStorage:', e);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const currentLanguageMeta = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const t = useMemo(() => {
    return translations[language] || translations.vi;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageMeta,
        supportedLanguages: SUPPORTED_LANGUAGES,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
