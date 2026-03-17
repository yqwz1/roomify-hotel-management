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
import {
  createReservation,
  extractReservationError,
  isConflictError,
} from '../services/reservationService';

const EMPTY_GUEST = {
  name: '',
  email: '',
  phone: '',
  idNumber: '',
  nationality: '',
};

const tOr = (t, key, fallback, options) => {
  const value = t(key, options);
  return value === key ? fallback : value;
};

const formatMoney = (value) => `$${Number(value ?? 0).toFixed(2)}`;

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
          className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
        />
      </div>
    </div>
  );
}

function ConflictBanner({ message, room, onSearchAlternatives }) {
  return (
    <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-200 text-rose-950">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black tracking-tight text-rose-950">
            Room conflict detected
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-rose-900/85">
            {message}
          </p>
          <div className="mt-4 rounded-[1.25rem] border border-rose-100 bg-white px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">
              Recommended Next Step
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-700">
              Search for alternative rooms using the same stay dates.
              {room?.roomNumber ? ` Room ${room.roomNumber} is no longer available.` : ''}
            </p>
            <button
              type="button"
              onClick={onSearchAlternatives}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              Search Alternative Rooms
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
  const { t } = useTranslation();

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

  const setField = (field, value) => setGuest((prev) => ({ ...prev, [field]: value }));

  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
    return Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  }, [checkIn, checkOut]);

  const roomRate = Number(room?.roomType?.basePrice ?? 0);
  const subtotal = roomRate * nights;
  const taxes = subtotal * 0.1;
  const totalPrice = subtotal + taxes;

  const handleSearchAlternatives = () => {
    navigate('/search', { state: { checkIn, checkOut } });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError(null);
    setConflictError(null);

    if (!checkIn || !checkOut) {
      setValidationError(
        tOr(t, 'pleaseSelectDates', 'Please select check-in and check-out dates.')
      );
      return;
    }

    if (checkOut <= checkIn) {
      setValidationError(
        tOr(t, 'checkoutAfterCheckin', 'Check-out date must be after check-in date.')
      );
      return;
    }

    if (!guest.name.trim()) {
      setValidationError(
        tOr(t, 'guestNameRequired', 'Guest full name is required.')
      );
      return;
    }

    if (!guest.email.trim()) {
      setValidationError(
        tOr(t, 'guestEmailRequired', 'Guest email address is required.')
      );
      return;
    }

    if (!guest.phone.trim()) {
      setValidationError(
        tOr(t, 'guestPhoneRequired', 'Guest phone number is required.')
      );
      return;
    }

    if (!guest.idNumber.trim()) {
      setValidationError(
        tOr(t, 'guestIdRequired', 'Guest ID or passport number is required.')
      );
      return;
    }

    if (!guest.nationality.trim()) {
      setValidationError(
        tOr(t, 'guestNationalityRequired', 'Guest nationality is required.')
      );
      return;
    }

    if (!roomId) {
      setValidationError(
        tOr(t, 'noRoomError', 'No room selected. Please go back and select a room.')
      );
      return;
    }

    setSubmitting(true);

    try {
      const reservation = await createReservation({
        roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guest: {
          name: guest.name.trim(),
          email: guest.email.trim(),
          phone: guest.phone.trim(),
          idNumber: guest.idNumber.trim(),
          nationality: guest.nationality.trim(),
        },
      });

      navigate('/confirmation', {
        state: {
          reservation,
          room,
          checkIn,
          checkOut,
        },
      });
    } catch (err) {
      if (isConflictError(err)) {
        setConflictError(extractReservationError(err));
      } else {
        setValidationError(extractReservationError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!room && !roomId) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
        <DashboardPanel
          title="No Room Selected"
          description="This booking flow needs a room context from the room search results."
        >
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center">
            <BedDouble className="mx-auto h-10 w-10 text-zinc-400" />
            <p className="mt-4 text-lg font-black text-zinc-950">No room selected</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              Return to room search and start the booking from an available room card.
            </p>
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Room Search
            </button>
          </div>
        </DashboardPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow="Reservation Creation"
        title={tOr(t, 'bookARoom', 'Book a Room')}
        description={tOr(
          t,
          'fillGuestDetails',
          'Confirm the stay window, capture guest information, and create the reservation.'
        )}
        meta={[
          room ? `Room ${room.roomNumber}` : `Room ID ${roomId}`,
          `${nights || 0} night${nights === 1 ? '' : 's'}`,
          formatMoney(totalPrice),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Booking Snapshot
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Room
              </p>
              <p className="mt-2 text-lg font-black">
                {room ? `Room ${room.roomNumber}` : `Room ID ${roomId}`}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Total
              </p>
              <p className="mt-2 text-lg font-black">{formatMoney(totalPrice)}</p>
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
            title="Guest and Stay Details"
            description="Validate the date range and complete the required guest identity fields before confirming the booking."
          >
            {validationError && (
              <div className="mb-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  Stay Window
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
                    {nights} night{nights === 1 ? '' : 's'} selected for this stay.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  Guest Profile
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Field
                      id="guest-name"
                      label={tOr(t, 'fullName', 'Full Name')}
                      required
                      placeholder={tOr(t, 'guestFullNamePlaceholder', 'e.g. John Smith')}
                      value={guest.name}
                      onChange={(value) => setField('name', value)}
                      icon={UserRound}
                    />
                  </div>

                  <Field
                    id="guest-email"
                    label={tOr(t, 'emailAddress', 'Email Address')}
                    required
                    type="email"
                    placeholder={tOr(t, 'guestEmailPlaceholder', 'guest@example.com')}
                    value={guest.email}
                    onChange={(value) => setField('email', value)}
                    icon={Mail}
                  />

                  <Field
                    id="guest-phone"
                    label={tOr(t, 'phoneNumber', 'Phone Number')}
                    required
                    type="tel"
                    placeholder={tOr(t, 'phonePlaceholder', '+1 555 000 0000')}
                    value={guest.phone}
                    onChange={(value) => setField('phone', value)}
                    icon={Phone}
                  />

                  <Field
                    id="guest-id-number"
                    label={tOr(t, 'idPassport', 'ID / Passport Number')}
                    required
                    placeholder={tOr(t, 'idPlaceholder', 'e.g. A12345678')}
                    value={guest.idNumber}
                    onChange={(value) => setField('idNumber', value)}
                    icon={IdCard}
                  />

                  <Field
                    id="guest-nationality"
                    label={tOr(t, 'nationality', 'Nationality')}
                    required
                    placeholder={tOr(t, 'nationalityPlaceholder', 'e.g. Saudi Arabian')}
                    value={guest.nationality}
                    onChange={(value) => setField('nationality', value)}
                    icon={Globe2}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 px-6 py-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || nights <= 0}
                  className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                >
                  {submitting
                    ? 'Creating Reservation...'
                    : `Confirm Booking - ${formatMoney(totalPrice)}`}
                </button>
              </div>
            </form>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title="Booking Summary"
            description="Current room, dates, pricing, and room details for the reservation being created."
          >
            <div className="space-y-5">
              <div className="flex h-44 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,#f5f5f4_0%,#fafaf9_45%,#ede9e1_100%)]">
                <span className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white text-zinc-950 shadow-sm">
                  <BedDouble className="h-7 w-7" />
                </span>
              </div>

              <div>
                <p className="text-2xl font-black tracking-tight text-zinc-950">
                  {room ? `Room ${room.roomNumber}` : `Room #${roomId}`}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  {room?.roomType?.name || 'Room type unavailable'}
                  {room?.floor ? ` | Floor ${room.floor}` : ''}
                </p>
                {room?.roomType?.description && (
                  <p className="mt-3 text-sm font-medium leading-6 text-zinc-500">
                    {room.roomType.description}
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    Dates
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-zinc-950">
                    <CalendarRange className="h-4 w-4 text-zinc-400" />
                    {checkIn} to {checkOut}
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    Capacity
                  </p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    Up to {room?.roomType?.maxGuests ?? '-'} guests
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-zinc-500">Rate per night</span>
                  <span className="font-bold text-zinc-950">{formatMoney(roomRate)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-zinc-500">Nights</span>
                  <span className="font-bold text-zinc-950">{nights || '-'}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-zinc-500">Subtotal</span>
                  <span className="font-bold text-zinc-950">{formatMoney(subtotal)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-zinc-500">Taxes (10%)</span>
                  <span className="font-bold text-zinc-950">{formatMoney(taxes)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
                  <span className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                    Total
                  </span>
                  <span className="text-2xl font-black text-zinc-950">
                    {formatMoney(totalPrice)}
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
                        {amenity}
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
