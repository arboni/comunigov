import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import todos os arquivos de tradução
import translationEN from '../locales/en/translation.json';
import translationPTBR from '../locales/pt-BR/translation.json';

// Os recursos de tradução
const resources = {
  en: {
    translation: translationEN
  },
  'pt-BR': {
    translation: translationPTBR
  }
};

i18n
  // Detecta automaticamente o idioma do usuário
  .use(LanguageDetector)
  // Passa o i18n para o react-i18next
  .use(initReactI18next)
  // inicializa i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false, // desativa o debug para evitar muitos logs

    interpolation: {
      escapeValue: false, // não escapa HTML em componentes React
    },
    
    // Configuração para detectar o idioma
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;