import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import { LtrText } from '../components/LtrText';
import { useTranslation } from 'react-i18next';
import { CHECKINABLE_STATUSES } from '../data/mockReservations';
import { getReservationByConfirmationNumber, checkInReservation, extractReservationError } from '../services/reservationService';

const formatDate = (iso, lang) => {
    if (!iso) return '—';
    const locale = lang.startsWith('ar') ? 'ar-SA' : 'en-US';
    return new Date(iso + 'T12:00:00').toLocaleDateString(locale, {
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
    });
};

// ─── Room readiness checklist ─────────────────────────────────────────────────
const CHECKLIST_ITEMS = [
    { id: 'keys', label: 'Room keys prepared' },
    { id: 'clean', label: 'Room is clean and inspected' },
    { id: 'id', label: 'Guest ID verified' },
    { id: 'payment', label: 'Payment method confirmed' },
    { id: 'welcome', label: 'Welcome amenities placed' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
/**
 * CheckIn  –  /check-in
 * Staff/Manager view: look up a reservation and perform check-in.
 * Mock only — no real API calls.
 */
export default function CheckIn() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

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

    // Simulates API call — replace with real service later
    const handleCheckIn = async () => {
        if (!canCheckIn || submitting) return;
        setSubmitting(true);
        setToast(null);

        try {
            // The search endpoint returns a special DTO without the DB ID. We need the ID to check in.
            // (Assuming `selected` is from searchReservations)
            const confirmationNumber = selected.confirmationNumber;
            const fullReservation = await getReservationByConfirmationNumber(confirmationNumber);
            
            // Format today's date "YYYY-MM-DD"
            const today = new Date().toISOString().split('T')[0];
            
            await checkInReservation(fullReservation.id, today);

            const guestName = selected.guest?.name || selected.guestName;
            const roomNumber = selected.room?.roomNumber || selected.roomNumber;

            setToast({ message: t('checkInSuccess', { name: guestName, room: roomNumber }), type: 'success' });
            setSelected((prev) => ({ ...prev, status: 'CHECKED_IN' }));

        } catch (error) {
            setToast({ message: t('errorPrefix', { message: extractReservationError(error) }), type: 'error' });
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

            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition">
                    {t('back')}
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('checkInTitle')}</h1>
                    <p className="text-sm text-gray-500">{t('checkInDesc')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Left: Lookup */}
                <div>
                    <ReservationLookupPanel onSelect={handleSelect} />
                </div>

                {/* Right: Selected reservation + Checklist */}
                <div>
                    {!selected ? (
                        <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                            <span className="text-5xl mb-3">🏨</span>
                            <p className="text-sm font-medium text-gray-600">{t('noReservationSelected')}</p>
                            <p className="text-xs text-gray-400 mt-1">{t('searchAndClickToStart')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">

                            {/* Reservation Card */}
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{selected.guest?.name || selected.guestName}</p>
                                        <p className="text-xs font-mono text-gray-400"><LtrText>{selected.confirmationNumber}</LtrText></p>
                                    </div>
                                    <StatusPill status={selected.status} />
                                </div>

                                {!CHECKINABLE_STATUSES.includes(selected.status) && (
                                    <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                                        {t('cannotCheckIn')} <strong>{t(selected.status.toLowerCase()) || selected.status.replace('_', ' ')}</strong>.
                                    </div>
                                )}

                                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div><dt className="text-gray-400 text-xs">{t('room')}</dt><dd className="font-semibold text-gray-900">{t('room')} <LtrText>{selected.room?.roomNumber || selected.roomNumber}</LtrText> · {selected.room?.roomTypeName || selected.roomTypeName}</dd></div>
                                    <div><dt className="text-gray-400 text-xs">{t('floor')}</dt><dd className="font-semibold text-gray-900">{selected.room?.floor || selected.floor}</dd></div>
                                    <div><dt className="text-gray-400 text-xs">{t('checkInDate')}</dt><dd className="font-semibold text-gray-900"><LtrText>{formatDate(selected.dates?.checkIn || selected.checkInDate, i18n.language)}</LtrText></dd></div>
                                    <div><dt className="text-gray-400 text-xs">{t('checkOutDate')}</dt><dd className="font-semibold text-gray-900"><LtrText>{formatDate(selected.dates?.checkOut || selected.checkOutDate, i18n.language)}</LtrText></dd></div>
                                    <div><dt className="text-gray-400 text-xs">{t('nights')}</dt><dd className="font-semibold text-gray-900">{selected.dates?.nights || selected.nights}</dd></div>
                                    <div><dt className="text-gray-400 text-xs">{t('total')}</dt><dd className="font-bold text-blue-700"><LtrText>${Number(selected.pricing?.totalPrice || selected.totalPrice).toFixed(2)}</LtrText></dd></div>
                                </dl>
                            </div>

                            {/* Checklist */}
                            {CHECKINABLE_STATUSES.includes(selected.status) && (
                                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <h3 className="mb-1 text-sm font-semibold text-gray-700">{t('preCheckInChecklist')}</h3>
                                    <p className="mb-4 text-xs text-gray-400">{t('completeAllItems')}</p>

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
                                                        {t(item.id === 'keys' ? 'roomKeysPrepared' : 
                                                           item.id === 'clean' ? 'roomCleaned' : 
                                                           item.id === 'id' ? 'guestIdVerified' : 
                                                           item.id === 'payment' ? 'paymentConfirmed' : 
                                                           'welcomeAmenitiesPlaced')}
                                                    </span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Progress bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>{t('progress')}</span>
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

                            {/* Check-In Button */}
                            {CHECKINABLE_STATUSES.includes(selected.status) && (
                                <button
                                    onClick={handleCheckIn}
                                    disabled={!canCheckIn || submitting}
                                    className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-400"
                                >
                                    {submitting
                                        ? <span className="flex items-center justify-center gap-2">
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                            {t('processing')}
                                        </span>
                                        : !allChecked
                                            ? `${t('completeChecklistToCheckIn')} (${Object.values(checklist).filter(Boolean).length}/${CHECKLIST_ITEMS.length})`
                                            : t('confirmCheckIn')
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
