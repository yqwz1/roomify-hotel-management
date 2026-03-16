import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentLang = i18n?.language ?? 'en';
    const newLang = currentLang.startsWith('ar') ? 'en' : 'ar';
    i18n?.changeLanguage?.(newLang);
    // Note: the i18n 'languageChanged' event listener in i18n.js handles the html dir toggle.
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="px-4 py-2 font-sans font-medium text-sm text-black border border-zinc-200 rounded-full hover:bg-zinc-100 transition-colors"
    >
      {(i18n?.language ?? 'en').startsWith('ar') ? 'English' : 'عربي'}
    </button>
  );
};
