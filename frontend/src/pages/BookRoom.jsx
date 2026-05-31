import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  CheckCircle2,
  Globe2,
  IdCard,
  Lock,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DateRangePicker from '../components/DateRangePicker';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  createReservation,
  createGuestReservation,
  extractReservationError,
  isConflictError,
} from '../services/reservationService';
import { getPublicRoomDetails, extractSearchError } from '../services/searchService';
import { useAuth } from '../context/AuthProvider';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  translateKnownValue,
  translateWithFallback,
} from '../utils/localization';

const createDefaultDates = () => {
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  return { today, tomorrow: tomorrowDate.toISOString().split('T')[0] };
};

const createGuestDraft = (user, shouldPrefillIdentity = false) => ({
  name: shouldPrefillIdentity ? (user?.username ?? '') : '',
  email: shouldPrefillIdentity ? (user?.email ?? '') : '',
  phone: '',
  idNumber: '',
  nationality: '',
});

function Field({
  id,
  label,
  required = false,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  disabled = false,
  locked = false,
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint"
      >
        {label}
        {required ? ' *' : ''}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink-hint shrink-0" />
        {locked ? (
          <Lock className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink-hint shrink-0" />
        ) : null}
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light ps-11 pe-10 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 disabled:cursor-not-allowed disabled:bg-brand-primary-tint disabled:text-brand-ink-muted"
        />
      </div>
    </div>
  );
}

