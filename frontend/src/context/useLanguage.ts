import { createContext, useContext } from 'react';
import type {
  LanguageCode,
  LanguageMeta,
  TranslationType,
} from '../i18n/translations';

export interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguageMeta: LanguageMeta;
  supportedLanguages: LanguageMeta[];
  t: TranslationType;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
