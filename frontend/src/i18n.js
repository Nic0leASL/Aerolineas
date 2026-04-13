import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esTranslation from './locales/es.json';
import enTranslation from './locales/en.json';
import ptTranslation from './locales/pt.json';
import frTranslation from './locales/fr.json';
import deTranslation from './locales/de.json';
import zhTranslation from './locales/zh.json';
import jaTranslation from './locales/ja.json';
import arTranslation from './locales/ar.json';
import trTranslation from './locales/tr.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            es: esTranslation,
            en: enTranslation,
            pt: ptTranslation,
            fr: frTranslation,
            de: deTranslation,
            zh: zhTranslation,
            ja: jaTranslation,
            ar: arTranslation,
            tr: trTranslation
        },
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
