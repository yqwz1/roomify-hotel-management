import PropTypes from 'prop-types';
import { SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateKnownValue } from '../utils/localization';

const toOption = (option) => {
  if (typeof option === 'object' && option !== null) {
    return {
      value: String(option.value ?? ''),
      label: option.label ?? String(option.value ?? ''),
    };
  }

  return { value: String(option ?? ''), label: String(option ?? '') };
};

function FilterField({ id, label, children }) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

FilterField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
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
  const normalizedRoomTypeOptions = roomTypeOptions.map(toOption).map((option) => ({
    ...option,
    label: translateKnownValue(option.label, t),
  }));
  const normalizedFloorOptions = floorOptions.map(toOption);

  const hasActiveFilters = Object.entries(filters).some(([, value]) => {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== '';
  });

  const inputClassName =
    'h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

  return (
    <section className="rounded-[1.75rem] border border-black/5 bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]">
      <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-black tracking-tight text-zinc-950">
              {t('filters')}
            </h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              {t('filtersDescription')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
        >
          <X className="h-4 w-4" />
          {t('clearFilters')}
        </button>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {showStatus && (
            <FilterField id="filter-status" label={t('status')}>
              <select
                id="filter-status"
                value={filters.status ?? ''}
                onChange={(event) => handle('status', event.target.value)}
                className={inputClassName}
              >
                <option value="">{t('allStatuses')}</option>
                {normalizedStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterField>
          )}

          {showType && (
            <FilterField id="filter-type" label={t('roomType')}>
              {normalizedRoomTypeOptions.length > 0 ? (
                <select
                  id="filter-type"
                  value={filters.type ?? ''}
                  onChange={(event) => handle('type', event.target.value)}
                  className={inputClassName}
                >
                  <option value="">{t('allTypes')}</option>
                  {normalizedRoomTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="filter-type"
                  type="text"
                  placeholder={t('roomType')}
                  value={filters.type ?? ''}
                  onChange={(event) => handle('type', event.target.value)}
                  className={inputClassName}
                />
              )}
            </FilterField>
          )}

          {showFloor && (
            <FilterField id="filter-floor" label={t('floor')}>
              {normalizedFloorOptions.length > 0 ? (
                <select
                  id="filter-floor"
                  value={filters.floor ?? ''}
                  onChange={(event) => handle('floor', event.target.value)}
                  className={inputClassName}
                >
                  <option value="">{t('allFloors')}</option>
                  {normalizedFloorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="filter-floor"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={filters.floor ?? ''}
                  onChange={(event) => handle('floor', event.target.value)}
                  className={inputClassName}
                />
              )}
            </FilterField>
          )}

          {showGuestCapacity && (
            <FilterField
              id="filter-guests"
              label={t('maxGuestsLabel')}
            >
              <input
                id="filter-guests"
                type="number"
                min="1"
                placeholder="2"
                value={filters.guestCapacity ?? ''}
                onChange={(event) => handle('guestCapacity', event.target.value)}
                className={inputClassName}
              />
            </FilterField>
          )}

          {showPriceRange && (
            <FilterField id="filter-min-price" label={`${t('minPrice')} ($)`}>
              <input
                id="filter-min-price"
                type="number"
                min="0"
                placeholder="0"
                value={filters.minPrice ?? ''}
                onChange={(event) => handle('minPrice', event.target.value)}
                className={inputClassName}
              />
            </FilterField>
          )}

          {showPriceRange && (
            <FilterField id="filter-max-price" label={`${t('maxPrice')} ($)`}>
              <input
                id="filter-max-price"
                type="number"
                min="0"
                placeholder="1000"
                value={filters.maxPrice ?? ''}
                onChange={(event) => handle('maxPrice', event.target.value)}
                className={inputClassName}
              />
            </FilterField>
          )}
        </div>
      </div>
    </section>
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
