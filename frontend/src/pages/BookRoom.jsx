import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { MOCK_ROOMS } from '../data/mockRooms';
import DateRangePicker from '../components/DateRangePicker';
import ErrorBanner from '../components/ErrorBanner';

/**
 * BookRoom  –  /book?roomId=<id>
 * Booking form: shows selected room summary, collects guest details.
 * On submit, navigates to /confirmation with mock booking data.
 * Uses mock data only; no API calls.
 */
export default function BookRoom() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    const roomId = Number(searchParams.get('roomId'));
    const room = MOCK_ROOMS.find((r) => r.id === roomId) ?? null;

    // Pre-fill dates from navigation state (set by RoomSearch)
    const stateCheckIn = location.state?.checkIn ?? '';
    const stateCheckOut = location.state?.checkOut ?? '';

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

    const [checkIn, setCheckIn] = useState(stateCheckIn || today);
    const [checkOut, setCheckOut] = useState(stateCheckOut || tomorrow);
    const [form, setForm] = useState({ guestName: '', email: '', phone: '', numGuests: 1 });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const nights = useMemo(() => {
        if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
        return Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000);
    }, [checkIn, checkOut]);

    const totalPrice = room ? room.price * nights : 0;

    const handleField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!checkIn || !checkOut) return setError('Please select check-in and check-out dates.');
        if (checkOut <= checkIn) return setError('Check-out date must be after check-in date.');
        if (!form.guestName.trim()) return setError('Guest name is required.');
        if (!form.email.trim()) return setError('Email address is required.');
        if (Number(form.numGuests) < 1) return setError('At least 1 guest is required.');
        if (room && Number(form.numGuests) > room.maxGuests)
            return setError(`This room supports a maximum of ${room.maxGuests} guests.`);

        setSubmitting(true);

        // Simulate a brief async delay, then navigate to confirmation
        setTimeout(() => {
            const mockBooking = {
                id: `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                room,
                checkIn,
                checkOut,
                nights,
                totalPrice,
                guestName: form.guestName,
                email: form.email,
                phone: form.phone,
                numGuests: Number(form.numGuests),
                bookedAt: new Date().toISOString(),
            };
            navigate('/confirmation', { state: { booking: mockBooking } });
        }, 600);
    };

    if (!room) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
                <span className="text-5xl mb-4">🏨</span>
                <h1 className="text-xl font-bold text-gray-800 mb-2">Room not found</h1>
                <p className="text-gray-500 mb-6 text-sm">
                    No room matches the given ID. Please go back and select a room.
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
                        <p className="text-sm text-gray-500">Fill in the guest details to complete the reservation.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    {/* ── Left: Form ── */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

                            {/* Error Banner */}
                            <ErrorBanner message={error} onClose={() => setError(null)} />

                            {/* Dates Card */}
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <h2 className="mb-4 text-sm font-semibold text-gray-700">Stay Dates</h2>
                                <DateRangePicker
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    onCheckInChange={setCheckIn}
                                    onCheckOutChange={setCheckOut}
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
                                    {/* Guest Name */}
                                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                                        <label htmlFor="guestName" className="text-xs font-medium text-gray-600">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="guestName"
                                            type="text"
                                            placeholder="e.g. John Smith"
                                            value={form.guestName}
                                            onChange={(e) => handleField('guestName', e.target.value)}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="email" className="text-xs font-medium text-gray-600">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="guest@example.com"
                                            value={form.email}
                                            onChange={(e) => handleField('email', e.target.value)}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="phone" className="text-xs font-medium text-gray-600">
                                            Phone
                                        </label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            placeholder="+1 555 000 0000"
                                            value={form.phone}
                                            onChange={(e) => handleField('phone', e.target.value)}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>

                                    {/* Number of Guests */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="numGuests" className="text-xs font-medium text-gray-600">
                                            Number of Guests <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="numGuests"
                                            type="number"
                                            min="1"
                                            max={room.maxGuests}
                                            value={form.numGuests}
                                            onChange={(e) => handleField('numGuests', e.target.value)}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                        <p className="text-xs text-gray-400">Max: {room.maxGuests} guests</p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow transition hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                {submitting ? 'Processing…' : `Confirm Booking — $${totalPrice}`}
                            </button>
                        </form>
                    </div>

                    {/* ── Right: Room Summary ── */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-4 text-sm font-semibold text-gray-700">Booking Summary</h2>

                            {/* Room thumbnail */}
                            <div className="mb-4 flex h-28 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                                <span className="text-5xl">
                                    {room.type === 'Suite' ? '🛎️' : room.type === 'Family' ? '👨‍👩‍👧‍👦' : '🛏️'}
                                </span>
                            </div>

                            <p className="text-lg font-bold text-gray-900">Room {room.roomNumber}</p>
                            <p className="text-sm text-gray-500 mb-1">
                                Floor {room.floor} · {room.type}
                            </p>
                            <p className="text-xs text-gray-400 mb-4">{room.description}</p>

                            <hr className="my-3 border-gray-100" />

                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Price / night</dt>
                                    <dd className="font-semibold text-gray-800">${room.price}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Nights</dt>
                                    <dd className="font-semibold text-gray-800">{nights || '—'}</dd>
                                </div>
                                <div className="flex justify-between border-t border-gray-100 pt-2">
                                    <dt className="font-semibold text-gray-800">Total</dt>
                                    <dd className="text-lg font-bold text-blue-700">${totalPrice}</dd>
                                </div>
                            </dl>

                            {/* Amenities */}
                            <div className="mt-4 flex flex-wrap gap-1">
                                {room.amenities.map((a) => (
                                    <span key={a} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{a}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
