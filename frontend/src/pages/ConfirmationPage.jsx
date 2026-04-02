import { BedDouble, CheckCircle2, Printer, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import StatusPill from '../components/StatusPill';
import { LtrText } from '../components/LtrText';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  translateKnownValue,
} from '../utils/localization';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();
  const { t, i18n } = useTranslation();

  const reservation = location.state?.reservation ?? null;
  const room = location.state?.room ?? null;

  const dashboardPath = hasRole('ROLE_MANAGER')
    ? '/manager/dashboard'
    : hasRole('ROLE_STAFF')
      ? '/staff/dashboard'
      : '/guest/dashboard';

  if (!reservation) {
    return (
      <div className="h-full bg-zinc-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm border border-zinc-200">
          <BedDouble className="h-9 w-9 text-zinc-500" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-black mb-2">{t('noBookingData')}</h1>
        <p className="text-sm font-medium text-zinc-500 mb-8">{t('completeBookingMsg')}</p>
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="rounded-full bg-black px-8 py-3 text-sm font-bold text-white transition-all shadow-md hover:shadow-lg hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          {t('goToRoomSearch')}
        </button>
      </div>
    );
  }

  const amenities = room?.roomType?.amenities
    ? room.roomType.amenities.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={t('bookingConfirmed')}
        title={t('confirmationNumber')}
        description={t('bookingRecordedMsg')}
        meta={[
          reservation.confirmationNumber,
          t('roomNumber', { number: reservation.roomNumber }),
          t('nightsCount', { count: reservation.nights }),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-300">
                {t('bookingConfirmed')}
              </p>
              <p className="mt-2 text-2xl font-black">
                <LtrText>{reservation.confirmationNumber}</LtrText>
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/75">{t('keepNumberMsg')}</p>
          <div className="mt-4">
            <StatusPill status={reservation.status} />
          </div>
        </div>
      </DashboardHero>

      <DashboardPanel
        title={t('reservationDetails')}
        description={t('bookingRecordedMsg')}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              {t('guestBadge')}
            </p>
            <p className="text-lg font-extrabold text-black">{reservation.guestName}</p>
            <p className="text-sm font-medium text-zinc-500 mt-1">
              {reservation.guestEmail || t('common.noGuestEmailProvided')}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              {t('common.room')}
            </p>
            <p className="text-lg font-extrabold text-black">
              {t('roomNumber', { number: reservation.roomNumber })}
            </p>
            <p className="text-sm font-medium text-zinc-500 mt-1">
              {translateKnownValue(room?.roomType?.name ?? reservation.roomTypeName, t)}
            </p>
            {amenities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {amenities.slice(0, 3).map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold text-black shadow-sm"
                  >
                    {translateKnownValue(amenity, t)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
              {t('stayBadge')}
            </p>
            <div className="flex flex-col gap-2 text-sm font-medium text-zinc-600">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">
                  {t('checkInLabelBase')}
                </span>
                <span className="font-extrabold text-black">
                  {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">
                  {t('checkOutLabelBase')}
                </span>
                <span className="font-extrabold text-black">
                  {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-3 mt-1 items-center">
                <span className="text-black uppercase text-[10px] font-extrabold tracking-widest">
                  {t('durationStr')}
                </span>
                <span className="font-extrabold text-black rounded-full border border-black px-3 py-1 text-xs">
                  {t('nightsCount', { count: reservation.nights })}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
              {t('pricingBadge')}
            </p>
            <div className="flex flex-col gap-2 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">{t('ratePerNight')}</span>
                <span className="font-bold text-black">
                  {formatLocalizedCurrency(reservation.roomRate, i18n.language)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">{t('nightsLabel')}</span>
                <span className="font-bold text-black">{reservation.nights}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">{t('subtotal')}</span>
                <span className="font-bold text-black">
                  {formatLocalizedCurrency(reservation.subtotal, i18n.language)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">{t('taxes10')}</span>
                <span className="font-bold text-black">
                  {formatLocalizedCurrency(reservation.taxes, i18n.language)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-zinc-200 pt-3 mt-1">
                <span className="font-bold text-black text-lg">{t('total')}</span>
                <span className="text-xl font-extrabold text-black">
                  {formatLocalizedCurrency(reservation.totalPrice, i18n.language)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DashboardPanel>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 py-4 text-sm font-bold text-black bg-white transition-all shadow-sm hover:shadow-md hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        >
          <Printer className="h-4 w-4" />
          {t('printConfirmation')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 py-4 text-sm font-bold text-black bg-white transition-all shadow-sm hover:shadow-md hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        >
          <Search className="h-4 w-4" />
          {t('newSearch')}
        </button>
        <button
          type="button"
          onClick={() => navigate(dashboardPath)}
          className="flex-1 rounded-full bg-black py-4 text-sm font-extrabold text-white shadow-md transition-all hover:bg-zinc-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          {t('goToDashboard')}
        </button>
      </div>
    </div>
  );
}
