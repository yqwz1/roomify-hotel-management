import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import DateRangePicker from '../components/DateRangePicker';
import ErrorBanner from '../components/ErrorBanner';
import {
    createReservation,
    extractReservationError,
    isConflictError,
} from '../services/reservationService';
import { useTranslation } from 'react-i18next';

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_GUEST = {
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    nationality: '',
};

// Room type → display icon
const typeIcon = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('suite')) return '🛎️';
    if (n.includes('family')) return '👨‍👩‍👧‍👦';
    if (n.includes('deluxe')) return '🌟';
    return '🛏️';
};

// ─── 409 Conflict Banner ──────────────────────────────────────────────────────
function ConflictBanner({ message, checkIn, checkOut, room, onSearchAlternatives }) {
    const { t } = useTranslation();
    return (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
                <span className="text-3xl shrink-0 mt-0.5">🚫</span>
                <div className="flex-1">
                    <p className="text-lg font-extrabold text-red-900">{t('roomAlreadyBooked') || 'Room Already Booked'}</p>
                    <p className="mt-1 text-sm font-medium text-red-700">{message}</p>

                    {/* Suggestion */}
                    <div className="mt-6 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold text-red-800 mb-3 uppercase tracking-widest">{t('whatYouCanDo') || '💡 What you can do:'}</p>
                        <ul className="space-y-3 text-sm font-medium text-black">
                            <li className="flex items-start gap-3 w-full">
                                <span className="text-red-500 shrink-0 select-none">•</span>
                                <span>
                                    {t('tryDifferentDatesRoom', { room: room?.roomNumber }) || `Try different dates for Room ${room?.roomNumber}`}
                                </span>
                            </li>
                            <li className="flex items-start gap-3 w-full">
                                <span className="text-red-500 shrink-0 select-none">•</span>
                                <span>{t('searchAlternativeRooms') || 'Search for alternative rooms available for your dates'}</span>
                            </li>
                        </ul>

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onSearchAlternatives}
                                className="flex-1 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition-all shadow-sm hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
                            >
                                {t('searchAlternativeBtn') || '🔍 Search Alternative Rooms'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ id, label, required, type = 'text', placeholder, value, onChange, hint }) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-sm font-medium text-black transition-colors focus:bg-white focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            {hint && <p className="text-xs font-medium text-zinc-400 mt-1">{hint}</p>}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
/**
 * BookRoom  –  /book?roomId=<id>
 * Collects guest details and submits to POST /api/reservations.
 * Handles 409 Conflict with an actionable UI.
 * On success navigates to /confirmation with the full ReservationResponse.
 */
