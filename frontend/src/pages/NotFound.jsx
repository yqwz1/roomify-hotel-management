import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-zinc-50 p-8 text-center">
      <h1 className="mb-4 text-8xl font-extrabold tracking-tighter text-black">404</h1>
      <p className="mb-10 text-lg font-bold uppercase tracking-widest text-zinc-500">
        {t('notFoundPage.title')}
      </p>
      <Link
        to="/"
        className="rounded-full bg-black px-8 py-4 text-sm font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
      >
        {t('notFoundPage.action')}
      </Link>
    </div>
  );
}
