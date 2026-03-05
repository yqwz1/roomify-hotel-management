import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import DateRangePicker from '../components/DateRangePicker';
import ErrorBanner from '../components/ErrorBanner';
import {
    createReservation,
    extractReservationError,
    isConflictError,
} from '../services/reservationService';

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
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">🚫</span>
                <div className="flex-1">
                    <p className="font-bold text-red-800">Room Already Booked</p>
                    <p className="mt-1 text-sm text-red-700">{message}</p>

                    {/* Suggestion */}
                    <div className="mt-4 rounded-lg border border-red-200 bg-white p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">💡 What you can do:</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 shrink-0">•</span>
                                <span>
                                    Try <strong>different dates</strong> for Room <strong>{room?.roomNumber}</strong>
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 shrink-0">•</span>
                                <span>Search for <strong>alternative rooms</strong> available for your dates</span>
                            </li>
                        </ul>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={onSearchAlternatives}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                🔍 Search Alternative Rooms
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
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-medium text-gray-600">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
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
        if (!checkIn || !checkOut) return setValidationError('Please select check-in and check-out dates.');
        if (checkOut <= checkIn) return setValidationError('Check-out date must be after check-in date.');
        if (!guest.name.trim()) return setValidationError('Guest full name is required.');
        if (!guest.email.trim()) return setValidationError('Guest email address is required.');
        if (!guest.phone.trim()) return setValidationError('Guest phone number is required.');
        if (!guest.idNumber.trim()) return setValidationError('Guest ID / Passport number is required.');
        if (!guest.nationality.trim()) return setValidationError('Guest nationality is required.');
        if (!roomId) return setValidationError('No room selected. Please go back and select a room.');

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
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
                <span className="text-5xl mb-4">🏨</span>
                <h1 className="text-xl font-bold text-gray-800 mb-2">No room selected</h1>
                <p className="text-gray-500 mb-6 text-sm">
                    Please go back to Room Search and click <strong>Book Now</strong> on a room.
                </p>
                <button
                    onClick={() => navigate('/search')}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                    ← Back to Room Search
                </button>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">

                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Book a Room</h1>
                        <p className="text-sm text-gray-500">
                            Fill in the guest details to complete the reservation.
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
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <h2 className="mb-4 text-sm font-semibold text-gray-700">Stay Dates</h2>
                                <DateRangePicker
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    onCheckInChange={(d) => { setCheckIn(d); setConflictError(null); }}
                                    onCheckOutChange={(d) => { setCheckOut(d); setConflictError(null); }}
                                />
                                {nights > 0 && (
                                    <p className="mt-3 text-sm font-medium text-blue-600">
                                        📆 {nights} night{nights !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            {/* Guest Details Card */}
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <h2 className="mb-4 text-sm font-semibold text-gray-700">Guest Details</h2>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                    {/* Full Name */}
                                    <div className="sm:col-span-2">
                                        <Field
                                            id="guest-name"
                                            label="Full Name"
                                            required
                                            placeholder="e.g. John Smith"
                                            value={guest.name}
                                            onChange={(v) => setField('name', v)}
                                        />
                                    </div>

                                    {/* Email */}
                                    <Field
                                        id="guest-email"
                                        label="Email Address"
                                        required
                                        type="email"
                                        placeholder="guest@example.com"
                                        value={guest.email}
                                        onChange={(v) => setField('email', v)}
                                    />

                                    {/* Phone */}
                                    <Field
                                        id="guest-phone"
                                        label="Phone Number"
                                        required
                                        type="tel"
                                        placeholder="+1 555 000 0000"
                                        value={guest.phone}
                                        onChange={(v) => setField('phone', v)}
                                    />

                                    {/* ID Number */}
                                    <Field
                                        id="guest-idNumber"
                                        label="ID / Passport Number"
                                        required
                                        placeholder="e.g. A12345678"
                                        value={guest.idNumber}
                                        onChange={(v) => setField('idNumber', v)}
                                    />

                                    {/* Nationality */}
                                    <Field
                                        id="guest-nationality"
                                        label="Nationality"
                                        required
                                        placeholder="e.g. Saudi Arabian"
                                        value={guest.nationality}
                                        onChange={(v) => setField('nationality', v)}
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting || nights <= 0}
                                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                {submitting
                                    ? <span className="flex items-center justify-center gap-2">
                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Processing…
                                    </span>
                                    : `Confirm Booking — $${totalPrice.toFixed(2)}`
                                }
                            </button>
                        </form>
                    </div>

                    {/* ── Right: Booking Summary ── */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-4 text-sm font-semibold text-gray-700">Booking Summary</h2>

                            {/* Room thumbnail */}
                            <div className="mb-4 flex h-28 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                                <span className="text-5xl">
                                    {room ? typeIcon(room.roomType?.name ?? room.type) : '🛏️'}
                                </span>
                            </div>

                            {room ? (
                                <>
                                    <p className="text-lg font-bold text-gray-900">Room {room.roomNumber}</p>
                                    <p className="text-sm text-gray-500 mb-1">
                                        {room.floor ? `Floor ${room.floor} · ` : ''}{room.roomType?.name ?? room.type ?? '—'}
                                    </p>
                                    {room.roomType?.description && (
                                        <p className="text-xs text-gray-400 mb-4 line-clamp-2">{room.roomType.description}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 mb-4">Room #{roomId}</p>
                            )}

                            <hr className="my-3 border-gray-100" />

                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Rate / night</dt>
                                    <dd className="font-semibold text-gray-800">${roomRate.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Nights</dt>
                                    <dd className="font-semibold text-gray-800">{nights || '—'}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Subtotal</dt>
                                    <dd className="text-gray-800">${subtotal.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Taxes (10%)</dt>
                                    <dd className="text-gray-800">${taxes.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between border-t border-gray-100 pt-2">
                                    <dt className="font-bold text-gray-800">Total</dt>
                                    <dd className="text-lg font-bold text-blue-700">${totalPrice.toFixed(2)}</dd>
                                </div>
                            </dl>

                            {/* Amenities */}
                            {room?.roomType?.amenities && (
                                <div className="mt-4 flex flex-wrap gap-1">
                                    {room.roomType.amenities
                                        .split(',')
                                        .map((a) => a.trim())
                                        .filter(Boolean)
                                        .slice(0, 4)
                                        .map((a) => (
                                            <span key={a} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
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
