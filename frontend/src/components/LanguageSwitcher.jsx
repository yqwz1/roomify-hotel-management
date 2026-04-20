import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const resolvedLanguage = i18n?.resolvedLanguage ?? i18n?.language ?? 'en';
  const isArabic = resolvedLanguage.startsWith('ar');

  const toggleLanguage = () => {
    i18n?.changeLanguage?.(isArabic ? 'en' : 'ar');
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={isArabic ? t('switchToEnglish') : t('switchToArabic')}
      className="rounded-full border border-zinc-200 px-3 py-2 font-sans text-xs font-medium text-black transition-colors hover:bg-zinc-100 sm:px-4 sm:text-sm"
    >
      {isArabic ? t('languageNameEnglish') : t('languageNameArabic')}
    </button>
  );
};