export default function BookRoom() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { t } = useTranslation();

    // Room + dates passed from RoomSearch via navigation state
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

    // ── Derived ───────────────────────────────────────────────────────────────
    const nights = useMemo(() => {
        if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
        return Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000);
    }, [checkIn, checkOut]);

    const roomRate = room?.roomType?.basePrice ?? 0;
    const subtotal = roomRate * nights;
    const taxRate = 0.10;
    const taxes = subtotal * taxRate;
    const totalPrice = subtotal + taxes;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSearchAlternatives = () => {
        navigate('/search', { state: { checkIn, checkOut } });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError(null);
        setConflictError(null);

        // Client-side validation
        if (!checkIn || !checkOut) return setValidationError(t('pleaseSelectDates') || 'Please select check-in and check-out dates.');
        if (checkOut <= checkIn) return setValidationError(t('checkoutAfterCheckin') || 'Check-out date must be after check-in date.');
        if (!guest.name.trim()) return setValidationError(t('guestNameRequired') || 'Guest full name is required.');
        if (!guest.email.trim()) return setValidationError(t('guestEmailRequired') || 'Guest email address is required.');
        if (!guest.phone.trim()) return setValidationError(t('guestPhoneRequired') || 'Guest phone number is required.');
        if (!guest.idNumber.trim()) return setValidationError(t('guestIdRequired') || 'Guest ID / Passport number is required.');
        if (!guest.nationality.trim()) return setValidationError(t('guestNationalityRequired') || 'Guest nationality is required.');
        if (!roomId) return setValidationError(t('noRoomError') || 'No room selected. Please go back and select a room.');

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

            // Success → navigate to confirmation
            navigate('/confirmation', {
                state: {
                    reservation,  // full ReservationResponse from backend
                    room,         // pass room object for display (amenities, type icon, etc.)
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

    // ── No room found ─────────────────────────────────────────────────────────
    if (!room && !roomId) {
        return (
            <div className="h-full bg-zinc-50 flex flex-col items-center justify-center p-8 text-center">
                <span className="text-6xl mb-6">🏨</span>
                <h1 className="text-3xl font-extrabold text-black mb-2">{t('noRoomSelected') || 'No room selected'}</h1>
                <p className="text-zinc-500 mb-8 font-medium text-sm">
                    {t('plzGoBackRoomSearch') || 'Please go back to Room Search and click Book Now on a room.'}
                </p>
                <button
                    onClick={() => navigate('/search')}
                    className="rounded-full bg-black px-8 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                    {t('backToRoomSearch') || '← Back to Room Search'}
                </button>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="h-full bg-zinc-50 p-6 lg:p-8">
            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-bold text-black bg-white shadow-sm transition-all hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    >
                        {t('back') || '← Back'}
                    </button>
                    <div>
                        <h1 className="text-4xl font-extrabold text-black tracking-tight">{t('bookARoom') || 'Book a Room'}</h1>
                        <p className="text-sm font-medium text-zinc-500 mt-2">
                            {t('fillGuestDetails') || 'Fill in the guest details to complete the reservation.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

                    {/* ── Left: Form ── */}
                    <div className="lg:col-span-3 flex flex-col gap-5">

                        {/* 409 Conflict Banner */}
                        {conflictError && (
                            <ConflictBanner
                                message={conflictError}
                                checkIn={checkIn}
                                checkOut={checkOut}
                                room={room}
                                onSearchAlternatives={handleSearchAlternatives}
                            />
                        )}

                        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

                            {/* Validation Error Banner */}
                            <ErrorBanner message={validationError} onClose={() => setValidationError(null)} />

                            {/* Dates Card */}
                            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
                                <h2 className="mb-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('stayDates') || 'Stay Dates'}</h2>
                                <DateRangePicker
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    onCheckInChange={(d) => { setCheckIn(d); setConflictError(null); }}
                                    onCheckOutChange={(d) => { setCheckOut(d); setConflictError(null); }}
                                />
                                {nights > 0 && (
                                    <p className="mt-4 text-sm font-extrabold text-black">
                                        📆 {t('nightsCount', { count: nights }) || `${nights} night(s)`}
                                    </p>
                                )}
                            </div>

                            {/* Guest Details Card */}
                            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
                                <h2 className="mb-6 text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('guestDetails') || 'Guest Details'}</h2>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                    {/* Full Name */}
                                    <div className="sm:col-span-2">
                                        <Field
                                            id="guest-name"
                                            label={t('fullName') || 'Full Name'}
                                            required
                                            placeholder={t('fullNamePlaceholder') || 'e.g. John Smith'}
                                            value={guest.name}
                                            onChange={(v) => setField('name', v)}
                                        />
                                    </div>

                                    {/* Email */}
                                    <Field
                                        id="guest-email"
                                        label={t('emailAddress') || 'Email Address'}
                                        required
                                        type="email"
                                        placeholder={t('emailPlaceholder') || 'guest@example.com'}
                                        value={guest.email}
                                        onChange={(v) => setField('email', v)}
                                    />

                                    {/* Phone */}
                                    <Field
                                        id="guest-phone"
                                        label={t('phoneNumber') || 'Phone Number'}
                                        required
                                        type="tel"
                                        placeholder={t('phonePlaceholder') || '+1 555 000 0000'}
                                        value={guest.phone}
                                        onChange={(v) => setField('phone', v)}
                                    />

                                    {/* ID Number */}
                                    <Field
                                        id="guest-idNumber"
                                        label={t('idPassport') || 'ID / Passport Number'}
                                        required
                                        placeholder={t('idPlaceholder') || 'e.g. A12345678'}
                                        value={guest.idNumber}
                                        onChange={(v) => setField('idNumber', v)}
                                    />

                                    {/* Nationality */}
                                    <Field
                                        id="guest-nationality"
                                        label={t('nationality') || 'Nationality'}
                                        required
                                        placeholder={t('nationalityPlaceholder') || 'e.g. Saudi Arabian'}
                                        value={guest.nationality}
                                        onChange={(v) => setField('nationality', v)}
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting || nights <= 0}
                                className="w-full rounded-full bg-black py-4 text-base font-extrabold text-white shadow-md transition-all hover:bg-zinc-800 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-zinc-400 mb-8"
                            >
                                {submitting
                                    ? <span className="flex items-center justify-center gap-3">
                                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    {t('processing') || 'Processing…'}
                                </span>
                                : t('confirmBookingPrice', { price: totalPrice.toFixed(2) }) || `Confirm Booking — $${totalPrice.toFixed(2)}`
                            }
                            </button>
                        </form>
                    </div>

                    {/* ── Right: Booking Summary ── */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-6 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
                            <h2 className="mb-6 text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('bookingSummary') || 'Booking Summary'}</h2>

                            {/* Room thumbnail */}
                            <div className="mb-5 flex h-40 items-center justify-center rounded-3xl bg-zinc-100">
                                <span className="text-6xl drop-shadow-sm">
                                    {room ? typeIcon(room.roomType?.name ?? room.type) : '🛏️'}
                                </span>
                            </div>

                            {room ? (
                                <>
                                    <p className="text-2xl font-extrabold text-black">{t('roomNum', { number: room.roomNumber }) || `Room ${room.roomNumber}`}</p>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mt-1 mb-4">
                                        {room.floor ? `${t('floorNum', { floor: room.floor }) || `Floor ${room.floor}`} · ` : ''}{room.roomType?.name ?? room.type ?? '—'}
                                    </p>
                                    {room.roomType?.description && (
                                        <p className="text-sm font-medium text-zinc-500 mb-6 line-clamp-3">{room.roomType.description}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-lg font-bold text-black mb-4">{t('roomNum', { number: roomId }) || `Room #${roomId}`}</p>
                            )}

                            <hr className="my-5 border-zinc-100" />

                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between font-medium">
                                    <dt className="text-zinc-500">{t('ratePerNight') || 'Rate / night'}</dt>
                                    <dd className="text-black">${roomRate.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <dt className="text-zinc-500">{t('nightsLabel') || 'Nights'}</dt>
                                    <dd className="text-black">{nights || '—'}</dd>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <dt className="text-zinc-500">{t('subtotal') || 'Subtotal'}</dt>
                                    <dd className="text-black">${subtotal.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <dt className="text-zinc-500">{t('taxes10') || 'Taxes (10%)'}</dt>
                                    <dd className="text-black">${taxes.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between border-t border-zinc-200 pt-4 mt-2">
                                    <dt className="text-lg font-extrabold text-black">{t('total') || 'Total'}</dt>
                                    <dd className="text-2xl font-extrabold text-black">${totalPrice.toFixed(2)}</dd>
                                </div>
                            </dl>

                            {/* Amenities */}
                            {room?.roomType?.amenities && (
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {room.roomType.amenities
                                        .split(',')
                                        .map((a) => a.trim())
                                        .filter(Boolean)
                                        .slice(0, 4)
                                        .map((a) => (
                                            <span key={a} className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-black">
                                                {a}
                                            </span>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
