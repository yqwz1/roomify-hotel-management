import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Search,
  Sparkles,
  Wrench,
} from 'lucide-react';
import ConfirmationToast from '../components/ConfirmationToast';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import {
  extractErrorMessage,
  getRooms,
  getValidNextStatuses,
  updateRoomStatus,
} from '../services/roomService';
import ServiceCompletionModal from '../components/inventory/ServiceCompletionModal';
import {
  formatLocalizedCurrency,
  getRoomStatusLabel,
  translateKnownValue,
} from '../utils/localization';
import { getStatusBadgeClasses } from '../utils/statusPresentation';

import { Button } from "@/components/ui/button";
const STATUSES = ['ALL', 'AVAILABLE', 'OCCUPIED', 'NEEDS_CLEANING', 'UNDER_MAINTENANCE'];

const STATUS_META = {
  AVAILABLE: {
    icon: CheckCircle2,
  },
  OCCUPIED: {
    icon: AlertCircle,
  },
  NEEDS_CLEANING: {
    icon: Sparkles,
  },
  UNDER_MAINTENANCE: {
    icon: Wrench,
  },
};

const ACTION_STATUS_READY = 'ready';
const ACTION_STATUS_UNAVAILABLE = 'unavailable';

const attachValidNextStatuses = async (rooms) => {
  const hydrated = await Promise.all(
    rooms.map(async (room) => {
      try {
        const validNextStatuses = await getValidNextStatuses(room.id);
        return {
          ...room,
          validNextStatuses,
          validNextStatusesStatus: ACTION_STATUS_READY,
        };
      } catch (err) {
        if (err?.response?.status === 403) {
          throw err;
        }
        return {
          ...room,
          validNextStatuses: [],
          validNextStatusesStatus: ACTION_STATUS_UNAVAILABLE,
        };
      }
    })
  );

  return hydrated;
};

function LoadingCard() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-brand-surface-border bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)] animate-pulse">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-4 w-16 rounded-full bg-brand-surface-border" />
          <div className="h-8 w-24 rounded-full bg-brand-primary-tint" />
        </div>
        <div className="h-10 w-10 rounded-2xl bg-brand-primary-tint" />
      </div>
      <div className="mt-6 h-6 w-28 rounded-full bg-brand-surface-border" />
      <div className="mt-5 flex min-w-0 gap-2">
        <div className="h-10 w-24 rounded-full bg-brand-primary-tint" />
        <div className="h-10 w-24 rounded-full bg-brand-primary-tint" />
      </div>
    </div>
  );
}

