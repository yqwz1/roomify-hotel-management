import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import { cancelReservation, extractReservationError } from '../services/reservationService';
import StatusPill from '../components/StatusPill';
import { LtrText } from '../components/LtrText';
import { useTranslation } from 'react-i18next';
import { reservationStatusRules, normalizeReservationStatusLabel } from '../domain/reservations/statusRules';

const formatDate = (iso) => {
    if (!iso) return '-';
    return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const money = (v) => `$${Number(v ?? 0).toFixed(2)}`;

function CancelDialog({ reservation, onClose, onConfirm }) {
    const { t, i18n } = useTranslation();
    const [reason, setReason] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(null);

    const handleConfirm = async () => {
        setConfirming(true);
        setError(null);

        try {
            const result = await cancelReservation(
                reservation.id ?? reservation.confirmationNumber,
                reason
            );
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
                <div className="flex items-start gap-3 rounded-t-2xl border-b border-red-100 bg-red-50 px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-red-900">Cancel Reservation</h2>
                        <p className="font-mono text-xs text-red-600">{reservation.confirmationNumber}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4 px-6 py-5">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        This action cannot be undone. The reservation will be cancelled.
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 text-sm">
                        <p className="font-semibold text-gray-900">{reservation.guestName}</p>
                        <p className="text-xs text-gray-500">
                            Room {reservation.roomNumber} - {formatDate(reservation.checkInDate)} to {formatDate(reservation.checkOutDate)}
                        </p>
                        <p className="text-xs text-gray-500">
                            {reservation.nights} nights | Total: <strong>{money(reservation.totalPrice)}</strong>
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="cancel-reason" className="text-xs font-medium text-gray-600">
                            Reason for cancellation (optional)
                        </label>
                        <textarea
                            id="cancel-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Guest requested cancellation, duplicate booking, etc."
                            rows={3}
                            className="resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            {t('keepReservation')}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={confirming}
                            className="flex-1 rounded-full bg-red-600 py-3 text-sm font-bold text-white transition shadow-sm hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                            {confirming ? 'Cancelling...' : 'Confirm Cancellation'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CancelReservation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const [selected, setSelected] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [toast, setToast] = useState(null);

    const initialQuery = useMemo(
        () => String(location.state?.initialQuery ?? '').trim(),
        [location.state?.initialQuery]
    );

    const handleSelect = (reservation) => {
        setSelected(reservation);
        setShowDialog(false);
    };

    const handleConfirm = (result) => {
        setShowDialog(false);
        setSelected((prev) => ({ ...prev, status: result?.currentStatus || 'CANCELLED' }));
        setToast({
            message: `Reservation ${selected.confirmationNumber} has been cancelled.`,
            type: 'success',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <ConfirmationToast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />

            {showDialog && selected && (
                <CancelDialog
                    reservation={selected}
                    onClose={() => setShowDialog(false)}
                    onConfirm={handleConfirm}
                />
            )}

            <div className="mb-6 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
                >
                    Back
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-black">{t('cancelReservationTitle')}</h1>
                    <p className="text-sm font-medium text-zinc-500 mt-1">{t('cancelReservationDesc')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                    <ReservationLookupPanel onSelect={handleSelect} initialQuery={initialQuery} />
                </div>

                <div>
                    {!selected ? (
                        <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                            <p className="text-sm font-medium text-gray-600">No reservation selected</p>
                            <p className="mt-1 text-xs text-gray-400">Search and select a reservation to cancel it.</p>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
                            <div className="mb-6 flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{selected.guestName}</p>
                                    <p className="font-mono text-xs text-gray-400">{selected.confirmationNumber}</p>
                                </div>
                                <StatusPill status={selected.status} />
                            </div>

                            {!reservationStatusRules.canCancel(selected.status) && (
                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    This reservation cannot be cancelled because status is <strong>{normalizeReservationStatusLabel(selected.status)}</strong>.
                                </div>
                            )}

                            <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                <div><dt className="text-xs text-gray-400">Room</dt><dd className="font-semibold">Room {selected.roomNumber} | {selected.roomTypeName}</dd></div>
                                <div><dt className="text-xs text-gray-400">Guest Email</dt><dd className="truncate font-semibold">{selected.guestEmail}</dd></div>
                                <div><dt className="text-xs text-gray-400">Check-In</dt><dd className="font-semibold">{formatDate(selected.checkInDate)}</dd></div>
                                <div><dt className="text-xs text-gray-400">Check-Out</dt><dd className="font-semibold">{formatDate(selected.checkOutDate)}</dd></div>
                                <div><dt className="text-xs text-gray-400">Nights</dt><dd className="font-semibold">{selected.nights}</dd></div>
                                <div><dt className="text-xs text-gray-400">Total Paid</dt><dd className="font-bold text-gray-900">{money(selected.totalPrice)}</dd></div>
                            </dl>

                            {reservationStatusRules.canCancel(selected.status) && (
                                <button
                                    onClick={() => setShowDialog(true)}
                                    className="w-full rounded-full border-2 border-red-600 bg-white hover:bg-red-50 py-4 text-sm font-bold text-red-600 transition focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
                                >
                                    Cancel This Reservation
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
