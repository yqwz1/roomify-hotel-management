import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import { CHECKINABLE_STATUSES } from '../data/mockReservations';
import { checkInReservation, extractReservationError } from '../services/reservationService';

const formatDate = (iso) => {
    if (!iso) return '-';
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
    });
};

const CHECKLIST_ITEMS = [
    { id: 'keys', label: 'Room keys prepared' },
    { id: 'clean', label: 'Room is clean and inspected' },
    { id: 'id', label: 'Guest ID verified' },
    { id: 'payment', label: 'Payment method confirmed' },
    { id: 'welcome', label: 'Welcome amenities placed' },
];

export default function CheckIn() {
    const navigate = useNavigate();

    const [selected, setSelected] = useState(null);
    const [checklist, setChecklist] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const allChecked = CHECKLIST_ITEMS.every((item) => checklist[item.id]);
    const canCheckIn = selected && CHECKINABLE_STATUSES.includes(selected.status) && allChecked;

    const toggleCheck = (id) =>
        setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));

    const handleSelect = (reservation) => {
        setSelected(reservation);
        setChecklist({});
    };

    const handleCheckIn = async () => {
        if (!canCheckIn || submitting) return;

        setSubmitting(true);
        setToast(null);

        try {
            await checkInReservation(selected.confirmationNumber);
            const guestName = selected.guest?.name || selected.guestName;
            const roomNumber = selected.room?.roomNumber || selected.roomNumber;
            setToast({ message: `Check-in successful for ${guestName} - Room ${roomNumber}`, type: 'success' });
            setSelected((prev) => ({ ...prev, status: 'CHECKED_IN' }));
        } catch (error) {
            setToast({ message: extractReservationError(error), type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <ConfirmationToast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />

            <div className="mb-6 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition">
                    Back
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Check-In</h1>
                    <p className="text-sm text-gray-500">Look up a reservation and complete the guest check-in process.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                    <ReservationLookupPanel onSelect={handleSelect} />
                </div>

                <div>
                    {!selected ? (
                        <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                            <span className="text-5xl mb-3">Hotel</span>
                            <p className="text-sm font-medium text-gray-600">No reservation selected</p>
                            <p className="text-xs text-gray-400 mt-1">Search and click a reservation on the left to start check-in.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{selected.guest?.name || selected.guestName}</p>
                                        <p className="text-xs font-mono text-gray-400">{selected.confirmationNumber}</p>
                                    </div>
                                    <StatusPill status={selected.status} />
                                </div>

                                {!CHECKINABLE_STATUSES.includes(selected.status) && (
                                    <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                                        This reservation cannot be checked in - status is <strong>{selected.status.replace('_', ' ')}</strong>.
                                    </div>
                                )}

                                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div><dt className="text-gray-400 text-xs">Room</dt><dd className="font-semibold text-gray-900">Room {selected.room?.roomNumber || selected.roomNumber} - {selected.room?.roomTypeName || selected.roomTypeName}</dd></div>
                                    <div><dt className="text-gray-400 text-xs">Floor</dt><dd className="font-semibold text-gray-900">{selected.room?.floor || selected.floor}</dd></div>
                                    <div><dt className="text-gray-400 text-xs">Check-In</dt><dd className="font-semibold text-gray-900">{formatDate(selected.dates?.checkIn || selected.checkInDate)}</dd></div>
                                    <div><dt className="text-gray-400 text-xs">Check-Out</dt><dd className="font-semibold text-gray-900">{formatDate(selected.dates?.checkOut || selected.checkOutDate)}</dd></div>
                                    <div><dt className="text-gray-400 text-xs">Nights</dt><dd className="font-semibold text-gray-900">{selected.dates?.nights || selected.nights}</dd></div>
                                    <div><dt className="text-gray-400 text-xs">Total</dt><dd className="font-bold text-blue-700">${Number(selected.pricing?.totalPrice || selected.totalPrice).toFixed(2)}</dd></div>
                                </dl>
                            </div>

                            {CHECKINABLE_STATUSES.includes(selected.status) && (
                                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <h3 className="mb-1 text-sm font-semibold text-gray-700">Pre-Check-In Checklist</h3>
                                    <p className="mb-4 text-xs text-gray-400">Complete all items before confirming check-in.</p>

                                    <ul className="space-y-2">
                                        {CHECKLIST_ITEMS.map((item) => (
                                            <li key={item.id}>
                                                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        id={`check-${item.id}`}
                                                        checked={!!checklist[item.id]}
                                                        onChange={() => toggleCheck(item.id)}
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
                                                    />
                                                    <span className={`text-sm ${checklist[item.id] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                        {item.label}
                                                    </span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>Progress</span>
                                            <span>{Object.values(checklist).filter(Boolean).length}/{CHECKLIST_ITEMS.length}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-gray-100">
                                            <div
                                                className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                                                style={{ width: `${(Object.values(checklist).filter(Boolean).length / CHECKLIST_ITEMS.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {CHECKINABLE_STATUSES.includes(selected.status) && (
                                <button
                                    onClick={handleCheckIn}
                                    disabled={!canCheckIn || submitting}
                                    className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-400"
                                >
                                    {submitting
                                        ? 'Processing...'
                                        : !allChecked
                                            ? `Complete checklist to check in (${Object.values(checklist).filter(Boolean).length}/${CHECKLIST_ITEMS.length})`
                                            : 'Confirm Check-In'
                                    }
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