export default function RoomStatus() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const initialFilter = String(location.state?.initialFilter ?? 'ALL').toUpperCase();
  const initialQuery = String(location.state?.initialQuery ?? '');
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState(
    STATUSES.includes(initialFilter) ? initialFilter : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [updatingRoomId, setUpdatingRoomId] = useState(null);
  const [serviceRoom, setServiceRoom] = useState(null);

  const fetchRooms = async (statusFilter = filter) => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const data = await getRooms(params);
      const roomsWithTransitions = await attachValidNextStatuses(data);
      setRooms(roomsWithTransitions);
    } catch (err) {
      setRooms([]);
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
    const room = rooms.find((candidate) => candidate.id === roomId);
    if (
      nextStatus === 'AVAILABLE' &&
      room?.status === 'NEEDS_CLEANING'
    ) {
      setServiceRoom(room);
      return;
    }
    setUpdatingRoomId(roomId);
    setError(null);

    try {
      const updated = await updateRoomStatus(roomId, nextStatus);
      let validNextStatuses = [];
      let validNextStatusesStatus = ACTION_STATUS_READY;
      try {
        validNextStatuses = await getValidNextStatuses(updated.id);
      } catch (transitionErr) {
        if (transitionErr?.response?.status === 403) {
          throw transitionErr;
        }
        validNextStatusesStatus = ACTION_STATUS_UNAVAILABLE;
      }
      const hydratedRoom = { ...updated, validNextStatuses, validNextStatusesStatus };
      setRooms((prev) => {
        if (filter !== 'ALL' && hydratedRoom.status !== filter) {
          return prev.filter((room) => room.id !== roomId);
        }
        return prev.map((room) => (room.id === roomId ? hydratedRoom : room));
      });
      setToast({
        message: t('roomStatusPage.successToast', {
          roomNumber: updated.roomNumber,
          status: getRoomStatusLabel(updated.status, t),
        }),
        type: 'success',
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdatingRoomId(null);
    }
  };

  const handleServiceCompleted = async (response) => {
    const updated = response?.room;
    if (!updated) {
      setServiceRoom(null);
      return;
    }

    setError(null);
    let validNextStatuses = [];
    let validNextStatusesStatus = ACTION_STATUS_READY;
    try {
      validNextStatuses = await getValidNextStatuses(updated.id);
    } catch (transitionErr) {
      if (transitionErr?.response?.status === 403) {
        setError(extractErrorMessage(transitionErr));
      } else {
        validNextStatusesStatus = ACTION_STATUS_UNAVAILABLE;
      }
    }

    const hydratedRoom = { ...updated, validNextStatuses, validNextStatusesStatus };
    setRooms((prev) => {
      if (filter !== 'ALL' && hydratedRoom.status !== filter) {
        return prev.filter((room) => room.id !== updated.id);
      }
      return prev.map((room) => (room.id === updated.id ? hydratedRoom : room));
    });

    const warningSuffix = response?.warnings?.length ? ` · ${response.warnings.join(' · ')}` : '';
    setToast({
      message: `${t('roomStatusPage.successToast', {
        roomNumber: updated.roomNumber,
        status: getRoomStatusLabel(updated.status, t),
      })}${warningSuffix}`,
      type: 'success',
    });
    setServiceRoom(null);
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
    <div className="roomify-page-enter mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {serviceRoom ? (
        <ServiceCompletionModal
          room={serviceRoom}
          onClose={() => setServiceRoom(null)}
          onCompleted={handleServiceCompleted}
          t={t}
          language={i18n.language}
        />
      ) : null}

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
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
            {t('roomStatusPage.snapshotTitle')}
          </p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('roomStatusAvailable')}
              </p>
              <p className="mt-2 text-lg font-black break-words">{summary.AVAILABLE}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('roomStatusOccupied')}
              </p>
              <p className="mt-2 text-lg font-black break-words">{summary.OCCUPIED}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <DashboardPanel
        title={t('roomStatusPage.filtersTitle')}
        description={t('roomStatusPage.filtersDescription')}
      >
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2">
            {STATUSES.map((status) => (
              <Button variant="unstyled" size="none"
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  filter === status
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-brand-surface-border bg-brand-surface-light text-brand-ink hover:bg-white'
                }`}
              >
                {status === 'ALL' ? t('roomStatusPage.allRooms') : getRoomStatusLabel(status, t)}
              </Button>
            ))}
          </div>

          <div className="relative w-full xl:w-72">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink-hint shrink-0" />
            <input
              type="text"
              placeholder={t('roomStatusPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light ps-11 pe-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        {error && rooms.length > 0 && (
          <div className="mt-5 rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {error}
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel
        title={t('roomStatusPage.boardTitle')}
        description={t('roomStatusPage.boardDescription')}
      >
        {loading && (
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <LoadingCard key={index} />
            ))}
          </div>
        )}

        {!loading && error && rooms.length === 0 && (
          <ErrorState
            title={t('roomStatusPage.loadFailedTitle')}
            message={error || t('roomStatusPage.accessDeniedDescription')}
            onRetry={() => fetchRooms()}
          />
        )}

        {!loading && !error && filteredRooms.length === 0 && (
          <EmptyState
            title={t('roomStatusPage.noRoomsTitle')}
            message={t('roomStatusPage.noRoomsDescription')}
            icon={Search}
          />
        )}

        {!loading && filteredRooms.length > 0 && (
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => {
              const meta = STATUS_META[room.status] || STATUS_META.AVAILABLE;
              const statusClasses = getStatusBadgeClasses(room.status);
              const Icon = meta.icon;
              const actions = room.validNextStatuses ?? [];
              const actionsUnavailable = room.validNextStatusesStatus === ACTION_STATUS_UNAVAILABLE;
              const hasActions = !actionsUnavailable && actions.length > 0;

              return (
                <article
                  key={room.id}
                  className="overflow-hidden rounded-[1.75rem] border border-brand-surface-border bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)]"
                >
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                        {translateKnownValue(room.roomType?.name || t('roomStatusPage.roomTypeFallback'), t)}
                      </p>
                      <p className="mt-2 text-3xl font-black tracking-tight text-brand-ink break-words">
                        {room.roomNumber}
                      </p>
                      <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                        {t('floorNum', { floor: room.floor ?? '-' })}
                      </p>
                    </div>

                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${statusClasses}`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                    </span>
                  </div>

                  <div
                    className={`mt-5 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] ${statusClasses}`}
                  >
                    {getRoomStatusLabel(room.status, t)}
                  </div>

                  {room.roomType?.basePrice != null && (
                    <div className="mt-5 rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
                        {t('roomStatusPage.baseRate')}
                      </p>
                      <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                        {formatLocalizedCurrency(room.roomType.basePrice, i18n.language)} / {t('perNight')}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex min-w-0 flex-wrap gap-2">
                    {actionsUnavailable ? (
                      <div className="rounded-[1.1rem] border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm text-brand-warning">
                        <p className="font-bold break-words">{t('roomStatusPage.actionsUnavailableTitle')}</p>
                        <p className="mt-1 font-medium text-brand-warning/80 break-words">
                          {t('roomStatusPage.actionsUnavailableDescription')}
                        </p>
                      </div>
                    ) : !hasActions ? (
                      <div className="rounded-full border border-brand-surface-border bg-brand-surface-light px-4 py-2 text-sm font-medium text-brand-ink-muted">
                        {room.status === 'OCCUPIED'
                          ? t('roomStatusPage.occupiedLocked')
                          : t('roomStatusPage.managedAutomatically')}
                      </div>
                    ) : (
                      actions.map((nextStatus) => (
                        <Button variant="unstyled" size="none"
                          key={nextStatus}
                          type="button"
                          onClick={() => handleStatusChange(room.id, nextStatus)}
                          disabled={updatingRoomId === room.id}
                          className="rounded-full border border-brand-surface-border bg-white px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light disabled:cursor-not-allowed disabled:bg-brand-primary-tint disabled:text-brand-ink-hint"
                        >
                          {updatingRoomId === room.id
                            ? t('roomStatusPage.updating')
                            : getRoomStatusLabel(nextStatus, t)}
                        </Button>
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
