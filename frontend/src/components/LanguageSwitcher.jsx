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
      className="rounded-full border border-brand-surface-border bg-brand-card/70 px-3 py-1.5 font-sans text-xs font-bold text-brand-ink-muted backdrop-blur-sm transition-colors hover:border-brand-primary/30 hover:bg-brand-primary-tint/60 hover:text-brand-primary-deep sm:px-3.5 sm:py-2 sm:text-[13px]"
    >
      {isArabic ? t('languageNameEnglish') : t('languageNameArabic')}
    </button>
  );
};
