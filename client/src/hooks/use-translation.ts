import { useTranslation as useI18nTranslation } from 'react-i18next';
import i18n from '../lib/i18n';

export function useTranslation() {
  // Sempre garante que o idioma está definido como português
  if (i18n.language !== 'pt-BR') {
    i18n.changeLanguage('pt-BR');
  }
  
  return useI18nTranslation();
}