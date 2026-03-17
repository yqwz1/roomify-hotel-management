import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const toOption = (option) => {
    if (typeof option === 'object' && option !== null) {
        return {
            value: String(option.value ?? ''),
            label: option.label ?? String(option.value ?? ''),
        };
    }

    return { value: String(option ?? ''), label: String(option ?? '') };
};

export default function RoomFilters({
    filters,
    onFiltersChange,
    onClear,
    statusOptions = [],
    roomTypeOptions = [],
    floorOptions = [],
    showStatus = true,
    showType = true,
    showFloor = true,
    showGuestCapacity = false,
    showPriceRange = true,
}) {
    const { t } = useTranslation();

    const handle = (field, value) => {
        onFiltersChange({ ...filters, [field]: value });
    };

    const normalizedStatusOptions = statusOptions.map(toOption);
    const normalizedRoomTypeOptions = roomTypeOptions.map(toOption);
    const normalizedFloorOptions = floorOptions.map(toOption);

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{t('filters')}</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                {showStatus && (
                    <div className="flex flex-col gap-1">
                        <label htmlFor="filter-status" className="text-xs font-medium text-gray-600">
                            {t('status')}
                        </label>
                        <select
                            id="filter-status"
                            value={filters.status ?? ''}
                            onChange={(e) => handle('status', e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                            <option value="">{t('allStatuses')}</option>
                            {normalizedStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {showType && (
                    <div className="flex flex-col gap-1">
                        <label htmlFor="filter-type" className="text-xs font-medium text-gray-600">
                            {t('roomType')}
                        </label>
                        {normalizedRoomTypeOptions.length > 0 ? (
                            <select
                                id="filter-type"
                                value={filters.type ?? ''}
                                onChange={(e) => handle('type', e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                                <option value="">{t('allTypes')}</option>
                                {normalizedRoomTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id="filter-type"
                                type="text"
                                placeholder={t('roomType') || 'Room Type'}
                                value={filters.type ?? ''}
                                onChange={(e) => handle('type', e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        )}
                    </div>
                )}

                {showFloor && (
                    <div className="flex flex-col gap-1">
                        <label htmlFor="filter-floor" className="text-xs font-medium text-gray-600">
                            {t('floor')}
                        </label>
                        {normalizedFloorOptions.length > 0 ? (
                            <select
                                id="filter-floor"
                                value={filters.floor ?? ''}
                                onChange={(e) => handle('floor', e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                                <option value="">{t('allFloors')}</option>
                                {normalizedFloorOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id="filter-floor"
                                type="number"
                                min="1"
                                placeholder="1"
                                value={filters.floor ?? ''}
                                onChange={(e) => handle('floor', e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        )}
                    </div>
                )}

                {showGuestCapacity && (
                    <div className="flex flex-col gap-1">
                        <label htmlFor="filter-guests" className="text-xs font-medium text-gray-600">
                            {t('maxGuestsLabel') || 'Guests'}
                        </label>
                        <input
                            id="filter-guests"
                            type="number"
                            min="1"
                            placeholder="2"
                            value={filters.guestCapacity ?? ''}
                            onChange={(e) => handle('guestCapacity', e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                )}

                {showPriceRange && (
                    <div className="flex flex-col gap-1">
                        <label htmlFor="filter-min-price" className="text-xs font-medium text-gray-600">
                            {t('minPrice')} ($)
                        </label>
                        <input
                            id="filter-min-price"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={filters.minPrice ?? ''}
                            onChange={(e) => handle('minPrice', e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                )}

                {showPriceRange && (
                    <div className="flex flex-col gap-1">
                        <label htmlFor="filter-max-price" className="text-xs font-medium text-gray-600">
                            {t('maxPrice')} ($)
                        </label>
                        <input
                            id="filter-max-price"
                            type="number"
                            min="0"
                            placeholder="1000"
                            value={filters.maxPrice ?? ''}
                            onChange={(e) => handle('maxPrice', e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                )}
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={onClear}
                    className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                    {t('clearFilters')}
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
        guestCapacity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        minPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        maxPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }).isRequired,
    onFiltersChange: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    statusOptions: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                label: PropTypes.string,
            }),
        ])
    ),
    roomTypeOptions: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                label: PropTypes.string,
            }),
        ])
    ),
    floorOptions: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
            PropTypes.shape({
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
                label: PropTypes.string,
            }),
        ])
    ),
    showStatus: PropTypes.bool,
    showType: PropTypes.bool,
    showFloor: PropTypes.bool,
    showGuestCapacity: PropTypes.bool,
    showPriceRange: PropTypes.bool,
};
