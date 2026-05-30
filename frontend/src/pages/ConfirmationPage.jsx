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

import { Button } from "@/components/ui/button";
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
      <div className="h-full bg-brand-surface-light flex min-w-0 flex-col items-center justify-center p-8 text-center">
        <div className="flex min-w-0 h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm border border-brand-surface-border">
          <BedDouble className="h-9 w-9 text-brand-ink-muted shrink-0" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-brand-ink mb-2 break-words">{t('noBookingData')}</h1>
        <p className="text-sm font-medium text-brand-ink-muted mb-8 break-words">{t('completeBookingMsg')}</p>
        <Button variant="unstyled" size="none"
          type="button"
          onClick={() => navigate('/search')}
          className="rounded-full bg-brand-primary px-8 py-3 text-sm font-bold text-white transition-all shadow-md hover:shadow-lg hover:bg-brand-primary-deep focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
        >
          {t('goToRoomSearch')}
        </Button>
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
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex min-w-0 h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-success break-words">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                {t('bookingConfirmed')}
              </p>
              <p className="mt-2 text-2xl font-black break-words">
                <LtrText>{reservation.confirmationNumber}</LtrText>
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/75 break-words">{t('keepNumberMsg')}</p>
          <div className="mt-4">
            <StatusPill status={reservation.status} />
          </div>
        </div>
      </DashboardHero>

      <DashboardPanel
        title={t('reservationDetails')}
        description={t('bookingRecordedMsg')}
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl bg-brand-surface-light border border-brand-surface-border p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-ink-hint mb-2 break-words">
              {t('guestBadge')}
            </p>
            <p className="text-lg font-extrabold text-brand-ink break-words">{reservation.guestName}</p>
            <p className="text-sm font-medium text-brand-ink-muted mt-1 break-words">
              {reservation.guestEmail || t('common.noGuestEmailProvided')}
            </p>
          </div>

          <div className="rounded-2xl bg-brand-surface-light border border-brand-surface-border p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-ink-hint mb-2 break-words">
              {t('common.room')}
            </p>
            <p className="text-lg font-extrabold text-brand-ink break-words">
              {t('roomNumber', { number: reservation.roomNumber })}
            </p>
            <p className="text-sm font-medium text-brand-ink-muted mt-1 break-words">
              {translateKnownValue(room?.roomType?.name ?? reservation.roomTypeName, t)}
            </p>
            {amenities.length > 0 && (
              <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                {amenities.slice(0, 3).map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full border border-brand-surface-border bg-white px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold text-brand-ink shadow-sm break-words"
                  >
                    {translateKnownValue(amenity, t)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-brand-surface-light border border-brand-surface-border p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-ink-hint mb-4 break-words">
              {t('stayBadge')}
            </p>
            <div className="flex min-w-0 flex-col gap-2 text-sm font-medium text-brand-ink-muted">
              <div className="flex min-w-0 justify-between items-center">
                <span className="text-brand-ink-muted uppercase text-[10px] font-bold tracking-widest break-words">
                  {t('checkInLabelBase')}
                </span>
                <span className="font-extrabold text-brand-ink break-words">
                  {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex min-w-0 justify-between items-center">
                <span className="text-brand-ink-muted uppercase text-[10px] font-bold tracking-widest break-words">
                  {t('checkOutLabelBase')}
                </span>
                <span className="font-extrabold text-brand-ink break-words">
                  {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex min-w-0 justify-between border-t border-brand-surface-border pt-3 mt-1 items-center">
                <span className="text-brand-ink uppercase text-[10px] font-extrabold tracking-widest break-words">
                  {t('durationStr')}
                </span>
                <span className="font-extrabold text-brand-ink rounded-full border border-black px-3 py-1 text-xs break-words">
                  {t('nightsCount', { count: reservation.nights })}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-brand-surface-light border border-brand-surface-border p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-ink-hint mb-4 break-words">
              {t('pricingBadge')}
            </p>
            <div className="flex min-w-0 flex-col gap-2 text-sm font-medium">
              <div className="flex min-w-0 justify-between items-center">
                <span className="text-brand-ink-muted break-words">{t('ratePerNight')}</span>
                <span className="font-bold text-brand-ink break-words">
                  {formatLocalizedCurrency(reservation.roomRate, i18n.language)}
                </span>
              </div>
              <div className="flex min-w-0 justify-between items-center">
                <span className="text-brand-ink-muted break-words">{t('nightsLabel')}</span>
                <span className="font-bold text-brand-ink break-words">{reservation.nights}</span>
              </div>
              <div className="flex min-w-0 justify-between items-center">
                <span className="text-brand-ink-muted break-words">{t('subtotal')}</span>
                <span className="font-bold text-brand-ink break-words">
                  {formatLocalizedCurrency(reservation.subtotal, i18n.language)}
                </span>
              </div>
              <div className="flex min-w-0 justify-between items-center">
                <span className="text-brand-ink-muted break-words">{t('taxes15')}</span>
                <span className="font-bold text-brand-ink break-words">
                  {formatLocalizedCurrency(reservation.taxes, i18n.language)}
                </span>
              </div>
              <div className="flex min-w-0 justify-between items-center border-t border-brand-surface-border pt-3 mt-1">
                <span className="font-bold text-brand-ink text-lg break-words">{t('total')}</span>
                <span className="text-xl font-extrabold text-brand-ink break-words">
                  {formatLocalizedCurrency(reservation.totalPrice, i18n.language)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DashboardPanel>

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
        <Button variant="unstyled" size="none"
          type="button"
          onClick={() => window.print()}
          className="flex-1 inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-brand-surface-border py-4 text-sm font-bold text-brand-ink bg-white transition-all shadow-sm hover:shadow-md hover:bg-brand-surface-light focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          <Printer className="h-4 w-4 shrink-0" />
          {t('printConfirmation')}
        </Button>
        <Button variant="unstyled" size="none"
          type="button"
          onClick={() => navigate('/search')}
          className="flex-1 inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-brand-surface-border py-4 text-sm font-bold text-brand-ink bg-white transition-all shadow-sm hover:shadow-md hover:bg-brand-surface-light focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          <Search className="h-4 w-4 shrink-0" />
          {t('newSearch')}
        </Button>
        <Button variant="unstyled" size="none"
          type="button"
          onClick={() => navigate(dashboardPath)}
          className="min-w-0 flex-1 rounded-full bg-brand-primary py-4 text-sm font-extrabold text-white shadow-md transition-all hover:bg-brand-primary-deep hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
        >
          {t('goToDashboard')}
        </Button>
      </div>
    </div>
  );
}
