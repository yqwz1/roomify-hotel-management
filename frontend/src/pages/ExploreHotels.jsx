import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import HotelDiscoveryCard from '../components/hotels/HotelDiscoveryCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShadcnDatePicker } from '../components/common/ShadcnDatePicker';
import { searchRooms, extractSearchError } from '../services/searchService';
import {
  extractExternalHotelError,
  getExternalHotelPhotoUrl,
  searchExternalHotels,
} from '../services/externalHotelService';
import { formatLocalizedCurrency, translateKnownValue } from '../utils/localization';

const getDefaultDates = () => {
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  return { today, tomorrow: tomorrowDate.toISOString().split('T')[0] };
};

const toRoomifyHotel = (room, checkIn, checkOut, t, i18n) => {
  const roomTypeName = translateKnownValue(room.roomType?.name, t) || t('exploreHotels.roomifyFallbackName');
  const rate = Number(room.pricing?.pricePerNight ?? room.roomType?.basePrice ?? 0);
  return {
    id: room.id,
    source: 'ROOMIFY',
    name: `${roomTypeName} - ${t('roomNum', { number: room.roomNumber })}`,
    address: t('exploreHotels.roomifyAddress'),
    rating: room.rating ?? 4.9,
    userRatingCount: room.userRatingCount ?? t('exploreHotels.roomifyVerifiedCount'),
    photoUrl: '/roomify-mark.png',
    room,
    checkIn,
    checkOut,
    priceLabel: rate ? formatLocalizedCurrency(rate, i18n.language) : '',
  };
};

const toExternalHotel = (hotel) => ({
  ...hotel,
  source: 'GOOGLE_MAPS',
  photoUrl: hotel.photoName ? getExternalHotelPhotoUrl(hotel.placeId, hotel.photoName) : '',
});

