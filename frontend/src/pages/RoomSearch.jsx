import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BedDouble,
  CalendarRange,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROLE_GUEST, getPrimaryRole } from '../components/navigation/navConfig';
import DateRangePicker from '../components/DateRangePicker';
import RoomFilters from '../components/RoomFilters';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { useAuth } from '../context/AuthProvider';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { useSearch } from '../hooks/useSearch';
import { getRoomSearchCardActions } from '../utils/roomSearchActions';
import {
  formatLocalizedCurrency,
  getRoomStatusLabel,
  translateKnownValue,
  translateWithFallback,
} from '../utils/localization';
import { getStatusBadgeClasses } from '../utils/statusPresentation';

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
const EMPTY_FILTERS = { roomName: '', type: '', guestCapacity: '', minPrice: '', maxPrice: '' };
const FRONT_DESK_EMAIL = 'info@roomify.com';
const FRONT_DESK_LINK = `mailto:${FRONT_DESK_EMAIL}?subject=Roomify%20Front%20Desk%20Support`;
const CARD_ACTION_FALLBACKS = {
  details: 'View Details',
  book: 'Book Room',
  contactFrontDesk: 'Contact Front Desk',
};

function SearchSkeletonCard() {
  return (
    <div className="motion-skeleton-shimmer overflow-hidden rounded-[1.75rem] border border-brand-surface-border bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)] animate-pulse">
      <div className="h-40 bg-brand-primary-tint" />
      <div className="space-y-4 p-5">
        <div className="h-5 w-1/2 rounded-full bg-brand-surface-border" />
        <div className="h-4 w-2/3 rounded-full bg-brand-primary-tint" />
        <div className="h-4 w-1/3 rounded-full bg-brand-primary-tint" />
        <div className="h-12 rounded-full bg-brand-surface-border" />
      </div>
    </div>
  );
}

