import PropTypes from 'prop-types';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateKnownValue } from '../utils/localization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <div className="space-y-2 flex flex-col">
      <label
        htmlFor={id}
        className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint"
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
  showRoomSearch = false,
  showFloor = true,
  showGuestCapacity = false,
  showPriceRange = true,
}) {
  const { t } = useTranslation();

  const handle = (field, value) => {
    // If Select component passes "all", we treat it as an empty string to clear the filter.
    onFiltersChange({ ...filters, [field]: value === 'all' ? '' : value });
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
    'h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus-visible:border-brand-primary focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/5';

  return (
    <section className="rounded-[1.75rem] border border-black/5 bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]">
      <div className="flex flex-col gap-3 border-b border-brand-surface-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-white">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-black tracking-tight text-brand-ink">
              {t('filters')}
            </h3>
            <p className="mt-1 text-sm font-medium text-brand-ink-muted">
              {t('filtersDescription')}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light disabled:cursor-not-allowed disabled:bg-brand-primary-tint disabled:text-brand-ink-hint h-auto"
        >
          <X className="h-4 w-4" />
          {t('clearFilters')}
        </Button>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {showRoomSearch && (
            <FilterField id="filter-room-name" label={t('roomNameSearchLabel')}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink-hint" />
                <Input
                  id="filter-room-name"
                  type="search"
                  placeholder={t('roomNameSearchPlaceholder')}
                  value={filters.roomName ?? ''}
                  onChange={(event) => handle('roomName', event.target.value)}
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </FilterField>
          )}

          {showStatus && (
            <FilterField id="filter-status" label={t('status')}>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handle('status', value)}
              >
                <SelectTrigger id="filter-status" className={inputClassName}>
                  <SelectValue placeholder={t('allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  {normalizedStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          )}

          {showType && (
            <FilterField id="filter-type" label={t('roomType')}>
              {normalizedRoomTypeOptions.length > 0 ? (
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) => handle('type', value)}
                >
                  <SelectTrigger id="filter-type" className={inputClassName}>
                    <SelectValue placeholder={t('allTypes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTypes')}</SelectItem>
                    {normalizedRoomTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
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
                <Select
                  value={filters.floor || 'all'}
                  onValueChange={(value) => handle('floor', value)}
                >
                  <SelectTrigger id="filter-floor" className={inputClassName}>
                    <SelectValue placeholder={t('allFloors')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allFloors')}</SelectItem>
                    {normalizedFloorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
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
              <Input
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
            <FilterField id="filter-min-price" label={`${t('minPrice')} (SAR)`}>
              <Input
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
            <FilterField id="filter-max-price" label={`${t('maxPrice')} (SAR)`}>
              <Input
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
    roomName: PropTypes.string,
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
  showRoomSearch: PropTypes.bool,
  showFloor: PropTypes.bool,
  showGuestCapacity: PropTypes.bool,
  showPriceRange: PropTypes.bool,
};