export default function BookRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, hasRole } = useAuth();
  const { t, i18n } = useTranslation();
  const { today, tomorrow } = useMemo(() => createDefaultDates(), []);

  const roomId = Number(searchParams.get('roomId') ?? location.state?.room?.id ?? 0);
  const initialCheckIn = searchParams.get('checkIn') ?? location.state?.checkIn ?? today;
  const initialCheckOut = searchParams.get('checkOut') ?? location.state?.checkOut ?? tomorrow;
  const isGuest = hasRole('ROLE_GUEST');

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guest, setGuest] = useState(() => createGuestDraft(user, isGuest));
  const [room, setRoom] = useState(location.state?.room ?? null);
  const [loadingRoom, setLoadingRoom] = useState(Boolean(roomId));
  const [loadError, setLoadError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [conflictError, setConflictError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isGuest) {
      return;
    }
    setGuest((current) => ({
      ...current,
      name: current.name || user?.username || '',
      email: user?.email || current.email,
    }));
  }, [isGuest, user?.email, user?.username]);

  useEffect(() => {
    if (!roomId) {
      setLoadingRoom(false);
      setRoom(null);
      return;
    }

    let ignore = false;

    const loadRoom = async () => {
      setLoadingRoom(true);
      setLoadError('');

      try {
        const result = await getPublicRoomDetails(roomId, { checkIn, checkOut });
        if (!ignore) {
          setRoom(result);
        }
      } catch (err) {
        if (!ignore) {
          setRoom(null);
          setLoadError(extractSearchError(err));
        }
      } finally {
        if (!ignore) {
          setLoadingRoom(false);
        }
      }
    };

    loadRoom();

    return () => {
      ignore = true;
    };
  }, [checkIn, checkOut, roomId]);
  const pricing = room?.pricing ?? null;
  const nights = pricing?.nights ?? 0;

  const setField = (field, value) => {
    setGuest((prev) => ({ ...prev, [field]: value }));
  };

  const handleGoToLogin = () => {
    navigate('/login', {
      state: {
        from: {
          pathname: '/book',
          search: `?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}`,
        },
      },
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError('');
    setConflictError('');

    if (!isAuthenticated) {
      handleGoToLogin();
      return;
    }

    if (!roomId || !room) {
      setValidationError(t('noRoomError'));
      return;
    }

    if (!room.availableForRequestedStay) {
      setValidationError(
        translateWithFallback(
          t,
          'bookRoomPage.unavailableMessage',
          'This room is no longer available for the selected stay.'
        )
      );
      return;
    }

    if (
      !guest.name.trim() ||
      !guest.email.trim() ||
      !guest.phone.trim() ||
      !guest.idNumber.trim() ||
      !guest.nationality.trim()
    ) {
      setValidationError(
        translateWithFallback(
          t,
          'bookRoomPage.completeGuestProfile',
          'Complete the guest profile before submitting the reservation.'
        )
      );
      return;
    }

    setSubmitting(true);

    try {
      const reservationPayload = {
        roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guest: {
          name: guest.name.trim(),
          email: isGuest ? (user?.email ?? guest.email.trim()) : guest.email.trim(),
          phone: guest.phone.trim(),
          idNumber: guest.idNumber.trim(),
          nationality: guest.nationality.trim(),
        },
      };
      const reservation = isGuest
        ? await createGuestReservation(reservationPayload)
        : await createReservation(reservationPayload);

      if (isGuest) {
        navigate(`/guest/payments/${reservation.confirmationNumber}`, {
          state: {
            reservation,
            room,
            checkIn,
            checkOut,
          },
        });
        return;
      }

      navigate('/confirmation', {
        state: {
          reservation,
          room,
          checkIn,
          checkOut,
        },
      });
    } catch (error) {
      const message = extractReservationError(error);
      if (isConflictError(error)) {
        setConflictError(message);
      } else {
        setValidationError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!roomId) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
        <DashboardPanel
          title={t('bookRoomPage.noRoomPanelTitle')}
          description={t('bookRoomPage.noRoomPanelDescription')}
        >
          <div className="rounded-[1.5rem] border border-dashed border-brand-surface-border bg-brand-surface-light px-6 py-14 text-center">
            <BedDouble className="mx-auto h-10 w-10 text-brand-ink-hint shrink-0" />
            <p className="mt-4 text-lg font-black text-brand-ink break-words">{t('noRoomSelected')}</p>
            <p className="mt-2 text-sm font-medium text-brand-ink-muted break-words">
              {t('bookRoomPage.noRoomMessage')}
            </p>
            <Button variant="unstyled" size="none"
              type="button"
              onClick={() => navigate('/search')}
              className="mt-5 inline-flex min-w-0 items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {t('backToRoomSearch')}
            </Button>
          </div>
        </DashboardPanel>
      </div>
    );
  }

  if (loadingRoom) {
    return <LoadingState message={t('roomSearchPage.searchingRooms')} />;
  }

  if (loadError) {
    return (
      <ErrorState
        title={t('bookARoom')}
        message={loadError}
        onRetry={() => navigate(0)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, 'bookRoomPage.heroEyebrow', 'Secure reservation')}
        title={t('bookARoom')}
        description={
          isAuthenticated
            ? translateWithFallback(
                t,
                'bookRoomPage.authenticatedDescription',
                'Review the stay, confirm your guest profile, and submit the reservation.'
              )
            : translateWithFallback(
                t,
                'bookRoomPage.publicDescription',
                'Review the stay details now. You will sign in before the reservation is created.'
              )
        }
        meta={[
          room ? t('roomNum', { number: room.roomNumber }) : `#${roomId}`,
          t('nightsCount', { count: nights || 0 }),
          pricing?.total ? formatLocalizedCurrency(pricing.total, i18n.language) : t('common.pending'),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
            {t('bookRoomPage.snapshotTitle')}
          </p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('bookRoomPage.snapshotRoom')}
              </p>
              <p className="mt-2 text-lg font-black break-words">
                {room ? t('roomNum', { number: room.roomNumber }) : `#${roomId}`}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('bookRoomPage.snapshotTotal')}
              </p>
              <p className="mt-2 text-lg font-black break-words">
                {formatLocalizedCurrency(pricing?.total ?? 0, i18n.language)}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      {conflictError ? (
        <div className="rounded-[1.75rem] border border-brand-danger/30 bg-brand-danger/10 p-5">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex min-w-0 h-11 w-11 items-center justify-center rounded-2xl bg-brand-danger/20 text-brand-ink break-words">
              <AlertTriangle className="h-5 w-5 shrink-0" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black tracking-tight text-brand-ink break-words">
                {t('roomAlreadyBooked')}
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-brand-danger/85 break-words">
                {conflictError}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <DashboardPanel
            title={translateWithFallback(t, 'bookRoomPage.summaryTitle', 'Booking summary')}
            description={translateWithFallback(
              t,
              'bookRoomPage.summaryDescription',
              'Keep the stay details accurate. Totals update from the backend pricing quote.'
            )}
          >
            <div className="space-y-5">
              {validationError ? (
                <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
                  {validationError}
                </div>
              ) : null}

              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
              />

              {!isAuthenticated ? (
                <div className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-5">
                  <p className="inline-flex min-w-0 items-center gap-2 text-sm font-black text-brand-ink break-words">
                    <Lock className="h-4 w-4 shrink-0" />
                    {translateWithFallback(
                      t,
                      'bookRoomPage.loginCheckpointTitle',
                      'Sign in to finalize the reservation'
                    )}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-brand-ink-muted break-words">
                    {translateWithFallback(
                      t,
                      'bookRoomPage.loginCheckpointBody',
                      'The room, dates, and quote stay here. Authentication is required only for the actual reservation submission.'
                    )}
                  </p>
                  <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row">
                    <Button type="button" className="h-auto min-w-0 flex-1 rounded-full py-4" onClick={handleGoToLogin}>
                      {t('signIn')}
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      className="h-auto min-w-0 flex-1 rounded-full border-brand-surface-border py-4"
                      onClick={() => navigate(`/rooms/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}`)}
                    >
                      {translateWithFallback(t, 'roomSearchPage.viewDetailsCta', 'View details')}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid min-w-0 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Field
                        id="guest-name"
                        label={t('fullName')}
                        required
                        placeholder={t('guestFullNamePlaceholder')}
                        value={guest.name}
                        onChange={(value) => setField('name', value)}
                        icon={UserRound}
                      />
                    </div>

                    <Field
                      id="guest-email"
                      label={t('emailAddress')}
                      required
                      type="email"
                      placeholder={t('guestEmailPlaceholder')}
                      value={guest.email}
                      onChange={(value) => setField('email', value)}
                      icon={Mail}
                      disabled={isGuest}
                      locked={isGuest}
                    />

                    <Field
                      id="guest-phone"
                      label={t('phoneNumber')}
                      required
                      type="tel"
                      placeholder={t('phonePlaceholder')}
                      value={guest.phone}
                      onChange={(value) => setField('phone', value)}
                      icon={Phone}
                    />

                    <Field
                      id="guest-id-number"
                      label={t('idPassport')}
                      required
                      placeholder={t('idPlaceholder')}
                      value={guest.idNumber}
                      onChange={(value) => setField('idNumber', value)}
                      icon={IdCard}
                    />

                    <Field
                      id="guest-nationality"
                      label={t('nationality')}
                      required
                      placeholder={t('nationalityPlaceholder')}
                      value={guest.nationality}
                      onChange={(value) => setField('nationality', value)}
                      icon={Globe2}
                    />
                  </div>

                  <div className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-4">
                    <p className="text-sm font-black text-brand-ink break-words">
                      {translateWithFallback(
                        t,
                        'bookRoomPage.postAuthSubmissionTitle',
                        'What happens next'
                      )}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6 text-brand-ink-muted break-words">
                      {translateWithFallback(
                        t,
                        'bookRoomPage.postAuthSubmissionBody',
                        'The reservation is created in a pending payment/confirmation workflow. Front desk and payment operations finalize the stay status from the backend.'
                      )}
                    </p>
                  </div>

                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => navigate(-1)}
                      className="inline-flex min-w-0 w-full items-center justify-center gap-2 rounded-full border border-brand-surface-border px-6 py-4 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light h-auto"
                    >
                      <ArrowLeft className="h-4 w-4 shrink-0" />
                      {t('back')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || nights <= 0 || room?.availableForRequestedStay === false}
                      className="inline-flex min-w-0 w-full items-center justify-center rounded-full bg-brand-primary px-6 py-4 text-sm font-bold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted h-auto"
                    >
                      {submitting
                        ? translateWithFallback(
                            t,
                            'bookRoomPage.creatingReservation',
                            'Creating reservation...'
                          )
                        : translateWithFallback(
                            t,
                            'bookRoomPage.secureSubmitCta',
                            'Create reservation'
                          )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title={t('bookRoomPage.summaryTitle')}
            description={t('bookRoomPage.summaryDescription')}
          >
            <div className="space-y-5">
              <div className="flex min-w-0 h-44 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,#FBF9F4_0%,#FBF9F4_45%,#ede9e1_100%)]">
                <span className="flex min-w-0 h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-brand-ink shadow-sm break-words">
                  {room?.availableForRequestedStay ? (
                    <CheckCircle2 className="h-7 w-7 text-brand-success shrink-0" />
                  ) : (
                    <BedDouble className="h-7 w-7 shrink-0" />
                  )}
                </span>
              </div>

              <div>
                <p className="text-2xl font-black tracking-tight text-brand-ink break-words">
                  {room ? t('roomNum', { number: room.roomNumber }) : `#${roomId}`}
                </p>
                <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                  {translateKnownValue(room?.roomType?.name, t) || t('bookRoomPage.roomTypeUnavailable')}
                  {room?.floor ? ` | ${t('floorNum', { floor: room.floor })}` : ''}
                </p>
              </div>

              <div className="grid min-w-0 gap-3 md:grid-cols-2">
                <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                    {t('common.dates')}
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                    {formatLocalizedDate(checkIn, i18n.language, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {formatLocalizedDate(checkOut, i18n.language, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                    {t('status')}
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                    {room?.availabilityMessage ?? t('common.pending')}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-4">
                <div className="flex min-w-0 items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-brand-ink-muted break-words">{t('bookRoomPage.ratePerNight')}</span>
                  <span className="font-bold text-brand-ink break-words">
                    {formatLocalizedCurrency(pricing?.pricePerNight ?? 0, i18n.language)}
                  </span>
                </div>
                <div className="mt-3 flex min-w-0 items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-brand-ink-muted break-words">{t('nightsLabel')}</span>
                  <span className="font-bold text-brand-ink break-words">{pricing?.nights ?? '-'}</span>
                </div>
                <div className="mt-3 flex min-w-0 items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-brand-ink-muted break-words">{t('subtotal')}</span>
                  <span className="font-bold text-brand-ink break-words">
                    {formatLocalizedCurrency(pricing?.subtotal ?? 0, i18n.language)}
                  </span>
                </div>
                <div className="mt-3 flex min-w-0 items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-brand-ink-muted break-words">{t('taxes15')}</span>
                  <span className="font-bold text-brand-ink break-words">
                    {formatLocalizedCurrency(pricing?.vatAmount ?? 0, i18n.language)}
                  </span>
                </div>
                <div className="mt-4 flex min-w-0 items-center justify-between gap-4 border-t border-brand-surface-border pt-4">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                    {t('total')}
                  </span>
                  <span className="text-2xl font-black text-brand-ink break-words">
                    {formatLocalizedCurrency(pricing?.total ?? 0, i18n.language)}
                  </span>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-brand-surface-border bg-white p-4">
                <p className="text-sm font-black text-brand-ink break-words">
                  {translateWithFallback(t, 'bookRoomPage.policySnapshotTitle', 'Stay policies')}
                </p>
                <ul className="mt-3 space-y-2 text-sm font-medium leading-6 text-brand-ink-muted">
                  <li>{translateWithFallback(t, 'bookRoomPage.cancellationPolicyBody', 'Free cancellation windows and refund decisions are handled by hotel policy and workflow status.')}</li>
                  <li>{translateWithFallback(t, 'bookRoomPage.paymentPolicyBody', 'Taxes and totals are generated by the backend pricing engine and revalidated on reservation creation.')}</li>
                  <li>{translateWithFallback(t, 'bookRoomPage.checkInRulesBody', 'Check-in and check-out remain staff-controlled operational actions after reservation confirmation.')}</li>
                </ul>
              </div>
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
