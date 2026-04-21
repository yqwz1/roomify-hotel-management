import { useEffect, useState } from 'react';
import { ArrowRight, BedDouble, CalendarDays, Receipt, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { reservationStatusRules } from '../domain/reservations/statusRules';
import {
  extractGuestReservationError,
  getGuestReservations,
} from '../services/guestReservationService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getPaymentStatusLabel,
  getReservationStatusLabel,
  translateWithFallback,
} from '../utils/localization';

export default function GuestBookings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadReservations = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getGuestReservations();
        if (ignore) return;
        setReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        if (ignore) return;
        setReservations([]);
        setError(extractGuestReservationError(err));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadReservations();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <LoadingState
          message={translateWithFallback(t, 'guestBookingsPage.loading', 'Loading your bookings...')}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <ErrorState
          title={translateWithFallback(t, 'guestBookingsPage.errorTitle', 'Bookings unavailable')}
          message={error}
          onRetry={() => setReloadToken((current) => current + 1)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, 'guestBookingsPage.eyebrow', 'Guest portal')}
        title={translateWithFallback(t, 'guestBookingsPage.title', 'My Bookings')}
        description={translateWithFallback(
          t,
          'guestBookingsPage.description',
          'Review current and past stays, then open any reservation for payment summary or guest-side updates.'
        )}
        meta={[
          translateWithFallback(
            t,
            'guestBookingsPage.countMeta',
            '{{count}} reservations linked to your account',
            { count: reservations.length }
          ),
        ]}
      />

      <DashboardPanel
        title={translateWithFallback(t, 'guestBookingsPage.listTitle', 'Reservations')}
        description={translateWithFallback(
          t,
          'guestBookingsPage.listDescription',
          'Upcoming stays appear first so the guest journey is easy to demo live.'
        )}
      >
        {reservations.length === 0 ? (
          <div className="space-y-5">
            <EmptyState
              icon={BedDouble}
              title={translateWithFallback(t, 'guestBookingsPage.emptyTitle', 'No bookings yet')}
              message={translateWithFallback(
                t,
                'guestBookingsPage.emptyMessage',
                'Browse available rooms and create your first reservation from the guest portal.'
              )}
            />
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
              >
                <Search className="h-4 w-4" />
                {translateWithFallback(t, 'navBrowseRooms', 'Browse Rooms')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {reservations.map((reservation) => {
              const confirmation = reservation.confirmationNumber || reservation.confirmation || '-';
              const canModify = reservationStatusRules.canModify(reservation.status);
              const canCancel = reservationStatusRules.canCancel(reservation.status);

              return (
                <article
                  key={`${confirmation}-${reservation.checkInDate}`}
                  className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black tracking-tight text-zinc-950">
                        {confirmation}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        {reservation.roomTypeName || reservation.roomType || t('common.room')}
                        {reservation.roomNumber ? ` · ${t('roomNumber', { number: reservation.roomNumber })}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-600">
                        {getReservationStatusLabel(reservation.status, t)}
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-600">
                        {getPaymentStatusLabel(reservation.paymentStatus, t)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                        {translateWithFallback(t, 'common.stay', 'Stay')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-zinc-950">
                        {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                          dateStyle: 'medium',
                        })}{' '}
                        -{' '}
                        {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                          dateStyle: 'medium',
                        })}
                      </p>
                    </div>
                    <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                        {translateWithFallback(t, 'common.stayTotal', 'Stay total')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-zinc-950">
                        {formatLocalizedCurrency(reservation.totalAmount ?? reservation.totalPrice, i18n.language)}
                      </p>
                    </div>
                    <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                        {translateWithFallback(t, 'checkoutPage.outstandingBalanceLabel', 'Outstanding balance')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-zinc-950">
                        {formatLocalizedCurrency(reservation.outstandingBalance ?? 0, i18n.language)}
                      </p>
                    </div>
                    <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                        {translateWithFallback(t, 'guestBookingsPage.allowedActions', 'Allowed actions')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-zinc-950">
                        {[canModify ? translateWithFallback(t, 'modifyReservation', 'Modify') : null, canCancel ? translateWithFallback(t, 'cancelReservation', 'Cancel') : null]
                          .filter(Boolean)
                          .join(' · ') || translateWithFallback(t, 'common.view', 'View')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500">
                      <Receipt className="h-4 w-4" />
                      {reservation.invoiceNumber || translateWithFallback(t, 'common.pending', 'Pending')}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/guest/bookings/${confirmation}`)}
                      className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                    >
                      {translateWithFallback(t, 'guestBookingsPage.viewDetailsCta', 'View details')}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
