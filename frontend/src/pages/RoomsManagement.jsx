import { useState, useEffect, useMemo } from 'react';
import { useRooms } from '../hooks/useRooms';
import { useRoomTypes } from '../hooks/useRoomTypes';
import RoomFilters from '../components/RoomFilters';
import ErrorBanner from '../components/ErrorBanner';

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FILTERS = { status: '', type: '', floor: '', minPrice: '', maxPrice: '' };

const BACKEND_STATUSES = [
    'AVAILABLE',
    'OCCUPIED',
    'NEEDS_CLEANING',
    'UNDER_MAINTENANCE',
];

const STATUS_COLORS = {
    AVAILABLE: 'bg-green-100 text-green-800',
    OCCUPIED: 'bg-red-100 text-red-800',
    NEEDS_CLEANING: 'bg-yellow-100 text-yellow-800',
    UNDER_MAINTENANCE: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS = {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    NEEDS_CLEANING: 'Needs Cleaning',
    UNDER_MAINTENANCE: 'Under Maintenance',
};

// ─── Add Room Modal ───────────────────────────────────────────────────────────
function AddRoomModal({ roomTypes, onSave, onClose }) {
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
        if (!form.roomNumber.trim()) return setFormError('Room number is required.');
        if (!form.roomTypeId) return setFormError('Please select a room type.');

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
            setFormError(result.error ?? 'Failed to create room.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h2 className="mb-4 text-lg font-bold text-gray-900">Add New Room</h2>

                <ErrorBanner message={formError} onClose={() => setFormError(null)} />

                <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
                    {/* Room Number */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="add-roomNumber" className="text-xs font-medium text-gray-600">
                            Room Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="add-roomNumber"
                            type="text"
                            placeholder="e.g. 305"
                            value={form.roomNumber}
                            onChange={(e) => set('roomNumber', e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* Room Type */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="add-roomType" className="text-xs font-medium text-gray-600">
                            Room Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="add-roomType"
                            value={form.roomTypeId}
                            onChange={(e) => set('roomTypeId', e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                            {roomTypes.map((rt) => (
                                <option key={rt.id} value={rt.id}>{rt.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Floor */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="add-floor" className="text-xs font-medium text-gray-600">Floor</label>
                        <input
                            id="add-floor"
                            type="number"
                            min="1"
                            value={form.floor}
                            onChange={(e) => set('floor', e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {/* Initial Status */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="add-status" className="text-xs font-medium text-gray-600">Initial Status</label>
                        <select
                            id="add-status"
                            value={form.status}
                            onChange={(e) => set('status', e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                            {BACKEND_STATUSES.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                        >
                            {saving ? 'Saving…' : 'Save Room'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Update Status Modal ──────────────────────────────────────────────────────
function UpdateStatusModal({ room, onSave, onClose }) {
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
            setModalError(result.error ?? 'Failed to update status.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <h2 className="mb-1 text-lg font-bold text-gray-900">Update Room Status</h2>
                <p className="mb-4 text-sm text-gray-500">
                    Room <strong>{room.roomNumber}</strong> — current:{' '}
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[room.status]}`}>
                        {STATUS_LABELS[room.status]}
                    </span>
                </p>

                <ErrorBanner message={modalError} onClose={() => setModalError(null)} />

                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="update-status" className="text-xs font-medium text-gray-600">New Status</label>
                        <select
                            id="update-status"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                            {BACKEND_STATUSES.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Transition hint */}
                    {selectedStatus === 'AVAILABLE' && room.status === 'OCCUPIED' && (
                        <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                            ⚠️ The backend will reject OCCUPIED → AVAILABLE directly.
                            Set to <strong>Needs Cleaning</strong> first.
                        </p>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                        >
                            {saving ? 'Saving…' : 'Update Status'}
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

    // Propagate hook-level errors to the banner
    useEffect(() => {
        if (error) setBannerError(error);
    }, [error]);

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
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            {/* ── Header ── */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Rooms Management</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {loading ? 'Loading…' : `${displayedRooms.length} room${displayedRooms.length !== 1 ? 's' : ''} shown`}
                        {!loading && rooms.length !== displayedRooms.length && ` (filtered from ${rooms.length})`}
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    ＋ Add Room
                </button>
            </div>

            {/* ── Error Banner ── */}
            <div className="mb-4">
                <ErrorBanner
                    message={bannerError}
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
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                            <tr className="bg-gray-50">
                                {['Room #', 'Floor', 'Type', 'Status', 'Base Price', 'Max Guests', 'Amenities', 'Actions'].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedRooms.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-14 text-center text-gray-400">
                                        No rooms match the current filters.
                                    </td>
                                </tr>
                            ) : (
                                displayedRooms.map((room) => {
                                    const amenities = room.roomType?.amenities
                                        ? room.roomType.amenities.split(',').map((a) => a.trim()).filter(Boolean)
                                        : [];

                                    return (
                                        <tr key={room.id} className="transition hover:bg-gray-50">
                                            <td className="px-4 py-3 font-semibold text-gray-900">{room.roomNumber}</td>
                                            <td className="px-4 py-3 text-gray-600">{room.floor ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-700">{room.roomType?.name ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold transition hover:opacity-80 ${STATUS_COLORS[room.status] ?? 'bg-gray-100 text-gray-700'}`}
                                                    title="Click row actions to change status"
                                                >
                                                    {STATUS_LABELS[room.status] ?? room.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                ${room.roomType?.basePrice?.toFixed(2) ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {room.roomType?.maxGuests ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 max-w-xs">
                                                <div className="flex flex-wrap gap-1">
                                                    {amenities.slice(0, 3).map((a) => (
                                                        <span key={a} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{a}</span>
                                                    ))}
                                                    {amenities.length > 3 && (
                                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                                            +{amenities.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {/* Change Status */}
                                                    <button
                                                        onClick={() => setStatusModal(room)}
                                                        title="Update status"
                                                        className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                    >
                                                        🔄
                                                    </button>
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(room)}
                                                        title="Delete room"
                                                        className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
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
