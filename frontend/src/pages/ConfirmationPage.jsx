import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    // Primary data: full ReservationResponse from backend
    const reservation = location.state?.reservation ?? null;
    // Secondary: room object (for type icon + amenities, which aren't in ReservationResponse)
    const room = location.state?.room ?? null;

    const dashboardPath = hasRole('ROLE_MANAGER') ? '/manager/dashboard'
        : hasRole('ROLE_STAFF') ? '/staff/dashboard'
            : '/guest/dashboard';

    if (!reservation) {
        return (
            <div className="h-full bg-zinc-50 flex flex-col items-center justify-center p-8 text-center">
                <span className="text-6xl mb-6">📋</span>
                <h1 className="text-3xl font-extrabold text-black mb-2">{t('noBookingData') || 'No booking data found'}</h1>
                <p className="text-sm font-medium text-zinc-500 mb-8">
                    {t('completeBookingMsg') || 'Please complete a booking through the Room Search page.'}
                </p>
                <button
                    onClick={() => navigate('/search')}
                    className="rounded-full bg-black px-8 py-3 text-sm font-bold text-white transition-all shadow-md hover:shadow-lg hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                    {t('goToRoomSearch') || 'Go to Room Search'}
                </button>
            </div>
        );
    }

    const amenities = room?.roomType?.amenities
        ? room.roomType.amenities.split(',').map((a) => a.trim()).filter(Boolean)
        : [];

    return (
        <div className="h-full bg-zinc-50 p-6 lg:p-8">
            <div className="mx-auto max-w-3xl">

                {/* ── Success Banner ── */}
                <div className="mb-8 flex flex-col items-center text-center rounded-3xl bg-white border border-zinc-200 p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 text-4xl mb-5 shadow-sm border border-zinc-100">
                        ✅
                    </div>
                    <h1 className="text-3xl font-extrabold text-black">{t('bookingConfirmed') || 'Booking Confirmed!'}</h1>
                    <p className="mt-2 text-sm font-medium text-zinc-500">
                        {t('bookingRecordedMsg') || 'The reservation has been successfully recorded. A confirmation email has been sent.'}
                    </p>

                    {/* Confirmation Number */}
                    <div className="mt-6 w-full rounded-2xl bg-zinc-50 border border-zinc-200 px-8 py-6">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{t('confirmationNumber') || 'Confirmation Number'}</p>
                        <p className="text-4xl font-mono font-extrabold text-black tracking-widest">
                            {reservation.confirmationNumber}
                        </p>
                        <p className="text-xs font-medium text-zinc-500 mt-2">{t('keepNumberMsg') || 'Keep this number to retrieve your booking.'}</p>
                    </div>

                    {/* Status badge */}
                    <span className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${reservation.status === 'CONFIRMED'
                            ? 'border-zinc-300 bg-white text-black shadow-sm'
                            : 'bg-zinc-100 text-zinc-600 border-transparent'
                        }`}>
                        {reservation.status === 'CONFIRMED' ? '✔' : '⏳'} {t(reservation.status?.toLowerCase().replace('_', '')) || reservation.status}
                    </span>
                </div>

                {/* ── Details Card ── */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-10 shadow-sm mb-8">
                    <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">{t('reservationDetails') || 'Reservation Details'}</h2>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                        {/* Room Info */}
                        <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5 flex gap-4 items-start">
                            <span className="text-4xl shrink-0 mt-1 drop-shadow-sm">
                                {typeIcon(room?.roomType?.name ?? '')}
                            </span>
                            <div>
                                <p className="text-lg font-extrabold text-black">{t('roomNum', { number: reservation.roomNumber }) || `Room ${reservation.roomNumber}`}</p>
                                {room && (
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                        {room.floor ? `${t('floorNum', { floor: room.floor }) || `Floor ${room.floor}`} · ` : ''}{room.roomType?.name ?? '—'}
                                    </p>
                                )}
                                {amenities.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {amenities.slice(0, 3).map((a) => (
                                            <span key={a} className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold text-black shadow-sm">
                                                {a}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guest Info */}
                        <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5 flex flex-col justify-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{t('guestBadge') || 'Guest'}</p>
                            <p className="text-lg font-extrabold text-black">{reservation.guestName}</p>
                            <p className="text-sm font-medium text-zinc-500 mt-1">{reservation.guestEmail}</p>
                        </div>

                        {/* Dates */}
                        <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">{t('stayBadge') || 'Stay'}</p>
                            <div className="flex flex-col gap-2 text-sm font-medium text-zinc-600">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">{t('checkInLabelBase') || 'Check-In'}</span>
                                    <span className="font-extrabold text-black">{formatDate(reservation.checkInDate)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500 uppercase text-[10px] font-bold tracking-widest">{t('checkOutLabelBase') || 'Check-Out'}</span>
                                    <span className="font-extrabold text-black">{formatDate(reservation.checkOutDate)}</span>
                                </div>
                                <div className="flex justify-between border-t border-zinc-200 pt-3 mt-1 items-center">
                                    <span className="text-black uppercase text-[10px] font-extrabold tracking-widest">{t('durationStr') || 'Duration'}</span>
                                    <span className="font-extrabold text-black rounded-full border border-black px-3 py-1 text-xs">
                                        {t('nightsCount', { count: reservation.nights }) || `${reservation.nights} night(s)`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">{t('pricingBadge') || 'Pricing'}</p>
                            <div className="flex flex-col gap-2 text-sm font-medium">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500">{t('ratePerNight') || 'Rate / night'}</span>
                                    <span className="font-bold text-black">{money(reservation.roomRate)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500">{t('nightsLabel') || 'Nights'}</span>
                                    <span className="font-bold text-black">{reservation.nights}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500">{t('subtotal') || 'Subtotal'}</span>
                                    <span className="font-bold text-black">{money(reservation.subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500">{t('taxes10') || 'Taxes'}</span>
                                    <span className="font-bold text-black">{money(reservation.taxes)}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-zinc-200 pt-3 mt-1">
                                    <span className="font-bold text-black text-lg">{t('total') || 'Total'}</span>
                                    <span className="text-xl font-extrabold text-black">{money(reservation.totalPrice)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex flex-col gap-4 sm:flex-row">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 rounded-full border border-zinc-200 py-4 text-sm font-bold text-black bg-white transition-all shadow-sm hover:shadow-md hover:bg-zinc-50 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    >
                        {t('printConfirmation') || '🖨️ Print Confirmation'}
                    </button>
                    <button
                        onClick={() => navigate('/search')}
                        className="flex-1 rounded-full border border-zinc-200 py-4 text-sm font-bold text-black bg-white transition-all shadow-sm hover:shadow-md hover:bg-zinc-50 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    >
                        {t('newSearch') || '← New Search'}
                    </button>
                    <button
                        onClick={() => navigate(dashboardPath)}
                        className="flex-1 rounded-full bg-black py-4 text-sm font-extrabold text-white shadow-md transition-all hover:bg-zinc-800 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    >
                        {t('goToDashboard') || 'Go to Dashboard →'}
                    </button>
                </div>

            </div>
        </div>
    );
}
