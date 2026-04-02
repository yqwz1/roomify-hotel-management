import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  CheckCircle2,
  Search,
  Sparkles,
  Wrench,
} from 'lucide-react';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { getRooms, updateRoomStatus, extractErrorMessage } from '../services/roomService';
import {
  formatLocalizedCurrency,
  getRoomStatusLabel,
  translateKnownValue,
} from '../utils/localization';

const STATUSES = ['ALL', 'AVAILABLE', 'OCCUPIED', 'NEEDS_CLEANING', 'UNDER_MAINTENANCE'];

const STATUS_META = {
  AVAILABLE: {
    color: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: CheckCircle2,
    actions: ['OCCUPIED', 'NEEDS_CLEANING', 'UNDER_MAINTENANCE'],
  },
  OCCUPIED: {
    color: 'border-zinc-300 bg-zinc-100 text-zinc-700',
    icon: AlertCircle,
    actions: [],
  },
  NEEDS_CLEANING: {
    color: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: Sparkles,
    actions: ['AVAILABLE', 'UNDER_MAINTENANCE'],
  },
  UNDER_MAINTENANCE: {
    color: 'border-rose-200 bg-rose-50 text-rose-900',
    icon: Wrench,
    actions: ['AVAILABLE'],
  },
};

function LoadingCard() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)] animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-4 w-16 rounded-full bg-zinc-200" />
          <div className="h-8 w-24 rounded-full bg-zinc-100" />
        </div>
        <div className="h-10 w-10 rounded-2xl bg-zinc-100" />
      </div>
      <div className="mt-6 h-6 w-28 rounded-full bg-zinc-200" />
      <div className="mt-5 flex gap-2">
        <div className="h-10 w-24 rounded-full bg-zinc-100" />
        <div className="h-10 w-24 rounded-full bg-zinc-100" />
      </div>
    </div>
  );
}

export default function RoomStatus() {
  const { t, i18n } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingRoomId, setUpdatingRoomId] = useState(null);

  const fetchRooms = async (statusFilter = filter) => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const data = await getRooms(params);
      setRooms(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleStatusChange = async (roomId, nextStatus) => {
    if (!roomId || !nextStatus) return;
    setUpdatingRoomId(roomId);
    setError(null);

    try {
      const updated = await updateRoomStatus(roomId, nextStatus);
      setRooms((prev) => {
        if (filter !== 'ALL' && updated.status !== filter) {
          return prev.filter((room) => room.id !== roomId);
        }
        return prev.map((room) => (room.id === roomId ? updated : room));
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdatingRoomId(null);
    }
  };

  const filteredRooms = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return rooms;
    return rooms.filter((room) =>
      String(room.roomNumber ?? '').toLowerCase().includes(search)
    );
  }, [rooms, searchQuery]);

  const summary = useMemo(
    () =>
      rooms.reduce(
        (acc, room) => {
          if (acc[room.status] != null) acc[room.status] += 1;
          return acc;
        },
        {
          AVAILABLE: 0,
          OCCUPIED: 0,
          NEEDS_CLEANING: 0,
          UNDER_MAINTENANCE: 0,
        }
      ),
    [rooms]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={t('roomStatusPage.heroEyebrow')}
        title={t('roomStatus')}
        description={t('roomStatusPage.description')}
        meta={[
          t('roomStatusPage.roomsLoaded', { count: rooms.length }),
          t('roomStatusPage.cleaningCount', { count: summary.NEEDS_CLEANING }),
          t('roomStatusPage.maintenanceCount', { count: summary.UNDER_MAINTENANCE }),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t('roomStatusPage.snapshotTitle')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('roomStatusAvailable')}
              </p>
              <p className="mt-2 text-lg font-black">{summary.AVAILABLE}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('roomStatusOccupied')}
              </p>
              <p className="mt-2 text-lg font-black">{summary.OCCUPIED}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <DashboardPanel
        title={t('roomStatusPage.filtersTitle')}
        description={t('roomStatusPage.filtersDescription')}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  filter === status
                    ? 'border-zinc-950 bg-zinc-950 text-white'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-white'
                }`}
              >
                {status === 'ALL' ? t('roomStatusPage.allRooms') : getRoomStatusLabel(status, t)}
              </button>
            ))}
          </div>

          <div className="relative w-full xl:w-72">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={t('roomStatusPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 ps-11 pe-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {error}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        title={t('roomStatusPage.boardTitle')}
        description={t('roomStatusPage.boardDescription')}
      >
        {loading && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <LoadingCard key={index} />
            ))}
          </div>
        )}

        {!loading && filteredRooms.length === 0 && (
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center">
            <Search className="mx-auto h-10 w-10 text-zinc-400" />
            <p className="mt-4 text-lg font-black text-zinc-950">{t('roomStatusPage.noRoomsTitle')}</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              {t('roomStatusPage.noRoomsDescription')}
            </p>
          </div>
        )}

        {!loading && filteredRooms.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => {
              const meta = STATUS_META[room.status] || STATUS_META.AVAILABLE;
              const Icon = meta.icon;
              const actions = meta.actions;

              return (
                <article
                  key={room.id}
                  className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                        {translateKnownValue(room.roomType?.name || t('roomStatusPage.roomTypeFallback'), t)}
                      </p>
                      <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
                        {room.roomNumber}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        {t('floorNum', { floor: room.floor ?? '-' })}
                      </p>
                    </div>

                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${meta.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>

                  <div
                    className={`mt-5 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] ${meta.color}`}
                  >
                    {getRoomStatusLabel(room.status, t)}
                  </div>

                  {room.roomType?.basePrice != null && (
                    <div className="mt-5 rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                        {t('roomStatusPage.baseRate')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-zinc-950">
                        {formatLocalizedCurrency(room.roomType.basePrice, i18n.language)} / {t('perNight')}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {actions.length === 0 ? (
                      <div className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-500">
                        {t('roomStatusPage.managedAutomatically')}
                      </div>
                    ) : (
                      actions.map((nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          onClick={() => handleStatusChange(room.id, nextStatus)}
                          disabled={updatingRoomId === room.id}
                          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                        >
                          {updatingRoomId === room.id
                            ? t('roomStatusPage.updating')
                            : getRoomStatusLabel(nextStatus, t)}
                        </button>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
