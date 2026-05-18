import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-brand-surface p-8 text-center">
      <h1 className="mb-4 text-8xl font-extrabold tracking-tighter text-brand-ink">404</h1>
      <p className="mb-10 text-lg font-bold uppercase tracking-widest text-brand-ink-muted">
        {t('notFoundPage.title')}
      </p>
      <Link
        to="/"
        className="rounded-full bg-brand-primary px-8 py-4 text-sm font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-primary-deep hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
      >
        {t('notFoundPage.action')}
      </Link>
    </div>
  );
}
