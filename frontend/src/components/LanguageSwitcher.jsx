import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('ar') ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    // Note: the i18n 'languageChanged' event listener in i18n.js handles the html dir toggle.
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="px-3 py-1 font-sans text-sm border border-border rounded-md hover:bg-muted"
    >
      {i18n.language.startsWith('ar') ? 'English' : 'عربي'}
    </button>
  );
};
