import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import hi from './locales/hi.json';
import gu from './locales/gu.json';

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'gu'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function deviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code) ? (code as AppLanguage) : 'en';
}

// Hindi and Gujarati files are partial for now; missing keys fall back to English.
// eslint-disable-next-line import/no-named-as-default-member -- i18n.use() is the documented i18next setup API
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, gu: { translation: gu } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
