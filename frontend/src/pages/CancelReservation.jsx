import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import { cancelReservation, extractReservationError } from '../services/reservationService';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import { CANCELLABLE_STATUSES } from '../data/mockReservations';

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const money = (v) => `$${Number(v ?? 0).toFixed(2)}`;

// ─── Cancel Confirmation Dialog ───────────────────────────────────────────────
function CancelDialog({ reservation, onClose, onConfirm }) {
    const [reason, setReason] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(null);

    const handleConfirm = async () => {
        setConfirming(true);
        setError(null);
        try {
            const result = await cancelReservation(reservation.id, reason);
            onConfirm(result);
        } catch (err) {
            setError(extractReservationError(err));
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

                {/* Header — red accent */}
                <div className="rounded-t-2xl bg-red-50 border-b border-red-100 px-6 py-4 flex items-start gap-3">
                    <span className="text-2xl mt-0.5">🚫</span>
                    <div>
                        <h2 className="text-base font-bold text-red-900">Cancel Reservation</h2>
                        <p className="text-xs text-red-600 font-mono">{reservation.confirmationNumber}</p>
                    </div>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4">
                    {/* Warning */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                        ⚠️ This action cannot be undone. The reservation will be permanently cancelled.
                    </div>

                    {/* Summary */}
                    <div className="rounded-lg bg-gray-50 p-3 text-sm">
                        <p className="font-semibold text-gray-900">{reservation.guestName}</p>
                        <p className="text-gray-500 text-xs">Room {reservation.roomNumber} — {formatDate(reservation.checkInDate)} → {formatDate(reservation.checkOutDate)}</p>
                        <p className="text-gray-500 text-xs">{reservation.nights} nights · Total: <strong>{money(reservation.totalPrice)}</strong></p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Cancellation reason */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="cancel-reason" className="text-xs font-medium text-gray-600">
                            Reason for cancellation (Optional)
                        </label>
                        <textarea
                            id="cancel-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Guest changed mind, Error in booking..."
                            rows={3}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            Keep Reservation
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={confirming}
                            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                            {confirming ? 'Cancelling…' : 'Yes, Cancel It'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
/**
 * CancelReservation  –  /reservations/cancel
 * Staff/Manager view: look up and cancel a reservation.
 * Mock only — no real API calls.
 */
export default function CancelReservation() {
    const navigate = useNavigate();

    const [selected, setSelected] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSelect = (r) => { setSelected(r); setShowDialog(false); };

    const handleConfirm = (result) => {
        setShowDialog(false);
        setSelected((prev) => ({ ...prev, status: result?.currentStatus || 'CANCELLED' }));
        setToast({ message: `Reservation ${selected.confirmationNumber} has been cancelled.`, type: 'success' });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <ConfirmationToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

            {showDialog && selected && (
                <CancelDialog
                    reservation={selected}
                    onClose={() => setShowDialog(false)}
                    onConfirm={handleConfirm}
                />
            )}

            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition">← Back</button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cancel Reservation</h1>
                    <p className="text-sm text-gray-500">Look up a reservation and process a cancellation.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Lookup */}
                <div><ReservationLookupPanel onSelect={handleSelect} /></div>

                {/* Selected */}
                <div>
                    {!selected ? (
                        <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                            <span className="text-5xl mb-3">🔍</span>
                            <p className="text-sm font-medium text-gray-600">No reservation selected</p>
                            <p className="text-xs text-gray-400 mt-1">Search and select a reservation to cancel it.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{selected.guestName}</p>
                                    <p className="text-xs font-mono text-gray-400">{selected.confirmationNumber}</p>
                                </div>
                                <StatusPill status={selected.status} />
                            </div>

                            {!CANCELLABLE_STATUSES.includes(selected.status) && (
                                <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                                    ⚠️ This reservation cannot be cancelled — status is <strong>{selected.status.replace('_', ' ')}</strong>.
                                </div>
                            )}

                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-5">
                                <div><dt className="text-xs text-gray-400">Room</dt><dd className="font-semibold">Room {selected.roomNumber} · {selected.roomTypeName}</dd></div>
                                <div><dt className="text-xs text-gray-400">Guest Email</dt><dd className="font-semibold truncate">{selected.guestEmail}</dd></div>
                                <div><dt className="text-xs text-gray-400">Check-In</dt><dd className="font-semibold">{formatDate(selected.checkInDate)}</dd></div>
                                <div><dt className="text-xs text-gray-400">Check-Out</dt><dd className="font-semibold">{formatDate(selected.checkOutDate)}</dd></div>
                                <div><dt className="text-xs text-gray-400">Nights</dt><dd className="font-semibold">{selected.nights}</dd></div>
                                <div><dt className="text-xs text-gray-400">Total Paid</dt><dd className="font-bold text-gray-900">{money(selected.totalPrice)}</dd></div>
                            </dl>

                            {CANCELLABLE_STATUSES.includes(selected.status) && (
                                <button
                                    onClick={() => setShowDialog(true)}
                                    className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                    🚫 Cancel This Reservation
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
