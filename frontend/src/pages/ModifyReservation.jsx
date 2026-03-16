import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import DateRangePicker from '../components/DateRangePicker';
import ErrorBanner from '../components/ErrorBanner';
import { LtrText } from '../components/LtrText';
import { searchRooms } from '../services/searchService';
import { modifyReservation, extractReservationError } from '../services/reservationService';
import { useTranslation } from 'react-i18next';
import { reservationStatusRules, normalizeReservationStatusLabel } from '../domain/reservations/statusRules';

const formatDate = (iso) => {
    if (!iso) return '-';
    return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

const money = (v) => `$${Number(v ?? 0).toFixed(2)}`;

function ModifyModal({ reservation, onClose, onSave }) {
    const { t, i18n } = useTranslation();
    const [checkIn, setCheckIn] = useState(reservation.checkInDate);
    const [checkOut, setCheckOut] = useState(reservation.checkOutDate);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [availableRooms, setAvailableRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(reservation.roomId);

    useEffect(() => {
        if (!checkIn || !checkOut || checkOut <= checkIn) {
            setAvailableRooms([]);
            return;
        }

        const fetchRooms = async () => {
            setLoadingRooms(true);
            try {
                const data = await searchRooms({ checkIn, checkOut });
                const roomList = [...(data.rooms || [])];
                const hasCurrentRoom = roomList.some((room) => room.id === reservation.roomId);

                if (!hasCurrentRoom) {
                    roomList.push({
                        id: reservation.roomId,
                        roomNumber: reservation.roomNumber,
                        roomType: {
                            name: reservation.roomTypeName,
                            basePrice: reservation.roomRate,
                            maxGuests: reservation.guestCapacity || 2,
                        },
                    });
                }

                setAvailableRooms(roomList);
                setSelectedRoomId(reservation.roomId);
            } catch {
                setAvailableRooms([]);
            } finally {
                setLoadingRooms(false);
            }
        };

        fetchRooms();
    }, [
        checkIn,
        checkOut,
        reservation.roomId,
        reservation.roomNumber,
        reservation.roomTypeName,
        reservation.roomRate,
        reservation.guestCapacity,
    ]);

    const nights = useMemo(() => {
        if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
        return Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
    }, [checkIn, checkOut]);

    const selectedRoom = useMemo(
        () => availableRooms.find((room) => room.id === Number(selectedRoomId)),
        [availableRooms, selectedRoomId]
    );

    const nightlyRate = selectedRoom?.roomType?.basePrice || reservation.roomRate;
    const subtotal = nightlyRate * nights;
    const taxes = subtotal * 0.1;
    const totalPrice = subtotal + taxes;

    const unchanged =
        checkIn === reservation.checkInDate &&
        checkOut === reservation.checkOutDate &&
        Number(selectedRoomId) === reservation.roomId;

    const handleSave = async () => {
        if (nights <= 0) {
            setError('Check-out must be after check-in.');
            return;
        }
        if (unchanged) {
            setError('No changes detected.');
            return;
        }

        setError(null);
        setSaving(true);

        try {
            const payload = {
                checkInDate: checkIn,
                checkOutDate: checkOut,
                roomId: Number(selectedRoomId),
            };
            const trimmedReason = reason.trim();
            if (trimmedReason) {
                payload.modificationReason = trimmedReason;
            }

            const result = await modifyReservation(
                reservation.id ?? reservation.confirmationNumber,
                payload
            );

            const updated = {
                ...reservation,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                roomId: Number(selectedRoomId),
                roomNumber: selectedRoom?.roomNumber || reservation.roomNumber,
                roomTypeName: selectedRoom?.roomType?.name || reservation.roomTypeName,
                roomRate: nightlyRate,
                nights,
                subtotal,
                taxes,
                totalPrice,
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
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Modify Reservation</h2>
                        <p className="font-mono text-xs text-gray-400">{reservation.confirmationNumber}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col gap-4 px-6 py-5">
                    <ErrorBanner message={error} onClose={() => setError(null)} />

                    <div className="rounded-lg bg-gray-50 p-3 text-sm">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Current Booking</p>
                        <p className="text-gray-700">Room <strong>{reservation.roomNumber}</strong> | {reservation.guestName}</p>
                        <p className="text-xs text-gray-500">
                            {formatDate(reservation.checkInDate)} to {formatDate(reservation.checkOutDate)} ({reservation.nights} nights)
                        </p>
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-semibold text-gray-600">1. Select New Dates</p>
                        <DateRangePicker
                            checkIn={checkIn}
                            checkOut={checkOut}
                            onCheckInChange={setCheckIn}
                            onCheckOutChange={setCheckOut}
                        />
                    </div>

                    {nights > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold text-gray-600">2. Select Room</p>
                            {loadingRooms ? (
                                <div className="h-12 animate-pulse rounded-full bg-zinc-100" />
                            ) : availableRooms.length > 0 ? (
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5"
                                >
                                    {availableRooms.map((room) => (
                                        <option key={room.id} value={room.id}>
                                            Room {room.roomNumber} ({room.roomType?.name}) - {money(room.roomType?.basePrice)}/night
                                            {room.id === reservation.roomId ? ' (Current)' : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-red-600">{t('noRoomsAvailable')}</p>
                            )}
                        </div>
                    )}

                    {nights > 0 && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                            <p className="mb-2 text-xs font-semibold text-blue-700">Updated Price Preview</p>
                            <div className="flex flex-col gap-1 text-sm text-blue-900">
                                <div className="flex justify-between"><span>{nights} nights x {money(nightlyRate)}</span><span>{money(subtotal)}</span></div>
                                <div className="flex justify-between"><span>Taxes (10%)</span><span>{money(taxes)}</span></div>
                                <div className="mt-1 flex justify-between border-t border-blue-200 pt-1 font-bold"><span>New Total</span><span>{money(totalPrice)}</span></div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="modify-reason" className="text-xs font-medium text-gray-600">
                            Reason for modification (optional)
                        </label>
                        <input
                            id="modify-reason"
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Guest request, room preference, etc."
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || unchanged || nights <= 0 || !selectedRoomId}
                            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ModifyReservation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState(null);

    const initialQuery = useMemo(
        () => String(location.state?.initialQuery ?? '').trim(),
        [location.state?.initialQuery]
    );

    const handleSelect = (reservation) => {
        setSelected(reservation);
        setShowModal(false);
    };

    const handleSave = (updated) => {
        setSelected(updated);
        setShowModal(false);
        setToast({ message: t('modifySuccess', { conf: updated.confirmationNumber }), type: 'success' });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <ConfirmationToast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />

            {showModal && selected && (
                <ModifyModal
                    reservation={selected}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
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
                    <h1 className="text-3xl font-extrabold text-black">{t('modifyReservationTitle')}</h1>
                    <p className="text-sm font-medium text-zinc-500 mt-1">{t('modifyReservationDesc')}</p>
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
                            <p className="mt-1 text-xs text-gray-400">Search and select a reservation to modify it.</p>
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

                            {!reservationStatusRules.canModify(selected.status) && (
                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    This reservation cannot be modified because status is <strong>{normalizeReservationStatusLabel(selected.status)}</strong>.
                                </div>
                            )}

                            <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                <div><dt className="text-xs text-gray-400">Room</dt><dd className="font-semibold">Room {selected.roomNumber} | {selected.roomTypeName}</dd></div>
                                <div><dt className="text-xs text-gray-400">Floor</dt><dd className="font-semibold">{selected.floor}</dd></div>
                                <div><dt className="text-xs text-gray-400">Check-In</dt><dd className="font-semibold">{formatDate(selected.checkInDate)}</dd></div>
                                <div><dt className="text-xs text-gray-400">Check-Out</dt><dd className="font-semibold">{formatDate(selected.checkOutDate)}</dd></div>
                                <div><dt className="text-xs text-gray-400">Nights</dt><dd className="font-semibold">{selected.nights}</dd></div>
                                <div><dt className="text-xs text-gray-400">Total</dt><dd className="font-bold text-blue-700">{money(selected.totalPrice)}</dd></div>
                            </dl>

                            {reservationStatusRules.canModify(selected.status) && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="w-full rounded-full bg-black py-4 text-sm font-bold text-white transition hover:bg-zinc-800 shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-400"
                                >
                                    Modify Dates
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