export default function RoomSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const pageTx = 'roomSearchPage';
  const primaryRole = getPrimaryRole(user?.roles ?? []);
  const isGuest = primaryRole === ROLE_GUEST;

  const sortOptions = useMemo(
    () => [
      { label: t('sortPriceAsc'), sortBy: 'PRICE', sortDirection: 'ASC' },
      { label: t('sortPriceDesc'), sortBy: 'PRICE', sortDirection: 'DESC' },
      { label: t('sortTypeAsc'), sortBy: 'ROOM_TYPE', sortDirection: 'ASC' },
      { label: t('sortTypeDesc'), sortBy: 'ROOM_TYPE', sortDirection: 'DESC' },
    ],
    [t]
  );

  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const recoveredCheckIn = String(location.state?.checkIn ?? '').trim();
  const recoveredCheckOut = String(location.state?.checkOut ?? '').trim();
  const hasRecoveredDates = Boolean(
    recoveredCheckIn &&
      recoveredCheckOut &&
      recoveredCheckOut > recoveredCheckIn
  );

  const [checkIn, setCheckIn] = useState(() => (hasRecoveredDates ? recoveredCheckIn : today));
  const [checkOut, setCheckOut] = useState(() => (hasRecoveredDates ? recoveredCheckOut : tomorrow));
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortOptionIndex, setSortOptionIndex] = useState(0);

  const { roomTypes, fetchRoomTypes } = useRoomTypes();
  const { results, totalResults, loading, error, hasSearched, search, clearError } = useSearch();
  const sortOption = sortOptions[sortOptionIndex];

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  useEffect(() => {
    if (!hasRecoveredDates) return;

    search({
      checkIn: recoveredCheckIn,
      checkOut: recoveredCheckOut,
      sortBy: sortOptions[0].sortBy,
      sortDirection: sortOptions[0].sortDirection,
    });
  }, [hasRecoveredDates, recoveredCheckIn, recoveredCheckOut, search, sortOptions]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
    return Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  }, [checkIn, checkOut]);

  const startingPrice = useMemo(() => {
    if (!results.length) return null;
    return results.reduce((lowest, room) => {
      const price = Number(room.roomType?.basePrice ?? 0);
      return lowest === null || price < lowest ? price : lowest;
    }, null);
  }, [results]);

  const roomTypeOptions = useMemo(
    () => {
      const roomTypeNames = roomTypes.length > 0
        ? roomTypes.map((roomType) => roomType?.name).filter(Boolean)
        : results.map((room) => room.roomType?.name).filter(Boolean);

      return [...new Set(roomTypeNames)].map((name) => ({
        value: name,
        label: name,
      }));
    },
    [results, roomTypes]
  );

  const handleSearch = () => {
    if (!checkIn || !checkOut) return;

    search({
      checkIn,
      checkOut,
      roomName: filters.roomName?.trim() || undefined,
      roomType: filters.type || undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      guestCapacity: filters.guestCapacity ? Number(filters.guestCapacity) : undefined,
      sortBy: sortOption.sortBy,
      sortDirection: sortOption.sortDirection,
    });
  };

  const handleBookNow = (room) => {
    navigate(`/book?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`, {
      state: { checkIn, checkOut, room },
    });
  };

  const handleViewDetails = (room) => {
    navigate(`/rooms/${room.id}?checkIn=${checkIn}&checkOut=${checkOut}`, {
      state: { checkIn, checkOut, room },
    });
  };
  const cardActions = getRoomSearchCardActions(primaryRole);
  const getAvailableCardActions = (room) => {
    const isAvailable = room?.availableForRequestedStay === true;
    return isAvailable
      ? cardActions
      : cardActions.filter((action) => action.id !== 'book');
  };

  const handleCardAction = (actionId, room) => {
    switch (actionId) {
      case 'details':
        handleViewDetails(room);
        break;
      case 'book':
        handleBookNow(room);
        break;
      case 'help':
        navigate('/bookings');
        break;
      case 'contactFrontDesk':
        window.location.assign(FRONT_DESK_LINK);
        break;
      default:
        break;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={t(isGuest ? `${pageTx}.guestHeroEyebrow` : `${pageTx}.heroEyebrow`)}
        title={t('roomSearchTitle')}
        description={t(isGuest ? `${pageTx}.guestDescription` : 'roomSearchDesc')}
        meta={[
          t('nightsCount', { count: nights || 0 }),
          hasSearched ? t(`${pageTx}.matchedCount`, { count: totalResults }) : t('common.pending'),
          hasRecoveredDates ? t(`${pageTx}.recoveredContext`) : t(`${pageTx}.manualSearch`),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
            {t(`${pageTx}.snapshotTitle`)}
          </p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('common.dates')}
              </p>
              <p className="mt-2 text-lg font-black break-words">
                {checkIn} - {checkOut}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t(`${pageTx}.startingRate`)}
              </p>
              <p className="mt-2 text-lg font-black break-words">
                {startingPrice == null
                  ? t(`${pageTx}.notLoaded`)
                  : formatLocalizedCurrency(startingPrice, i18n.language)}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-6">
          <DashboardPanel
            title={t(`${pageTx}.searchControlsTitle`)}
            description={t(`${pageTx}.searchControlsDescription`)}
          >
            <div className="space-y-5">
              {error && (
                <div className="motion-warning-in rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <span>{error}</span>
                    <Button variant="unstyled" size="none"
                      type="button"
                      onClick={clearError}
                      className="text-xs font-bold uppercase tracking-[0.18em] text-brand-danger"
                    >
                      {t('dismissError')}
                    </Button>
                  </div>
                </div>
              )}

              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
              />

              <div className="space-y-2">
                <label
                  htmlFor="room-search-sort"
                  className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint"
                >
                  {t(`${pageTx}.sortResults`)}
                </label>
                <NativeSelect
                  id="room-search-sort"
                  value={sortOptionIndex}
                  onChange={(event) => setSortOptionIndex(Number(event.target.value))}
                  className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  {sortOptions.map((option, index) => (
                    <option key={`${option.sortBy}-${option.sortDirection}`} value={index}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <Button variant="unstyled" size="none"
                type="button"
                onClick={handleSearch}
                disabled={loading || !checkIn || !checkOut || checkOut <= checkIn}
                className="inline-flex min-w-0 w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-6 py-4 text-sm font-bold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted"
              >
                <Search className="h-4 w-4 shrink-0" />
                {loading
                  ? t(`${pageTx}.searchingRooms`)
                  : t(isGuest ? `${pageTx}.guestSearchCta` : 'searchRoomsButton')}
              </Button>
            </div>
          </DashboardPanel>

          <RoomFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
            roomTypeOptions={roomTypeOptions}
            showStatus={false}
            showFloor={false}
            showGuestCapacity={true}
            showRoomSearch={true}
          />
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title={t(`${pageTx}.searchResultsTitle`)}
            description={
              hasSearched
                ? t(`${pageTx}.matchedCount`, { count: totalResults })
                : t(`${pageTx}.runSearchPrompt`)
            }
            action={
              hasSearched && results.length > 0 ? (
                <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-ink-muted break-words">
                  {t(`${pageTx}.stayBadge`, { count: nights })}
                </span>
              ) : null
            }
          >
            {!hasSearched && !loading && (
              <div className="motion-rise-in rounded-[1.5rem] border border-dashed border-brand-surface-border bg-brand-surface-light px-6 py-14 text-center">
                <CalendarRange className="mx-auto h-10 w-10 text-brand-ink-hint shrink-0" />
                <p className="mt-4 text-lg font-black text-brand-ink break-words">{t(`${pageTx}.readyTitle`)}</p>
                <p className="mt-2 text-sm font-medium text-brand-ink-muted break-words">
                  {t(`${pageTx}.readyDescription`)}
                </p>
              </div>
            )}

            {loading && (
              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <SearchSkeletonCard key={index} />
                ))}
              </div>
            )}

            {!loading && hasSearched && results.length === 0 && !error && (
              <div className="motion-rise-in rounded-[1.5rem] border border-dashed border-brand-surface-border bg-brand-surface-light px-6 py-14 text-center">
                <SlidersHorizontal className="mx-auto h-10 w-10 text-brand-ink-hint shrink-0" />
                <p className="mt-4 text-lg font-black text-brand-ink break-words">{t(`${pageTx}.unavailableTitle`)}</p>
                <p className="mt-2 text-sm font-medium text-brand-ink-muted break-words">
                  {t(`${pageTx}.unavailableDescription`)}
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-4">
                {results.map((room) => {
                  const pricing = room.pricing ?? null;
                  const basePrice = Number(pricing?.pricePerNight ?? room.roomType?.basePrice ?? 0);
                  const subtotal = Number(pricing?.subtotal ?? (nights > 0 ? basePrice * nights : basePrice));
                  const taxes = Number(pricing?.vatAmount ?? 0);
                  const totalCost = Number(pricing?.total ?? subtotal);
                  const amenities = room.roomType?.amenities
                    ? room.roomType.amenities
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <article
                      key={room.id}
                      className="motion-stagger-item motion-card-hover rounded-[1.35rem] border border-brand-surface-border bg-white p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.24)] transition hover:border-brand-surface-border"
                    >
                      <div className="space-y-4">
                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span className="flex min-w-0 h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white break-words">
                              <BedDouble className="h-5 w-5 shrink-0" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xl font-black tracking-tight text-brand-ink break-words">
                                {t('roomNumber', { number: room.roomNumber })}
                              </p>
                              <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                                {translateKnownValue(room.roomType?.name || t(`${pageTx}.roomTypeUnavailable`), t)}
                                {room.floor ? ` | ${t('floorNum', { floor: room.floor })}` : ''}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`max-w-full shrink-0 truncate rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                              getStatusBadgeClasses(room.status)
                            }`}
                          >
                            {getRoomStatusLabel(room.status, t)}
                          </span>
                        </div>

                        {room.roomType?.description && (
                          <p className="text-sm font-medium leading-6 text-brand-ink-muted break-words">
                            {room.roomType.description}
                          </p>
                        )}

                        <div className="flex min-w-0 flex-wrap gap-2">
                          {amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="max-w-full shrink-0 truncate rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-xs font-bold text-brand-ink-muted"
                            >
                              {translateKnownValue(amenity, t)}
                            </span>
                          ))}
                          {amenities.length > 3 && (
                            <span className="max-w-full shrink-0 truncate rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-xs font-bold text-brand-ink-muted">
                              {t(`${pageTx}.moreAmenities`, { count: amenities.length - 3 })}
                            </span>
                          )}
                        </div>

                        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                          <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                              {t(`${pageTx}.rateLabel`)}
                            </p>
                            <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                              {formatLocalizedCurrency(basePrice, i18n.language)} / {t('perNight')}
                            </p>
                          </div>
                          <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                              {t(`${pageTx}.capacityLabel`)}
                            </p>
                            <p className="mt-2 inline-flex min-w-0 items-center gap-2 text-sm font-bold text-brand-ink break-words">
                              <Users className="h-4 w-4 text-brand-ink-hint shrink-0" />
                              {t('upToGuests', { count: room.roomType?.maxGuests ?? '-' })}
                            </p>
                          </div>
                          <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                              {t('common.stayTotal')}
                            </p>
                            <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                              {formatLocalizedCurrency(totalCost, i18n.language)}
                            </p>
                            {taxes > 0 ? (
                              <p className="mt-1 text-xs font-medium text-brand-ink-muted break-words">
                                {t('taxes15')}: {formatLocalizedCurrency(taxes, i18n.language)}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-col gap-3 border-t border-brand-surface-border pt-4 sm:flex-row sm:items-center sm:justify-end">
                          {getAvailableCardActions(room).map((action) => (
                            <Button variant="unstyled" size="none"
                              key={action.id}
                              type="button"
                              onClick={() => handleCardAction(action.id, room)}
                              className={
                                action.tone === 'secondary'
                                  ? 'inline-flex min-w-0 w-full items-center justify-center gap-2 rounded-full border border-brand-surface-border bg-white px-5 py-3 text-sm font-bold text-brand-ink transition hover:border-brand-surface-border hover:bg-brand-surface-light sm:w-auto'
                                  : 'inline-flex min-w-0 w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep sm:w-auto'
                              }
                            >
                              {translateWithFallback(
                                t,
                                action.labelKey,
                                CARD_ACTION_FALLBACKS[action.id] ?? action.id
                              )}
                              <ArrowRight className="h-4 w-4 shrink-0" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
