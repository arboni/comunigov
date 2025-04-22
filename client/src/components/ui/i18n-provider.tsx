import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// Interface for our i18n context
interface I18nContextType {
  getLocalizedText: (key: string) => string;
}

// Create the context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Custom hook to use the i18n context
export function useI18nContext() {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18nContext must be used within an I18nProvider');
  }
  
  return context;
}

// I18n Provider component
export function I18nProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();

  // Garante que o idioma seja sempre português
  React.useEffect(() => {
    if (i18n.language !== 'pt-BR') {
      i18n.changeLanguage('pt-BR');
    }
  }, [i18n]);
  
  // Function to get localized text
  const getLocalizedText = (key: string): string => {
    switch (key) {
      // Common UI component texts
      case 'Cancel':
        return t('common.cancel');
      case 'Continue':
        return t('common.confirm');
      case 'OK':
        return t('common.ok');
      case 'Submit':
        return t('common.submit');
      case 'Close':
        return t('common.close');
      case 'Delete':
        return t('common.delete');
      case 'Edit':
        return t('common.edit');
      case 'Save':
        return t('common.save');
      // Default case returns the original text
      default:
        return key;
    }
  };
  
  return (
    <I18nContext.Provider value={{ getLocalizedText }}>
      {children}
    </I18nContext.Provider>
  );
}