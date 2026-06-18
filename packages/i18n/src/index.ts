import i18n from 'i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import ta from './locales/ta.json';
import kn from './locales/kn.json';
import type { SupportedLocale } from '@newmomcircle/types';

export const resources = { en: { translation: en }, hi: { translation: hi }, te: { translation: te }, ta: { translation: ta }, kn: { translation: kn } } as const;

export type TranslationKey = keyof typeof en;

export function initI18n(lng: SupportedLocale = 'en') {
  if (i18n.isInitialized) {
    void i18n.changeLanguage(lng);
    return i18n;
  }
  void i18n.init({
    lng,
    fallbackLng: 'en',
    resources,
    interpolation: { escapeValue: false },
  });
  return i18n;
}

export { i18n };
export type { SupportedLocale };
