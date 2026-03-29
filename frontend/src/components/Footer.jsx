import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatLocalizedDateTime } from '../utils/localization';

export default function Footer({ connectionState = 'disconnected', timestamp = null, loading = false }) {
  const { t, i18n } = useTranslation();
  const brandName = t('brandName');

  const statusKey = loading
    ? 'footer.connectionChecking'
    : connectionState === 'connected'
      ? 'footer.connectionConnected'
      : 'footer.connectionDisconnected';

  const statusTone = loading
    ? 'bg-zinc-700 text-zinc-100'
    : connectionState === 'connected'
      ? 'bg-emerald-100 text-emerald-950'
      : 'bg-rose-100 text-rose-950';

  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-sm">
          <p className="font-heading text-3xl font-black tracking-tighter">{brandName}</p>
          <p className="mt-3 text-sm font-medium leading-6 text-zinc-400">
            {t('footer.tagline')}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
              {t('footer.quickLinks')}
            </p>
            <div className="mt-4 space-y-2 text-sm font-medium text-zinc-300">
              <Link to="/" className="block transition hover:text-white">
                {t('homeNav')}
              </Link>
              <Link to="/bookings" className="block transition hover:text-white">
                {t('footer.bookingSupport')}
              </Link>
              <Link to="/login" className="block transition hover:text-white">
                {t('signIn')}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
              {t('footer.platform')}
            </p>
            <div className="mt-4 space-y-2 text-sm font-medium text-zinc-300">
              <p>{t('home.features.roomOpsTitle')}</p>
              <p>{t('home.features.reservationsTitle')}</p>
              <p>{t('home.features.billingTitle')}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-500">
              {t('footer.contact')}
            </p>
            <div className="mt-4 space-y-2 text-sm font-medium text-zinc-300">
              <p>{t('footer.contactEmailLabel')}: info@roomify.com</p>
              <p>{t('footer.contactPhoneLabel')}: +1 (555) 123-4567</p>
              <p>{t('footer.contactAddressLabel')}: {t('footer.contactAddressValue')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 text-sm text-zinc-400 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            {new Date().getFullYear()} {t('footer.copyright')}
          </p>

          <div className="flex flex-col items-start gap-2 lg:items-end">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone}`}>
                {t(statusKey)}
              </span>
              <span className="text-xs font-medium text-zinc-500">
                {t('footer.connectionLabel')}
              </span>
            </div>

            <p className="text-xs text-zinc-500">
              {timestamp
                ? t('footer.connectionVerifiedAt', {
                    time: formatLocalizedDateTime(timestamp, i18n.language),
                  })
                : t('footer.connectionTemporary')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