export default function ExploreHotels() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { today, tomorrow } = useMemo(() => getDefaultDates(), []);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Riyadh');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [roomifyHotels, setRoomifyHotels] = useState([]);
  const [externalHotels, setExternalHotels] = useState([]);
  const [usingMockData, setUsingMockData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const checkInDate = useMemo(() => {
    if (!checkIn) return todayDate;
    const [year, month, day] = checkIn.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [checkIn, todayDate]);

  const totalResults = roomifyHotels.length + externalHotels.length;

  const runSearch = async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);

    const internalParams = {
      checkIn,
      checkOut,
      roomName: query.trim() || undefined,
    };

    const [internalResult, externalResult] = await Promise.allSettled([
      searchRooms(internalParams),
      searchExternalHotels({ query, city }),
    ]);

    if (internalResult.status === 'fulfilled') {
      const mappedRooms = (internalResult.value?.rooms ?? internalResult.value?.results ?? internalResult.value ?? [])
        .map((room) => toRoomifyHotel(room, checkIn, checkOut, t, i18n));
      setRoomifyHotels(mappedRooms);
    } else {
      setRoomifyHotels([]);
    }

    if (externalResult.status === 'fulfilled') {
      setUsingMockData(Boolean(externalResult.value?.usingMockData));
      setExternalHotels((externalResult.value?.hotels ?? []).map(toExternalHotel));
    } else {
      setUsingMockData(false);
      setExternalHotels([]);
    }

    const messages = [];
    if (internalResult.status === 'rejected') messages.push(extractSearchError(internalResult.reason));
    if (externalResult.status === 'rejected') messages.push(extractExternalHotelError(externalResult.reason));
    setError(messages.join(' | '));
    setLoading(false);
  };

  useEffect(() => {
    runSearch();
  }, []);

  const handleBookInternal = (hotel) => {
    navigate(`/book?roomId=${hotel.room.id}&checkIn=${checkIn}&checkOut=${checkOut}`, {
      state: { room: hotel.room, checkIn, checkOut },
    });
  };

  const handleViewExternal = (hotel) => {
    navigate(`/external-hotels/${encodeURIComponent(hotel.placeId)}`, {
      state: { hotel },
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={t('exploreHotels.eyebrow')}
        title={t('exploreHotels.title')}
        description={t('exploreHotels.subtitle')}
        meta={[
          t('exploreHotels.roomifyBadge'),
          t('exploreHotels.externalBadge'),
          t('exploreHotels.resultCount', { count: totalResults }),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-ink-hint">
            {t('exploreHotels.poweredByGoogle')}
          </p>
          <p className="mt-3 text-sm font-medium leading-6 text-white/80">
            {t('exploreHotels.discoveryNote')}
          </p>
        </div>
      </DashboardHero>

      <DashboardPanel title={t('exploreHotels.searchTitle')} description={t('exploreHotels.searchDescription')}>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_auto] lg:items-end">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.16em] text-brand-ink-hint" htmlFor="hotel-query">
              {t('exploreHotels.queryLabel')}
            </label>
            <Input
              id="hotel-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('exploreHotels.searchPlaceholder')}
              className="h-12 rounded-full border-brand-surface-border bg-brand-surface-light px-4 focus-visible:ring-2 focus-visible:ring-black/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.16em] text-brand-ink-hint" htmlFor="hotel-city">
              {t('exploreHotels.cityLabel')}
            </label>
            <Input
              id="hotel-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder={t('exploreHotels.cityPlaceholder')}
              className="h-12 rounded-full border-brand-surface-border bg-brand-surface-light px-4 focus-visible:ring-2 focus-visible:ring-black/5"
            />
          </div>
          <ShadcnDatePicker
            id="hotel-check-in"
            label={t('checkIn')}
            value={checkIn}
            onChange={setCheckIn}
            className="w-full"
            placeholder={t('checkIn')}
            calendarProps={{
              disabled: (date) => date < todayDate,
            }}
          />
          <ShadcnDatePicker
            id="hotel-check-out"
            label={t('checkOut')}
            value={checkOut}
            onChange={setCheckOut}
            className="w-full"
            placeholder={t('checkOut')}
            calendarProps={{
              disabled: (date) => date <= checkInDate,
            }}
          />
          <Button
            type="button"
            onClick={runSearch}
            disabled={loading || !checkIn || !checkOut || checkOut <= checkIn}
            className="h-12 rounded-full px-6 bg-brand-primary hover:bg-brand-primary-deep text-white transition shadow-sm disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted"
          >
            <Search className="me-2 h-4 w-4 shrink-0" />
            {loading ? t('exploreHotels.loading') : t('exploreHotels.searchCta')}
          </Button>
        </div>

        {error ? (
          <div className="mt-4 rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {error}
          </div>
        ) : null}
        {usingMockData ? (
          <div className="mt-4 rounded-[1.25rem] border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm font-bold text-brand-warning">
            {t('exploreHotels.mockNotice')}
          </div>
        ) : null}
      </DashboardPanel>

      {loading ? (
        <DashboardPanel title={t('exploreHotels.loading')} description={t('exploreHotels.loadingDescription')}>
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-[1.5rem] bg-brand-primary-tint" />
            ))}
          </div>
        </DashboardPanel>
      ) : null}

      {!loading && hasSearched && totalResults === 0 ? (
        <DashboardPanel title={t('exploreHotels.noResults')} description={t('exploreHotels.noResultsDescription')}>
          <div className="rounded-[1.5rem] border border-dashed border-brand-surface-border bg-brand-surface-light px-6 py-14 text-center text-sm font-medium text-brand-ink-muted">
            {t('exploreHotels.noResults')}
          </div>
        </DashboardPanel>
      ) : null}

      {!loading && roomifyHotels.length > 0 ? (
        <DashboardPanel title={t('exploreHotels.internalSection')} description={t('exploreHotels.internalSectionDescription')}>
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {roomifyHotels.map((hotel) => (
              <HotelDiscoveryCard key={`roomify-${hotel.id}`} hotel={hotel} onBook={handleBookInternal} />
            ))}
          </div>
        </DashboardPanel>
      ) : null}

      {!loading && externalHotels.length > 0 ? (
        <DashboardPanel
          title={t('exploreHotels.externalSection')}
          description={t('exploreHotels.externalSectionDescription')}
          action={
            <span className="rounded-full border border-brand-success/30 bg-brand-success/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-brand-success">
              {t('exploreHotels.poweredByGoogle')}
            </span>
          }
        >
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {externalHotels.map((hotel) => (
              <HotelDiscoveryCard
                key={`external-${hotel.placeId}`}
                hotel={hotel}
                onViewDetails={handleViewExternal}
              />
            ))}
          </div>
        </DashboardPanel>
      ) : null}
    </div>
  );
}
