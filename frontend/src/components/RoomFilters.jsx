import PropTypes from 'prop-types';
import { ROOM_TYPES, ROOM_STATUSES, FLOORS } from '../data/mockRooms';

/**
 * RoomFilters
 * A filter panel for rooms — status, type, floor, and price range.
 * Pure UI: all filtering logic lives in the parent page component.
 *
 * Props:
 *   filters          {Object}    – { status, type, floor, minPrice, maxPrice }
 *   onFiltersChange  {Function}  – (updatedFilters: Object) => void
 *   onClear          {Function}  – Called when the user clears all filters.
 */
export default function RoomFilters({ filters, onFiltersChange, onClear }) {
    const handle = (field, value) => {
        onFiltersChange({ ...filters, [field]: value });
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Filters</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {/* Status */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="filter-status" className="text-xs font-medium text-gray-600">
                        Status
                    </label>
                    <select
                        id="filter-status"
                        value={filters.status}
                        onChange={(e) => handle('status', e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="">All Statuses</option>
                        {ROOM_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* Room Type */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="filter-type" className="text-xs font-medium text-gray-600">
                        Room Type
                    </label>
                    <select
                        id="filter-type"
                        value={filters.type}
                        onChange={(e) => handle('type', e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="">All Types</option>
                        {ROOM_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Floor */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="filter-floor" className="text-xs font-medium text-gray-600">
                        Floor
                    </label>
                    <select
                        id="filter-floor"
                        value={filters.floor}
                        onChange={(e) => handle('floor', e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="">All Floors</option>
                        {FLOORS.map((f) => (
                            <option key={f} value={f}>Floor {f}</option>
                        ))}
                    </select>
                </div>

                {/* Min Price */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="filter-min-price" className="text-xs font-medium text-gray-600">
                        Min Price ($)
                    </label>
                    <input
                        id="filter-min-price"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={(e) => handle('minPrice', e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>

                {/* Max Price */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="filter-max-price" className="text-xs font-medium text-gray-600">
                        Max Price ($)
                    </label>
                    <input
                        id="filter-max-price"
                        type="number"
                        min="0"
                        placeholder="1000"
                        value={filters.maxPrice}
                        onChange={(e) => handle('maxPrice', e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
            </div>

            {/* Clear button */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={onClear}
                    className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
}

RoomFilters.propTypes = {
    filters: PropTypes.shape({
        status: PropTypes.string,
        type: PropTypes.string,
        floor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        minPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        maxPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }).isRequired,
    onFiltersChange: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
};
