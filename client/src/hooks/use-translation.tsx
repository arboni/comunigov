import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Hook para facilitar o uso de traduções na aplicação
 * 
 * Este hook é um wrapper em torno do useTranslation de react-i18next,
 * que fornece tradução baseada nos arquivos de localização.
 */
export function useTranslation() {
  const { t, i18n } = useI18nTranslation();
  
  /**
   * Altera o idioma da aplicação
   * @param lng O código do idioma (ex: 'pt-BR', 'en')
   */
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Salva a preferência de idioma no localStorage
    localStorage.setItem('i18nextLng', lng);
  };
  
  return { 
    t, 
    i18n,
    changeLanguage,
    currentLanguage: i18n.language
  };
}

/**
 * Obtém o idioma atual do navegador baseado no localStorage ou no navegador
 */
export function getCurrentLanguage(): string {
  return localStorage.getItem('i18nextLng') || navigator.language || 'pt-BR';
}