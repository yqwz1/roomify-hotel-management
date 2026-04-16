import { Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';

export default function GuestBillingStatus() {
  const { t } = useTranslation();
  const pageTx = 'guestBillingStatusPage';

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          {t('navBillingStatus')}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-black">
          {t('navBillingStatus')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
          {t(`${pageTx}.description`)}
        </p>
      </div>

      <EmptyState
        icon={Receipt}
        title={t(`${pageTx}.emptyTitle`)}
        message={t(`${pageTx}.emptyMessage`)}
      />

      <div className="flex flex-wrap gap-3">
        <Link
          to="/bookings"
          className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:text-black"
        >
          {t('navGetHelp')}
        </Link>
        <Link
          to="/guest/dashboard"
          className="inline-flex items-center rounded-full border border-zinc-900 bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
        >
          {t('navMyStay')}
        </Link>
      </div>
    </div>
  );
}
