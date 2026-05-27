import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BedDouble, CalendarRange, ChevronRight, ShieldCheck, Users } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DateRangePicker from '../components/DateRangePicker';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { Button } from '../components/ui/button';
import { getPublicRoomDetails, extractSearchError } from '../services/searchService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  translateKnownValue,
  translateWithFallback,
} from '../utils/localization';

const getDefaultDates = () => {
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  return { today, tomorrow: tomorrowDate.toISOString().split('T')[0] };
};

export default function RoomDetails() {
  const { roomId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { today, tomorrow } = useMemo(() => getDefaultDates(), []);
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || today);
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || tomorrow);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadRoom = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getPublicRoomDetails(roomId, { checkIn, checkOut });
        if (!ignore) {
          setRoom(result);
        }
      } catch (err) {
        if (!ignore) {
          setRoom(null);
          setError(extractSearchError(err));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadRoom();

    return () => {
      ignore = true;
    };
  }, [checkIn, checkOut, roomId]);

  const pricing = room?.pricing;
  const canBookRoom = room?.availableForRequestedStay === true;
  const amenities = room?.roomType?.amenities
    ? room.roomType.amenities.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  const syncDates = (nextCheckIn, nextCheckOut) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('checkIn', nextCheckIn);
    nextParams.set('checkOut', nextCheckOut);
    setSearchParams(nextParams, { replace: true });
  };

  if (loading) {
    return <LoadingState message={t('roomSearchPage.searchingRooms')} />;
  }

  if (error) {
    return (
      <ErrorState
        title={t('roomSearchPage.searchResultsTitle')}
        message={error}
        onRetry={() => navigate(0)}
      />
    );
  }

  if (!room) {
    return (
      <ErrorState
        title={t('roomSearchPage.searchResultsTitle')}
        message={t('bookRoomPage.noRoomMessage')}
        onRetry={() => navigate('/search')}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, 'roomSearchPage.viewDetailsCta', 'View details')}
        title={t('roomNumber', { number: room.roomNumber })}
        description={translateKnownValue(room.roomType?.name, t)}
        meta={[
          formatLocalizedDate(checkIn, i18n.language, { dateStyle: 'medium' }),
          formatLocalizedDate(checkOut, i18n.language, { dateStyle: 'medium' }),
          pricing?.total ? formatLocalizedCurrency(pricing.total, i18n.language) : t('common.pending'),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint">
            {t('bookRoomPage.snapshotTitle')}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('roomSearchPage.capacityLabel')}
              </p>
              <p className="mt-2 text-lg font-black">
                {t('upToGuests', { count: room.roomType?.maxGuests ?? 0 })}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('status')}
              </p>
              <p className="mt-2 text-lg font-black">
                {room.availabilityMessage ?? t('common.pending')}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <DashboardPanel
            title={t('common.stay')}
            description={t('roomSearchPage.searchControlsDescription')}
          >
            <div className="space-y-5">
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={(value) => {
                  setCheckIn(value);
                  syncDates(value, checkOut);
                }}
                onCheckOutChange={(value) => {
                  setCheckOut(value);
                  syncDates(checkIn, value);
                }}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                    {t('roomSearchPage.capacityLabel')}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-brand-ink">
                    <Users className="h-4 w-4 text-brand-ink-hint" />
                    {t('upToGuests', { count: room.roomType?.maxGuests ?? 0 })}
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                    {t('status')}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-brand-ink">
                    <CalendarRange className="h-4 w-4 text-brand-ink-hint" />
                    {room.availabilityMessage ?? t('common.pending')}
                  </p>
                </div>
              </div>

              {room.roomType?.description ? (
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light px-5 py-4 text-sm font-medium leading-6 text-brand-ink-muted">
                  {room.roomType.description}
                </div>
              ) : null}

              {amenities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-brand-surface-border bg-white px-3 py-1 text-xs font-bold text-brand-ink-muted"
                    >
                      {translateKnownValue(amenity, t)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title={translateWithFallback(t, 'bookRoomPage.bookingPolicyTitle', 'Booking policies')}
            description={translateWithFallback(
              t,
              'bookRoomPage.bookingPolicyDescription',
              'Review cancellation, payment, and arrival rules before you continue to the reservation flow.'
            )}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                <p className="text-sm font-black text-brand-ink">
                  {translateWithFallback(
                    t,
                    'bookRoomPage.cancellationPolicyTitle',
                    'Cancellation policy'
                  )}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-brand-ink-muted">
                  {translateWithFallback(
                    t,
                    'bookRoomPage.cancellationPolicyBody',
                    'Free cancellation windows and approval rules depend on stay dates and hotel policy.'
                  )}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                <p className="text-sm font-black text-brand-ink">
                  {translateWithFallback(t, 'bookRoomPage.paymentPolicyTitle', 'Payment policy')}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-brand-ink-muted">
                  {translateWithFallback(
                    t,
                    'bookRoomPage.paymentPolicyBody',
                    'Taxes and totals are calculated by the backend pricing engine and validated again at reservation time.'
                  )}
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4 md:col-span-2">
                <p className="inline-flex items-center gap-2 text-sm font-black text-brand-ink">
                  <ShieldCheck className="h-4 w-4" />
                  {translateWithFallback(t, 'bookRoomPage.checkInRulesTitle', 'Check-in and stay rules')}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-brand-ink-muted">
                  {translateWithFallback(
                    t,
                    'bookRoomPage.checkInRulesBody',
                    'Early arrivals, late departures, and operational room handoff remain managed by the hotel team.'
                  )}
                </p>
              </div>
            </div>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title={t('bookRoomPage.summaryTitle')}
            description={t('bookRoomPage.summaryDescription')}
          >
            <div className="space-y-5">
              <div className="flex h-44 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,#FBF9F4_0%,#FBF9F4_45%,#ede9e1_100%)]">
                <span className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-brand-ink shadow-sm">
                  <BedDouble className="h-7 w-7" />
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-brand-ink-muted">{t('bookRoomPage.ratePerNight')}</span>
                  <span className="font-bold text-brand-ink">
                    {formatLocalizedCurrency(pricing?.pricePerNight ?? 0, i18n.language)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-brand-ink-muted">{t('subtotal')}</span>
                  <span className="font-bold text-brand-ink">
                    {formatLocalizedCurrency(pricing?.subtotal ?? 0, i18n.language)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-brand-ink-muted">{t('taxes15')}</span>
                  <span className="font-bold text-brand-ink">
                    {formatLocalizedCurrency(pricing?.vatAmount ?? 0, i18n.language)}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-brand-surface-border pt-4">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-brand-ink-muted">
                    {t('total')}
                  </span>
                  <span className="text-2xl font-black text-brand-ink">
                    {formatLocalizedCurrency(pricing?.total ?? 0, i18n.language)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  type="button"
                  className="h-auto flex-1 rounded-full border-brand-surface-border py-4"
                  onClick={() => navigate('/search')}
                >
                  {t('backToRoomSearch')}
                </Button>
                {canBookRoom ? (
                  <Button
                    type="button"
                    className="h-auto flex-1 rounded-full py-4"
                    onClick={() =>
                      navigate(`/book?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`, {
                        state: { room, checkIn, checkOut },
                      })
                    }
                  >
                    {t('roomSearchPage.bookRoomCta')}
                    <ChevronRight className="ms-2 h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
