import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import DateRangePicker from '../components/DateRangePicker';
import ErrorBanner from '../components/ErrorBanner';
import { MODIFIABLE_STATUSES } from '../data/mockReservations';

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const money = (v) => `$${Number(v ?? 0).toFixed(2)}`;

// ─── Modify Modal ─────────────────────────────────────────────────────────────
function ModifyModal({ reservation, onClose, onSave }) {
    const [checkIn, setCheckIn] = useState(reservation.checkInDate);
    const [checkOut, setCheckOut] = useState(reservation.checkOutDate);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const nights = useMemo(() => {
        if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
        return Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000);
    }, [checkIn, checkOut]);

    const subtotal = reservation.roomRate * nights;
    const taxes = subtotal * 0.10;
    const totalPrice = subtotal + taxes;

    const unchanged = checkIn === reservation.checkInDate && checkOut === reservation.checkOutDate;

    const handleSave = () => {
        if (nights <= 0) return setError('Check-out must be after check-in.');
        if (unchanged) return setError('No changes detected.');

        setError(null);
        setSaving(true);
        // MOCK — replace with API call
        setTimeout(() => {
            setSaving(false);
            onSave({ ...reservation, checkInDate: checkIn, checkOutDate: checkOut, nights, subtotal, taxes, totalPrice });
        }, 700);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Modify Reservation</h2>
                        <p className="text-xs text-gray-400 font-mono">{reservation.confirmationNumber}</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-gray-300" aria-label="Close">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4">
                    <ErrorBanner message={error} onClose={() => setError(null)} />

                    {/* Current info */}
                    <div className="rounded-lg bg-gray-50 p-3 text-sm">
                        <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Current Booking</p>
                        <p className="text-gray-700">Room <strong>{reservation.roomNumber}</strong> · {reservation.guestName}</p>
                        <p className="text-gray-500 text-xs">{formatDate(reservation.checkInDate)} → {formatDate(reservation.checkOutDate)} ({reservation.nights} nights)</p>
                    </div>

                    {/* Date change */}
                    <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">New Dates</p>
                        <DateRangePicker
                            checkIn={checkIn}
                            checkOut={checkOut}
                            onCheckInChange={setCheckIn}
                            onCheckOutChange={setCheckOut}
                        />
                    </div>

                    {/* New price preview */}
                    {nights > 0 && !unchanged && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-2">Updated Price Preview</p>
                            <div className="flex flex-col gap-1 text-sm text-blue-900">
                                <div className="flex justify-between"><span>{nights} nights × {money(reservation.roomRate)}</span><span>{money(subtotal)}</span></div>
                                <div className="flex justify-between"><span>Taxes (10%)</span><span>{money(taxes)}</span></div>
                                <div className="flex justify-between border-t border-blue-200 pt-1 mt-1 font-bold"><span>New Total</span><span>{money(totalPrice)}</span></div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-300">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || unchanged || nights <= 0}
                            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
/**
 * ModifyReservation  –  /reservations/modify
 * Staff/Manager view: look up and modify reservation dates.
 * Mock only — no real API calls.
 */
export default function ModifyReservation() {
    const navigate = useNavigate();

    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSelect = (r) => { setSelected(r); setShowModal(false); };

    const handleSave = (updated) => {
        setSelected(updated);
        setShowModal(false);
        setToast({ message: `Reservation ${updated.confirmationNumber} updated successfully.`, type: 'success' });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <ConfirmationToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

            {showModal && selected && (
                <ModifyModal
                    reservation={selected}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}

            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition">← Back</button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Modify Reservation</h1>
                    <p className="text-sm text-gray-500">Look up a reservation and update its dates.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Lookup */}
                <div><ReservationLookupPanel onSelect={handleSelect} /></div>

                {/* Selected reservation */}
                <div>
                    {!selected ? (
                        <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                            <span className="text-5xl mb-3">📋</span>
                            <p className="text-sm font-medium text-gray-600">No reservation selected</p>
                            <p className="text-xs text-gray-400 mt-1">Search and select a reservation to modify it.</p>
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

                            {!MODIFIABLE_STATUSES.includes(selected.status) && (
                                <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                                    ⚠️ This reservation cannot be modified — status is <strong>{selected.status.replace('_', ' ')}</strong>.
                                </div>
                            )}

                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-5">
                                <div><dt className="text-xs text-gray-400">Room</dt><dd className="font-semibold">Room {selected.roomNumber} · {selected.roomTypeName}</dd></div>
                                <div><dt className="text-xs text-gray-400">Floor</dt><dd className="font-semibold">{selected.floor}</dd></div>
                                <div><dt className="text-xs text-gray-400">Check-In</dt><dd className="font-semibold">{formatDate(selected.checkInDate)}</dd></div>
                                <div><dt className="text-xs text-gray-400">Check-Out</dt><dd className="font-semibold">{formatDate(selected.checkOutDate)}</dd></div>
                                <div><dt className="text-xs text-gray-400">Nights</dt><dd className="font-semibold">{selected.nights}</dd></div>
                                <div><dt className="text-xs text-gray-400">Total</dt><dd className="font-bold text-blue-700">{money(selected.totalPrice)}</dd></div>
                            </dl>

                            {MODIFIABLE_STATUSES.includes(selected.status) && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    ✏️ Modify Dates
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
