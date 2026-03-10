import { useState, useEffect, useMemo } from 'react';
import { useRooms } from '../hooks/useRooms';
import { useRoomTypes } from '../hooks/useRoomTypes';
import RoomFilters from '../components/RoomFilters';
import ErrorBanner from '../components/ErrorBanner';
import { useTranslation } from 'react-i18next';

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FILTERS = { status: '', type: '', floor: '', minPrice: '', maxPrice: '' };

const BACKEND_STATUSES = [
    'AVAILABLE',
    'OCCUPIED',
    'NEEDS_CLEANING',
    'UNDER_MAINTENANCE',
];

const STATUS_COLORS = {
    AVAILABLE: 'border border-zinc-300 bg-white text-black shadow-sm',
    OCCUPIED: 'bg-black text-white border-transparent',
    NEEDS_CLEANING: 'bg-zinc-100 text-zinc-600 border-transparent',
    UNDER_MAINTENANCE: 'bg-zinc-200 text-zinc-700 border-transparent',
};

const STATUS_LABELS = {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    NEEDS_CLEANING: 'Needs Cleaning',
    UNDER_MAINTENANCE: 'Under Maintenance',
};

// ─── Add Room Modal ───────────────────────────────────────────────────────────
function AddRoomModal({ roomTypes, onSave, onClose }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        roomNumber: '',
        roomTypeId: roomTypes[0]?.id ?? '',
        floor: 1,
        status: 'AVAILABLE',
    });
    const [formError, setFormError] = useState(null);
    const [saving, setSaving] = useState(false);

    const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        if (!form.roomNumber.trim()) return setFormError(t('roomNumRequired') || 'Room number is required.');
        if (!form.roomTypeId) return setFormError(t('roomTypeRequired') || 'Please select a room type.');

        setSaving(true);
        const result = await onSave({
            roomNumber: form.roomNumber.trim(),
            roomTypeId: Number(form.roomTypeId),
            floor: Number(form.floor) || null,
            status: form.status,
        });
        setSaving(false);

        if (result.success) {
            onClose();
        } else {
            setFormError(result.error ?? (t('failedCreateRoom') || 'Failed to create room.'));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-all pb-[10vh]">
            <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                <h2 className="mb-6 text-xl font-extrabold text-black tracking-tight">{t('addNewRoom') || 'Add New Room'}</h2>

                <ErrorBanner message={formError} onClose={() => setFormError(null)} />

                <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-5">
                    {/* Room Number */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="add-roomNumber" className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                            {t('roomNumLabel') || 'Room Number'} <span className="text-black">*</span>
                        </label>
                        <input
                            id="add-roomNumber"
                            type="text"
                            placeholder={t('roomNumPlaceholder') || "e.g. 305"}
                            value={form.roomNumber}
                            onChange={(e) => set('roomNumber', e.target.value)}
                            className="h-12 rounded-full border border-zinc-200 px-5 text-sm font-medium focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>

                    {/* Room Type */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="add-roomType" className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                            {t('roomTypeLabel') || 'Room Type'} <span className="text-black">*</span>
                        </label>
                        <select
                            id="add-roomType"
                            value={form.roomTypeId}
                            onChange={(e) => set('roomTypeId', e.target.value)}
                            className="h-12 rounded-full border border-zinc-200 px-5 text-sm font-medium focus:border-black focus:outline-none focus:ring-1 focus:ring-black bg-white"
                        >
                            {roomTypes.map((rt) => (
                                <option key={rt.id} value={rt.id}>{rt.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Floor */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="add-floor" className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t('floorLabel') || 'Floor'}</label>
                        <input
                            id="add-floor"
                            type="number"
                            min="1"
                            value={form.floor}
                            onChange={(e) => set('floor', e.target.value)}
                            className="h-12 rounded-full border border-zinc-200 px-5 text-sm font-medium focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>

                    {/* Initial Status */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="add-status" className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t('initialStatusLabel') || 'Initial Status'}</label>
                        <select
                            id="add-status"
                            value={form.status}
                            onChange={(e) => set('status', e.target.value)}
                            className="h-12 rounded-full border border-zinc-200 px-5 text-sm font-medium focus:border-black focus:outline-none focus:ring-1 focus:ring-black bg-white"
                        >
                            {BACKEND_STATUSES.map((s) => (
                                <option key={s} value={s}>{t(`status${s.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase()).replace(/^[a-z]/, (m) => m.toUpperCase())}`) || STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-extrabold text-black hover:bg-zinc-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white hover:bg-zinc-800 disabled:opacity-60 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {saving ? (t('savingMsg') || 'Saving…') : (t('saveRoomBtn') || 'Save Room')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Update Status Modal ──────────────────────────────────────────────────────
function UpdateStatusModal({ room, onSave, onClose }) {
    const { t } = useTranslation();
    const [selectedStatus, setSelectedStatus] = useState(room.status);
    const [modalError, setModalError] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError(null);
        if (selectedStatus === room.status) return onClose();

        setSaving(true);
        const result = await onSave(room.id, selectedStatus);
        setSaving(false);

        if (result.success) {
            onClose();
        } else {
            setModalError(result.error ?? (t('failedUpdateStatus') || 'Failed to update status.'));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 pb-[10vh]">
            <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                <h2 className="mb-2 text-2xl font-extrabold text-black tracking-tight">{t('updateRoomStatus') || 'Update Room Status'}</h2>
                <p className="mb-6 text-sm font-medium text-zinc-500">
                    {t('roomNumber', { number: room.roomNumber }) || `Room ${room.roomNumber}`} — {t('currentLabel') || 'current:'}{' '}
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold border ${STATUS_COLORS[room.status]}`}>
                        {t(`status${room.status.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase()).replace(/^[a-z]/, (m) => m.toUpperCase())}`) || STATUS_LABELS[room.status]}
                    </span>
                </p>

                <ErrorBanner message={modalError} onClose={() => setModalError(null)} />

                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="update-status" className="text-xs font-bold uppercase tracking-widest text-zinc-500">{t('newStatusLabel') || 'New Status'}</label>
                        <select
                            id="update-status"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-12 rounded-full border border-zinc-200 px-5 text-sm font-medium focus:border-black focus:outline-none focus:ring-1 focus:ring-black bg-white"
                        >
                            {BACKEND_STATUSES.map((s) => (
                                <option key={s} value={s}>{t(`status${s.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase()).replace(/^[a-z]/, (m) => m.toUpperCase())}`) || STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Transition hint */}
                    {selectedStatus === 'AVAILABLE' && room.status === 'OCCUPIED' && (
                        <p className="rounded-2xl bg-zinc-100 border border-zinc-200 px-4 py-3 text-xs font-bold text-zinc-600">
                            {t('occupyToAvailWarning') || '⚠️ The backend will reject OCCUPIED → AVAILABLE directly. Set to Needs Cleaning first.'}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-extrabold text-black hover:bg-zinc-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white hover:bg-zinc-800 disabled:opacity-60 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {saving ? (t('savingMsg') || 'Saving…') : (t('updateStatusBtn') || 'Update Status')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * RoomsManagement  –  /rooms-management
 * Manager view: live data from GET /api/rooms with server-side + client-side filters.
 * Wired to real API via useRooms hook (Day 2).
 */
export default function RoomsManagement() {
    const { t } = useTranslation();
    const {
        rooms, loading, error,
        fetchRooms, addRoom, changeStatus, removeRoom, clearError,
    } = useRooms();

    const { roomTypes, fetchRoomTypes } = useRoomTypes();

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [showAddModal, setShowAddModal] = useState(false);
    const [statusModal, setStatusModal] = useState(null); // room object | null
    const [bannerError, setBannerError] = useState(null);

    // On mount: load rooms (no filters) and room types (for the Add form dropdown)
    useEffect(() => {
        fetchRooms();
        fetchRoomTypes();
    }, [fetchRooms, fetchRoomTypes]);

    // Build API params from filters and re-fetch when they change
    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);

        // Server handles status, type, floor; we still apply price client-side below
        const apiParams = {};
        if (newFilters.status) apiParams.status = newFilters.status;
        if (newFilters.type) apiParams.type = newFilters.type;
        if (newFilters.floor) apiParams.floor = Number(newFilters.floor);

        fetchRooms(apiParams);
    };

    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        fetchRooms();
    };

    // Client-side price filter (not supported by the current backend endpoint)
    const displayedRooms = useMemo(() => {
        const minP = filters.minPrice ? Number(filters.minPrice) : null;
        const maxP = filters.maxPrice ? Number(filters.maxPrice) : null;
        if (!minP && !maxP) return rooms;

        return rooms.filter((room) => {
            const price = room.roomType?.basePrice ?? 0;
            if (minP && price < minP) return false;
            if (maxP && price > maxP) return false;
            return true;
        });
    }, [rooms, filters.minPrice, filters.maxPrice]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleAddRoom = async (data) => {
        const result = await addRoom(data);
        return result;
    };

    const handleChangeStatus = async (id, status) => {
        const result = await changeStatus(id, status);
        return result;
    };

    const handleDelete = async (room) => {
        if (!window.confirm(
            `Delete Room ${room.roomNumber}? This cannot be undone.`
        )) return;

        const result = await removeRoom(room.id);
        if (!result.success) {
            setBannerError(result.error ?? 'Failed to delete room.');
        }
    };

    return (
        <div className="h-full bg-zinc-50 p-6 lg:p-8">
            {/* ── Header ── */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold text-black tracking-tight">{t('roomsTitle') || 'Rooms Management'}</h1>
                    <p className="mt-2 text-sm font-medium text-zinc-500">
                        {loading ? (t('loadingRooms') || 'Loading…') : (t('roomsShown', { count: displayedRooms.length }) || `${displayedRooms.length} room${displayedRooms.length !== 1 ? 's' : ''} shown`)}
                        {!loading && rooms.length !== displayedRooms.length && (t('filteredFrom', { total: rooms.length }) || ` (filtered from ${rooms.length})`)}
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white shadow-md transition-all hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                    {t('addRoomBtn') || '＋ Add Room'}
                </button>
            </div>

            {/* ── Error Banner ── */}
            <div className="mb-6">
                <ErrorBanner
                    message={bannerError ?? error}
                    onClose={() => { setBannerError(null); clearError(); }}
                />
            </div>

            {/* ── Filters ── */}
            <div className="mb-6">
                <RoomFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClear={handleClearFilters}
                />
            </div>

            {/* ── Loading skeleton ── */}
            {loading && (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-gray-200" />
                    ))}
                </div>
            )}

            {/* ── Table ── */}
            {!loading && (
                <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-zinc-200 text-sm">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200">
                                {['colRoomNum', 'colFloor', 'colType', 'colStatus', 'colBasePrice', 'colMaxGuests', 'colAmenities', 'colActions'].map((h) => (
                                    <th
                                        key={h}
                                        className="px-6 py-4 text-start pl-8 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400"
                                    >
                                        {t(h)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                            {displayedRooms.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-14 text-center text-zinc-500 font-medium">
                                        {t('noRoomsMatched') || 'No rooms match the current filters.'}
                                    </td>
                                </tr>
                            ) : (
                                displayedRooms.map((room) => {
                                    const amenities = room.roomType?.amenities
                                        ? room.roomType.amenities.split(',').map((a) => a.trim()).filter(Boolean)
                                        : [];

                                    return (
                                        <tr key={room.id} className="transition-colors hover:bg-zinc-50">
                                            <td className="px-6 pl-8 py-5 text-xl font-extrabold text-black">{room.roomNumber}</td>
                                            <td className="px-6 py-5 text-zinc-500 font-bold">{room.floor ?? '—'}</td>
                                            <td className="px-6 py-5 text-zinc-900 font-bold">{room.roomType?.name ?? '—'}</td>
                                            <td className="px-6 py-5">
                                                <span
                                                    className={`inline-flex items-center cursor-pointer rounded-full px-3 py-1 text-[10px] uppercase font-extrabold tracking-wider transition hover:opacity-80 border ${STATUS_COLORS[room.status] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}
                                                    title={t('clickRowActions') || "Click row actions to change status"}
                                                >
                                                    {t(`status${room.status.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase()).replace(/^[a-z]/, (m) => m.toUpperCase())}`) || (STATUS_LABELS[room.status] ?? room.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 font-bold text-black">
                                                ${room.roomType?.basePrice?.toFixed(2) ?? '—'}
                                            </td>
                                            <td className="px-6 py-5 text-zinc-500 font-bold">
                                                {room.roomType?.maxGuests ?? '—'}
                                            </td>
                                            <td className="px-6 py-5 max-w-xs">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {amenities.slice(0, 3).map((a) => (
                                                        <span key={a} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold text-zinc-600 border border-zinc-200">{a}</span>
                                                    ))}
                                                    {amenities.length > 3 && (
                                                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-extrabold text-white">
                                                            +{amenities.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    {/* Change Status */}
                                                    <button
                                                        onClick={() => setStatusModal(room)}
                                                        title={t('updateStatusTitle') || "Update status"}
                                                        className="rounded-full p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-black focus:outline-none bg-zinc-50 border border-transparent hover:border-zinc-200"
                                                    >
                                                        🔄
                                                    </button>
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(room)}
                                                        title={t('deleteRoomTitle') || "Delete room"}
                                                        className="rounded-full p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none bg-zinc-50 border border-transparent hover:border-red-100"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Add Room Modal ── */}
            {showAddModal && (
                <AddRoomModal
                    roomTypes={roomTypes}
                    onSave={handleAddRoom}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {/* ── Update Status Modal ── */}
            {statusModal && (
                <UpdateStatusModal
                    room={statusModal}
                    onSave={handleChangeStatus}
                    onClose={() => setStatusModal(null)}
                />
            )}
        </div>
    );
}
