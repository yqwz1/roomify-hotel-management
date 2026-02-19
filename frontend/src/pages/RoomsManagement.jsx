import { useState, useMemo } from 'react';
import { MOCK_ROOMS } from '../data/mockRooms';
import RoomFilters from '../components/RoomFilters';
import ErrorBanner from '../components/ErrorBanner';

const EMPTY_FILTERS = { status: '', type: '', floor: '', minPrice: '', maxPrice: '' };

/** Status badge color map */
const STATUS_COLORS = {
    Available: 'bg-green-100 text-green-800',
    Occupied: 'bg-red-100 text-red-800',
    Maintenance: 'bg-yellow-100 text-yellow-800',
    Reserved: 'bg-blue-100 text-blue-800',
};

/**
 * RoomsManagement  –  /rooms-management
 * Manager view: filterable table of all rooms with add/edit/delete stubs.
 * Uses mock data only; no API calls.
 */
export default function RoomsManagement() {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    /** Client-side filtering applied to mock data */
    const filteredRooms = useMemo(() => {
        return MOCK_ROOMS.filter((room) => {
            if (filters.status && room.status !== filters.status) return false;
            if (filters.type && room.type !== filters.type) return false;
            if (filters.floor && String(room.floor) !== String(filters.floor)) return false;
            if (filters.minPrice && room.price < Number(filters.minPrice)) return false;
            if (filters.maxPrice && room.price > Number(filters.maxPrice)) return false;
            return true;
        });
    }, [filters]);

    const handleEdit = (room) => console.log('[stub] Edit room', room.id);
    const handleDelete = (room) => {
        // Demo: shows the error banner to showcase the component
        setError(`Cannot delete Room ${room.roomNumber} — it is currently ${room.status}. (Demo error)`);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            {/* Page Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Rooms Management</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} shown
                        {MOCK_ROOMS.length !== filteredRooms.length && ` (filtered from ${MOCK_ROOMS.length})`}
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <span>＋</span> Add Room
                </button>
            </div>

            {/* Error Banner */}
            <div className="mb-4">
                <ErrorBanner message={error} onClose={() => setError(null)} />
            </div>

            {/* Add Room Modal Stub */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="mb-2 text-lg font-bold text-gray-900">Add New Room</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Form fields will be wired to the backend on Day 2.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setShowAddModal(false); console.log('[stub] Save new room'); }}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Save Room
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="mb-6">
                <RoomFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClear={() => setFilters(EMPTY_FILTERS)}
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                        <tr className="bg-gray-50">
                            {['Room #', 'Floor', 'Type', 'Status', 'Price / Night', 'Max Guests', 'Amenities', 'Actions'].map((h) => (
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
                        {filteredRooms.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                    No rooms match the current filters.
                                </td>
                            </tr>
                        ) : (
                            filteredRooms.map((room) => (
                                <tr key={room.id} className="transition hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold text-gray-900">{room.roomNumber}</td>
                                    <td className="px-4 py-3 text-gray-600">{room.floor}</td>
                                    <td className="px-4 py-3 text-gray-700">{room.type}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[room.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                            {room.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">${room.price}</td>
                                    <td className="px-4 py-3 text-gray-600">{room.maxGuests}</td>
                                    <td className="px-4 py-3 text-gray-500 max-w-xs">
                                        <div className="flex flex-wrap gap-1">
                                            {room.amenities.slice(0, 3).map((a) => (
                                                <span key={a} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{a}</span>
                                            ))}
                                            {room.amenities.length > 3 && (
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">+{room.amenities.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(room)}
                                                title="Edit room"
                                                className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            >
                                                ✏️
                                            </button>
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
