import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  CalendarRange,
  Globe2,
  IdCard,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DateRangePicker from '../components/DateRangePicker';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { Button } from '../components/ui/button';
import {
  createReservation,
  createGuestReservation,
  extractReservationError,
  isConflictError,
} from '../services/reservationService';
import { useAuth } from '../context/AuthProvider';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  translateKnownValue,
} from '../utils/localization';
import { VAT_RATE } from '../utils/billing';

const EMPTY_GUEST = {
  name: '',
  email: '',
  phone: '',
  idNumber: '',
  nationality: '',
};

function Field({
  id,
  label,
  required = false,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400"
      >
        {label}
        {required ? ' *' : ''}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 ps-11 pe-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
        />
      </div>
    </div>
  );
}

function ConflictBanner({ message, room, onSearchAlternatives }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-200 text-rose-950">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black tracking-tight text-rose-950">
            {t('roomAlreadyBooked')}
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-rose-900/85">
            {message}
          </p>
          <div className="mt-4 rounded-[1.25rem] border border-rose-100 bg-white px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">
              {t('whatYouCanDo')}
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-700">
              {room?.roomNumber
                ? t('tryDifferentDatesRoom', { room: room.roomNumber })
                : t('searchAlternativeRooms')}
            </p>
            <button
              type="button"
              onClick={onSearchAlternatives}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              {t('searchAlternativeBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { hasRole } = useAuth();
  const { t, i18n } = useTranslation();

  const room = location.state?.room ?? null;
  const roomId = room?.id ?? Number(searchParams.get('roomId'));

  const stateCheckIn = location.state?.checkIn ?? '';
  const stateCheckOut = location.state?.checkOut ?? '';

  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(stateCheckIn || today);
  const [checkOut, setCheckOut] = useState(stateCheckOut || tomorrow);
  const [guest, setGuest] = useState(EMPTY_GUEST);
  const [validationError, setValidationError] = useState(null);
  const [conflictError, setConflictError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isGuest = hasRole('ROLE_GUEST');

  const setField = (field, value) => {
    setGuest((prev) => ({ ...prev, [field]: value }));
  };

  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
    return Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  }, [checkIn, checkOut]);

  const roomRate = Number(room?.roomType?.basePrice ?? 0);
  const subtotal = roomRate * nights;
  const taxes = subtotal * VAT_RATE;
  const totalPrice = subtotal + taxes;

  const handleSearchAlternatives = () => {
    navigate('/search', { state: { checkIn, checkOut } });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError(null);
    setConflictError(null);

    if (!checkIn || !checkOut) {
      setValidationError(t('pleaseSelectDates'));
      return;
    }

    if (checkOut <= checkIn) {
      setValidationError(t('checkoutAfterCheckin'));
      return;
    }

    if (!guest.name.trim()) {
      setValidationError(t('guestNameRequired'));
      return;
    }

    if (!guest.email.trim()) {
      setValidationError(t('guestEmailRequired'));
      return;
    }

    if (!guest.phone.trim()) {
      setValidationError(t('guestPhoneRequired'));
      return;
    }

    if (!guest.idNumber.trim()) {
      setValidationError(t('guestIdRequired'));
      return;
    }

    if (!guest.nationality.trim()) {
      setValidationError(t('guestNationalityRequired'));
      return;
    }

    if (!roomId) {
      setValidationError(t('noRoomError'));
      return;
    }

    setSubmitting(true);

    try {
      const reservationPayload = {
        roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        status: 'CONFIRMED',
        guest: {
          name: guest.name.trim(),
          email: guest.email.trim(),
          phone: guest.phone.trim(),
          idNumber: guest.idNumber.trim(),
          nationality: guest.nationality.trim(),
        },
      };
      const reservation = isGuest
        ? await createGuestReservation(reservationPayload)
        : await createReservation(reservationPayload);

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

  if (!room && !roomId) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
        <DashboardPanel
          title={t('bookRoomPage.noRoomPanelTitle')}
          description={t('bookRoomPage.noRoomPanelDescription')}
        >
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center">
            <BedDouble className="mx-auto h-10 w-10 text-zinc-400" />
            <p className="mt-4 text-lg font-black text-zinc-950">{t('noRoomSelected')}</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              {t('bookRoomPage.noRoomMessage')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToRoomSearch')}
            </button>
          </div>
        </DashboardPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={t('bookRoomPage.heroEyebrow')}
        title={t('bookARoom')}
        description={t('fillGuestDetails')}
        meta={[
          room ? t('roomNum', { number: room.roomNumber }) : `#${roomId}`,
          t('nightsCount', { count: nights || 0 }),
          formatLocalizedCurrency(totalPrice, i18n.language),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t('bookRoomPage.snapshotTitle')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('bookRoomPage.snapshotRoom')}
              </p>
              <p className="mt-2 text-lg font-black">
                {room ? t('roomNum', { number: room.roomNumber }) : `#${roomId}`}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('bookRoomPage.snapshotTotal')}
              </p>
              <p className="mt-2 text-lg font-black">
                {formatLocalizedCurrency(totalPrice, i18n.language)}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          {conflictError && (
            <ConflictBanner
              message={conflictError}
              room={room}
              onSearchAlternatives={handleSearchAlternatives}
            />
          )}

          <DashboardPanel
            title={t('bookRoomPage.formTitle')}
            description={t('bookRoomPage.formDescription')}
          >
            {validationError && (
              <div className="mb-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {t('bookRoomPage.stayWindow')}
                </p>
                <DateRangePicker
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onCheckInChange={(value) => {
                    setCheckIn(value);
                    setConflictError(null);
                  }}
                  onCheckOutChange={(value) => {
                    setCheckOut(value);
                    setConflictError(null);
                  }}
                />
                {nights > 0 && (
                  <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700">
                    {t('bookRoomPage.nightsSelected', { count: nights })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {t('bookRoomPage.guestProfile')}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 px-6 py-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 h-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('back')}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || nights <= 0}
                  className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 h-auto"
                >
                  {submitting
                    ? t('bookRoomPage.creatingReservation')
                    : t('confirmBookingPrice', {
                        price: formatLocalizedCurrency(totalPrice, i18n.language),
                      })}
                </Button>
              </div>
            </form>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title={t('bookRoomPage.summaryTitle')}
            description={t('bookRoomPage.summaryDescription')}
          >
            <div className="space-y-5">
              <div className="flex h-44 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,#f5f5f4_0%,#fafaf9_45%,#ede9e1_100%)]">
                <span className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-zinc-950 shadow-sm">
                  <BedDouble className="h-7 w-7" />
                </span>
              </div>

              <div>
                <p className="text-2xl font-black tracking-tight text-zinc-950">
                  {room ? t('roomNum', { number: room.roomNumber }) : `#${roomId}`}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  {translateKnownValue(room?.roomType?.name, t) || t('bookRoomPage.roomTypeUnavailable')}
                  {room?.floor ? ` | ${t('floorNum', { floor: room.floor })}` : ''}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    {t('common.dates')}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-zinc-950">
                    <CalendarRange className="h-4 w-4 text-zinc-400" />
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
                <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    {t('bookRoomPage.capacityLabel')}
                  </p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {t('upToGuests', { count: room?.roomType?.maxGuests ?? 0 })}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-zinc-500">{t('bookRoomPage.ratePerNight')}</span>
                  <span className="font-bold text-zinc-950">
                    {formatLocalizedCurrency(roomRate, i18n.language)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-zinc-500">{t('nightsLabel')}</span>
                  <span className="font-bold text-zinc-950">{nights || '-'}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-zinc-500">{t('subtotal')}</span>
                  <span className="font-bold text-zinc-950">
                    {formatLocalizedCurrency(subtotal, i18n.language)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-zinc-500">{t('taxes15')}</span>
                  <span className="font-bold text-zinc-950">
                    {formatLocalizedCurrency(taxes, i18n.language)}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                    {t('total')}
                  </span>
                  <span className="text-2xl font-black text-zinc-950">
                    {formatLocalizedCurrency(totalPrice, i18n.language)}
                  </span>
                </div>
              </div>

              {room?.roomType?.amenities && (
                <div className="flex flex-wrap gap-2">
                  {room.roomType.amenities
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .slice(0, 6)
                    .map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-600"
                      >
                        {translateKnownValue(amenity, t)}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
