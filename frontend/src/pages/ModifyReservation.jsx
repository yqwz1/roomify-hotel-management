import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import DateRangePicker from '../components/DateRangePicker';
import ErrorBanner from '../components/ErrorBanner';
import { LtrText } from '../components/LtrText';
import { searchRooms } from '../services/searchService';
import { modifyReservation, extractReservationError } from '../services/reservationService';
import { MODIFIABLE_STATUSES } from '../data/mockReservations';
import { useTranslation } from 'react-i18next';

const formatDate = (iso, lang) => {
    if (!iso) return '—';
    const locale = lang?.startsWith('ar') ? 'ar-SA' : 'en-US';
    return new Date(iso + 'T12:00:00').toLocaleDateString(locale, {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const money = (v) => `$${Number(v ?? 0).toFixed(2)}`;

// ─── Modify Modal ─────────────────────────────────────────────────────────────
function ModifyModal({ reservation, onClose, onSave }) {
    const { t, i18n } = useTranslation();
    const [checkIn, setCheckIn] = useState(reservation.checkInDate);
    const [checkOut, setCheckOut] = useState(reservation.checkOutDate);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Room Selection
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(reservation.roomId);

    // Fetch available rooms whenever dates change
    useEffect(() => {
        if (!checkIn || !checkOut || checkOut <= checkIn) {
            setAvailableRooms([]);
            return;
        }

        const fetchRooms = async () => {
            setLoadingRooms(true);
            try {
                const data = await searchRooms({ checkIn, checkOut });
                // We also inject the currently booked room so they can keep it,
                // even if it appears "booked" (since they are the ones holding it).
                // The backend allows updating without changing the room.
                const realRooms = data.rooms || [];
                const isCurrentRoomInResults = realRooms.some(r => r.id === reservation.roomId);
                
                if (!isCurrentRoomInResults) {
                    realRooms.push({
                        id: reservation.roomId,
                        roomNumber: reservation.roomNumber,
                        roomType: { name: reservation.roomTypeName, basePrice: reservation.roomRate, maxGuests: reservation.guestCapacity || 2 }
                    });
                }
                setAvailableRooms(realRooms);
                // Reset selected room if it's no longer in the list (though we just forced it in above)
                setSelectedRoomId(reservation.roomId);
            } catch (err) {
                console.error('Failed to fetch rooms', err);
            } finally {
                setLoadingRooms(false);
            }
        };

        fetchRooms();
    }, [checkIn, checkOut, reservation.roomId, reservation.roomNumber, reservation.roomTypeName, reservation.roomRate, reservation.guestCapacity]);

    const nights = useMemo(() => {
        if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
        return Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000);
    }, [checkIn, checkOut]);

    const selectedRoom = useMemo(() => {
        return availableRooms.find(r => r.id === Number(selectedRoomId));
    }, [availableRooms, selectedRoomId]);

    const subtotal = (selectedRoom?.roomType?.basePrice || reservation.roomRate) * nights;
    const taxes = subtotal * 0.10;
    const totalPrice = subtotal + taxes;

    const unchanged = checkIn === reservation.checkInDate &&
                      checkOut === reservation.checkOutDate &&
                      Number(selectedRoomId) === reservation.roomId;

    const handleSave = async () => {
        if (nights <= 0) return setError(t('checkoutAfterCheckin'));
        if (!reason.trim()) return setError(t('provideReason'));
        if (unchanged) return setError(t('noChangesDetected'));

        setError(null);
        setSaving(true);
        try {
            const data = {
                checkInDate: checkIn,
                checkOutDate: checkOut,
                roomId: selectedRoomId,
                modificationReason: reason
            };
            const result = await modifyReservation(reservation.id || reservation.confirmationNumber, data);
            
            // Build updated object for the UI (mock update)
            const updated = {
                 ...reservation,
                 checkInDate: checkIn,
                 checkOutDate: checkOut,
                 roomId: selectedRoomId,
                 roomNumber: selectedRoom?.roomNumber || reservation.roomNumber,
                 roomTypeName: selectedRoom?.roomType?.name || reservation.roomTypeName,
                 roomRate: selectedRoom?.roomType?.basePrice || reservation.roomRate,
                 nights, subtotal, taxes, totalPrice
            };
            
            onSave(updated, result);
        } catch (err) {
            setError(extractReservationError(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 px-8 py-5">
                    <div>
                        <h2 className="text-xl font-extrabold text-black tracking-tight">{t('modifyReservationTitle')}</h2>
                        <p className="text-xs text-zinc-400 font-mono font-bold mt-1"><LtrText>{reservation.confirmationNumber}</LtrText></p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-black transition focus:outline-none focus:ring-2 focus:ring-zinc-300" aria-label="Close">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className="px-8 py-6 flex flex-col gap-5">
                    <ErrorBanner message={error} onClose={() => setError(null)} />

                    {/* Current info */}
                    <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 text-sm">
                        <p className="text-xs text-zinc-400 mb-2 font-bold uppercase tracking-widest">{t('currentBooking')}</p>
                        <p className="text-black font-bold">{t('room')} <strong><LtrText>{reservation.roomNumber}</LtrText></strong> · {reservation.guestName}</p>
                        <p className="text-zinc-500 font-medium text-xs mt-1"><LtrText>{formatDate(reservation.checkInDate, i18n.language)}</LtrText> → <LtrText>{formatDate(reservation.checkOutDate, i18n.language)}</LtrText> ({reservation.nights} {t('nights')})</p>
                    </div>

                    {/* Date change */}
                    <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">{t('selectNewDates')}</p>
                        <DateRangePicker
                            checkIn={checkIn}
                            checkOut={checkOut}
                            onCheckInChange={setCheckIn}
                            onCheckOutChange={setCheckOut}
                        />
                    </div>

                    {/* Room change */}
                    {nights > 0 && (
                        <div>
                            <p className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-widest">{t('selectRoom')}</p>
                            {loadingRooms ? (
                                <div className="h-12 animate-pulse rounded-full bg-zinc-100" />
                            ) : availableRooms.length > 0 ? (
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
                                >
                                    {availableRooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {t('room')} {r.roomNumber} ({r.roomType?.name}) — {money(r.roomType?.basePrice)}/{t('nights')}
                                            {r.id === reservation.roomId ? ` ${t('currentRoomSuffix')}` : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-red-600">{t('noRoomsAvailable')}</p>
                            )}
                        </div>
                    )}

                    {/* New price preview */}
                    {nights > 0 && (
                        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-4">
                            <p className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-widest">{t('updatedPricePreview')}</p>
                            <div className="flex flex-col gap-2 text-sm text-black">
                                <div className="flex justify-between font-medium"><span>{nights} {t('nights')} × <LtrText>{money(selectedRoom?.roomType?.basePrice || reservation.roomRate)}</LtrText></span><span><LtrText>{money(subtotal)}</LtrText></span></div>
                                <div className="flex justify-between font-medium"><span>{t('taxes')}</span><span><LtrText>{money(taxes)}</LtrText></span></div>
                                <div className="flex justify-between border-t border-zinc-100 pt-2 mt-1 font-extrabold text-lg"><span>{t('newTotal')}</span><span><LtrText>{money(totalPrice)}</LtrText></span></div>
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="modify-reason" className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            {t('reasonForModification')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="modify-reason"
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('modifyReasonPlaceholder')}
                            className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-black transition focus:bg-white focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-black hover:bg-zinc-50 transition focus:outline-none focus:ring-2 focus:ring-zinc-300">
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || unchanged || nights <= 0 || !reason.trim() || !selectedRoomId}
                            className="flex-1 rounded-full bg-black py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-zinc-400"
                        >
                            {saving ? t('saving') : t('saveChanges')}
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
    const { t, i18n } = useTranslation();

    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSelect = (r) => { setSelected(r); setShowModal(false); };

    const handleSave = (updated) => {
        setSelected(updated);
        setShowModal(false);
        setToast({ message: t('modifySuccess', { conf: updated.confirmationNumber }), type: 'success' });
    };

    return (
        <div className="h-full bg-zinc-50 p-6 lg:p-8">
            <ConfirmationToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

            {showModal && selected && (
                <ModifyModal
                    reservation={selected}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}

            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-bold text-black hover:bg-white transition shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300">
                    {t('back')}
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-black">{t('modifyReservationTitle')}</h1>
                    <p className="text-sm font-medium text-zinc-500 mt-1">{t('modifyReservationDesc')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Lookup */}
                <div><ReservationLookupPanel onSelect={handleSelect} /></div>

                {/* Selected reservation */}
                <div>
                    {!selected ? (
                        <div className="flex h-full min-h-[250px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-300 bg-transparent p-12 text-center">
                            <span className="text-5xl mb-4">📋</span>
                            <p className="text-sm font-bold text-black">{t('noReservationSelected')}</p>
                            <p className="text-xs font-medium text-zinc-500 mt-2">{t('searchAndSelectToModify')}</p>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
                            <div className="mb-6 flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-xl font-extrabold text-black">{selected.guestName}</p>
                                    <p className="text-xs font-mono font-bold text-zinc-400 mt-1"><LtrText>{selected.confirmationNumber}</LtrText></p>
                                </div>
                                <StatusPill status={selected.status} />
                            </div>

                            {!MODIFIABLE_STATUSES.includes(selected.status) && (
                                <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                                    {t('cannotModify')} <strong>{t(selected.status.toLowerCase()) || selected.status.replace('_', ' ')}</strong>.
                                </div>
                            )}

                            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm mb-6">
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('room')}</dt><dd className="font-bold text-black mt-1">{t('room')} <LtrText>{selected.roomNumber}</LtrText> · {selected.roomTypeName}</dd></div>
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('floor')}</dt><dd className="font-bold text-black mt-1">{selected.floor}</dd></div>
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('checkInDate')}</dt><dd className="font-bold text-black mt-1"><LtrText>{formatDate(selected.checkInDate, i18n.language)}</LtrText></dd></div>
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('checkOutDate')}</dt><dd className="font-bold text-black mt-1"><LtrText>{formatDate(selected.checkOutDate, i18n.language)}</LtrText></dd></div>
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('nights')}</dt><dd className="font-bold text-black mt-1">{selected.nights}</dd></div>
                                <div><dt className="text-xs font-bold uppercase tracking-wide text-zinc-400">{t('total')}</dt><dd className="font-extrabold text-lg text-black mt-1"><LtrText>{money(selected.totalPrice)}</LtrText></dd></div>
                            </dl>

                            {MODIFIABLE_STATUSES.includes(selected.status) && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="w-full rounded-full bg-black py-4 text-sm font-bold text-white transition hover:bg-zinc-800 shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-400"
                                >
                                    {t('modifyDatesButton')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
