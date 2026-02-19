import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ROOMS } from '../data/mockRooms';
import DateRangePicker from '../components/DateRangePicker';
import RoomFilters from '../components/RoomFilters';

const EMPTY_FILTERS = { status: 'Available', type: '', floor: '', minPrice: '', maxPrice: '' };

const STATUS_COLORS = {
    Available: 'bg-green-100 text-green-800',
    Occupied: 'bg-red-100 text-red-800',
    Maintenance: 'bg-yellow-100 text-yellow-800',
    Reserved: 'bg-blue-100 text-blue-800',
};

/**
 * RoomSearch  –  /search
 * Staff / Manager view: search available rooms by date + filters.
 * "Book Now" navigates to /book?roomId=<id> with dates in state.
 * Uses mock data only; no API calls.
 */
export default function RoomSearch() {
    const navigate = useNavigate();

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

    const [checkIn, setCheckIn] = useState(today);
    const [checkOut, setCheckOut] = useState(tomorrow);
    const [filters, setFilters] = useState(EMPTY_FILTERS);

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

    const handleBookNow = (room) => {
        navigate(`/book?roomId=${room.id}`, { state: { checkIn, checkOut } });
    };

    const nights = useMemo(() => {
        if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
        return Math.round((new Date(checkOut) - new Date(checkIn)) / 86_400_000);
    }, [checkIn, checkOut]);

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Room Search</h1>
                <p className="mt-1 text-sm text-gray-500">Find and book available rooms for guests.</p>
            </div>

            {/* Date Picker Card */}
            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">Select Stay Dates</h2>
                <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onCheckInChange={setCheckIn}
                    onCheckOutChange={setCheckOut}
                />
                {nights > 0 && (
                    <p className="mt-3 text-sm text-blue-600 font-medium">
                        📆 {nights} night{nights !== 1 ? 's' : ''} selected
                    </p>
                )}
            </div>

            {/* Filters */}
            <div className="mb-6">
                <RoomFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClear={() => setFilters(EMPTY_FILTERS)}
                />
            </div>

            {/* Results Header */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                    {filteredRooms.length} Room{filteredRooms.length !== 1 ? 's' : ''} Found
                </h2>
            </div>

            {/* Room Cards Grid */}
            {filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
                    <span className="text-5xl mb-4">🔍</span>
                    <p className="text-lg font-semibold text-gray-600">No rooms match your filters</p>
                    <p className="mt-1 text-sm text-gray-400">Try adjusting the status or price range.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredRooms.map((room) => (
                        <div
                            key={room.id}
                            className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                        >
                            {/* Room Image Placeholder */}
                            <div className="flex h-36 items-center justify-center rounded-t-xl bg-gradient-to-br from-blue-50 to-indigo-100">
                                <span className="text-4xl">{room.type === 'Suite' ? '🛎️' : room.type === 'Family' ? '👨‍👩‍👧‍👦' : '🛏️'}</span>
                            </div>

                            <div className="flex flex-1 flex-col p-4">
                                {/* Title & Badge */}
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Room {room.roomNumber}</h3>
                                        <p className="text-xs text-gray-500">Floor {room.floor} · {room.type}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[room.status]}`}>
                                        {room.status}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="mb-3 text-xs text-gray-500 line-clamp-2">{room.description}</p>

                                {/* Amenities */}
                                <div className="mb-3 flex flex-wrap gap-1">
                                    {room.amenities.slice(0, 3).map((a) => (
                                        <span key={a} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{a}</span>
                                    ))}
                                    {room.amenities.length > 3 && (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">+{room.amenities.length - 3}</span>
                                    )}
                                </div>

                                {/* Price & Max Guests */}
                                <div className="mt-auto flex items-end justify-between">
                                    <div>
                                        <span className="text-xl font-bold text-gray-900">${room.price}</span>
                                        <span className="text-xs text-gray-400"> / night</span>
                                        {nights > 0 && (
                                            <p className="text-xs text-blue-600 font-medium">
                                                Total: ${room.price * nights}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">👥 {room.maxGuests} guests</span>
                                </div>

                                {/* Book Now */}
                                <button
                                    onClick={() => handleBookNow(room)}
                                    disabled={room.status !== 'Available'}
                                    className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    {room.status === 'Available' ? 'Book Now' : room.status}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
