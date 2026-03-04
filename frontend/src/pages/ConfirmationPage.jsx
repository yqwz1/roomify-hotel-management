import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

// Room type → display icon
const typeIcon = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('suite')) return '🛎️';
    if (n.includes('family')) return '👨‍👩‍👧‍👦';
    if (n.includes('deluxe')) return '🌟';
    return '🛏️';
};

const formatDate = (iso) => {
    if (!iso) return '—';
    // Handle both "YYYY-MM-DD" and full ISO strings
    const d = iso.length === 10 ? new Date(iso + 'T12:00:00') : new Date(iso);
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const money = (val) =>
    val !== undefined && val !== null ? `$${Number(val).toFixed(2)}` : '—';

// ─── Main Page ────────────────────────────────────────────────────────────────
/**
 * ConfirmationPage  –  /confirmation
 * Displays the reservation summary after a successful booking.
 * Reads `reservation` (ReservationResponse from backend) + `room` from navigation state.
 */
export default function ConfirmationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasRole } = useAuth();

    // Primary data: full ReservationResponse from backend
    const reservation = location.state?.reservation ?? null;
    // Secondary: room object (for type icon + amenities, which aren't in ReservationResponse)
    const room = location.state?.room ?? null;

    const dashboardPath = hasRole('ROLE_MANAGER') ? '/manager/dashboard'
        : hasRole('ROLE_STAFF') ? '/staff/dashboard'
            : '/guest/dashboard';

    if (!reservation) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
                <span className="text-5xl mb-4">📋</span>
                <h1 className="text-xl font-bold text-gray-800 mb-2">No booking data found</h1>
                <p className="text-sm text-gray-500 mb-6">
                    Please complete a booking through the Room Search page.
                </p>
                <button
                    onClick={() => navigate('/search')}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                    Go to Room Search
                </button>
            </div>
        );
    }

    const amenities = room?.roomType?.amenities
        ? room.roomType.amenities.split(',').map((a) => a.trim()).filter(Boolean)
        : [];

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <div className="mx-auto max-w-2xl">

                {/* ── Success Banner ── */}
                <div className="mb-6 flex flex-col items-center text-center rounded-2xl bg-green-50 border border-green-200 p-8 shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-4xl mb-3">
                        ✅
                    </div>
                    <h1 className="text-2xl font-bold text-green-800">Booking Confirmed!</h1>
                    <p className="mt-1 text-sm text-green-600">
                        The reservation has been successfully recorded. A confirmation email has been sent.
                    </p>

                    {/* Confirmation Number */}
                    <div className="mt-4 rounded-lg bg-white border border-green-200 px-6 py-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Confirmation Number</p>
                        <p className="text-2xl font-mono font-bold text-gray-900 tracking-widest">
                            {reservation.confirmationNumber}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Keep this number to retrieve your booking.</p>
                    </div>

                    {/* Status badge */}
                    <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${reservation.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {reservation.status === 'CONFIRMED' ? '✔' : '⏳'} {reservation.status}
                    </span>
                </div>

                {/* ── Details Card ── */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-5">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">Reservation Details</h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        {/* Room Info */}
                        <div className="rounded-lg bg-gray-50 p-4 flex gap-4 items-start">
                            <span className="text-3xl shrink-0">
                                {typeIcon(room?.roomType?.name ?? '')}
                            </span>
                            <div>
                                <p className="font-bold text-gray-900">Room {reservation.roomNumber}</p>
                                {room && (
                                    <p className="text-xs text-gray-500">
                                        {room.floor ? `Floor ${room.floor} · ` : ''}{room.roomType?.name ?? '—'}
                                    </p>
                                )}
                                {amenities.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {amenities.slice(0, 3).map((a) => (
                                            <span key={a} className="rounded-full bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                                                {a}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guest Info */}
                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Guest</p>
                            <p className="font-bold text-gray-900">{reservation.guestName}</p>
                            <p className="text-sm text-gray-500">{reservation.guestEmail}</p>
                        </div>

                        {/* Dates */}
                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Stay</p>
                            <div className="flex flex-col gap-1 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Check-In</span>
                                    <span className="font-semibold">{formatDate(reservation.checkInDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Check-Out</span>
                                    <span className="font-semibold">{formatDate(reservation.checkOutDate)}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                                    <span className="text-gray-500">Duration</span>
                                    <span className="font-semibold">
                                        {reservation.nights} night{reservation.nights !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Pricing</p>
                            <div className="flex flex-col gap-1 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Rate / night</span>
                                    <span>{money(reservation.roomRate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Nights</span>
                                    <span>{reservation.nights}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{money(reservation.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Taxes</span>
                                    <span>{money(reservation.taxes)}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                                    <span className="font-bold text-gray-800">Total</span>
                                    <span className="text-lg font-bold text-blue-700">{money(reservation.totalPrice)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        🖨️ Print Confirmation
                    </button>
                    <button
                        onClick={() => navigate('/search')}
                        className="flex-1 rounded-xl border border-blue-200 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                        ← New Search
                    </button>
                    <button
                        onClick={() => navigate(dashboardPath)}
                        className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        Go to Dashboard →
                    </button>
                </div>

            </div>
        </div>
    );
}
