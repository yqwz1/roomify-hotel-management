import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';
import ConfirmationToast from '../components/ConfirmationToast';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { useAuth } from '../context/AuthProvider';
import { ROLE_MANAGER } from '../components/navigation/navConfig';
import {
  fetchRoomGrid,
  modifyReservation,
  extractReservationError,
  isConflictError,
} from '../services/reservationService';
import { formatLocalizedDate } from '../utils/localization';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const WINDOW_DAYS = 14;
const ROOM_LABEL_WIDTH = 140;
const DAY_MIN_WIDTH = 72;
const ROW_HEIGHT = 56;

// Build a YYYY-MM-DD string from local date components to avoid UTC shift bugs
// when the timeline crosses date boundaries in the user's timezone.
const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (iso) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const diffDays = (laterIso, earlierIso) => {
  const a = parseIsoDate(laterIso);
  const b = parseIsoDate(earlierIso);
  return Math.round((a - b) / 86400000);
};

const buildDateColumns = (startIso, days) => {
  const start = parseIsoDate(startIso);
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index);
    return { iso: toIsoDate(date), date };
  });
};

const todayIso = () => toIsoDate(new Date());

const STATUS_PILL_BG = {
  CONFIRMED: 'bg-brand-primary',
  CHECKED_IN: 'bg-brand-primary-deep',
  PENDING: 'bg-brand-primary',
};

const getWeekdayKey = (date) => {
  const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[date.getDay()];
};

export default function RoomGrid() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRtl = i18n.dir() === 'rtl';
  const canEdit = Array.isArray(user?.roles) && user.roles.includes(ROLE_MANAGER);

  const [startDate, setStartDate] = useState(() => todayIso());
  const endDate = useMemo(
    () => toIsoDate(addDays(parseIsoDate(startDate), WINDOW_DAYS - 1)),
    [startDate]
  );

  const [grid, setGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [draggedId, setDraggedId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [resizePreview, setResizePreview] = useState(null);
  const gridContentRef = useRef(null);

  const loadGrid = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRoomGrid(startDate, endDate);
      setGrid(data);
    } catch (err) {
      setError(extractReservationError(err));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadGrid();
  }, [loadGrid]);

  const columns = useMemo(() => buildDateColumns(startDate, WINDOW_DAYS), [startDate]);
  const today = todayIso();

  const handleShiftWindow = (deltaDays) => {
    setStartDate((current) => toIsoDate(addDays(parseIsoDate(current), deltaDays)));
  };

  const handleResetToday = () => setStartDate(todayIso());

  const handleDateInputChange = (event) => {
    const next = event.target.value;
    if (next) setStartDate(next);
  };

  const showToast = (message, type = 'success') => setToast({ message, type });

  const applyLocalUpdate = (reservationId, fromRoomId, toRoomId, updates) => {
    setGrid((current) => {
      if (!current) return current;
      const nextRooms = current.rooms.map((room) => {
        if (room.id === fromRoomId && fromRoomId !== toRoomId) {
          return {
            ...room,
            reservations: room.reservations.filter((r) => r.id !== reservationId),
          };
        }
        if (room.id === toRoomId) {
          const existing = room.reservations.filter((r) => r.id !== reservationId);
          const original = current.rooms
            .flatMap((r) => r.reservations)
            .find((r) => r.id === reservationId);
          const merged = { ...original, ...updates };
          return {
            ...room,
            reservations: [...existing, merged].sort((a, b) =>
              a.checkInDate.localeCompare(b.checkInDate)
            ),
          };
        }
        if (room.id === fromRoomId) {
          return {
            ...room,
            reservations: room.reservations.map((r) =>
              r.id === reservationId ? { ...r, ...updates } : r
            ),
          };
        }
        return room;
      });
      return { ...current, rooms: nextRooms };
    });
  };

  const handleDropOnCell = async (event, targetRoom, targetDateIso) => {
    event.preventDefault();
    if (!canEdit) return;

    const raw = event.dataTransfer.getData('application/json');
    if (!raw) return;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    setDraggedId(null);

    const { reservationId, sourceRoomId, checkInDate, checkOutDate } = payload;
    if (sourceRoomId === targetRoom.id && checkInDate === targetDateIso) {
      return;
    }

    const nights = diffDays(checkOutDate, checkInDate);
    const newCheckIn = targetDateIso;
    const newCheckOut = toIsoDate(addDays(parseIsoDate(newCheckIn), nights));

    // Optimistic update — snapshot for revert.
    const snapshot = grid;
    applyLocalUpdate(reservationId, sourceRoomId, targetRoom.id, {
      checkInDate: newCheckIn,
      checkOutDate: newCheckOut,
    });

    try {
      await modifyReservation(reservationId, {
        roomId: targetRoom.id,
        checkInDate: newCheckIn,
        checkOutDate: newCheckOut,
        modificationReason: 'Reassigned via room grid',
      });
      showToast(t('roomGrid.toast.reassigned', { roomNumber: targetRoom.roomNumber }), 'success');
    } catch (err) {
      setGrid(snapshot);
      if (isConflictError(err)) {
        showToast(extractReservationError(err), 'error');
      } else {
        showToast(t('roomGrid.toast.error'), 'error');
      }
    }
  };

  const handleDragOver = (event) => {
    if (!canEdit) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handlePillDragStart = (event, reservation, roomId) => {
    if (!canEdit) {
      event.preventDefault();
      return;
    }
    const payload = {
      reservationId: reservation.id,
      sourceRoomId: roomId,
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
    };
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
    setDraggedId(reservation.id);
  };

  const handlePillDragEnd = () => setDraggedId(null);

  const handleResizePointerDown = (event, reservation, roomId, columnWidth) => {
    if (!canEdit) return;
    event.stopPropagation();
    event.preventDefault();
    setResizingId(reservation.id);
    const startX = event.clientX;
    const originalNights = diffDays(reservation.checkOutDate, reservation.checkInDate);
    let pendingNights = originalNights;
    setResizePreview({ id: reservation.id, nights: originalNights });

    const handleMove = (moveEvent) => {
      const rawDelta = moveEvent.clientX - startX;
      const direction = isRtl ? -1 : 1;
      const dayDelta = Math.round((rawDelta * direction) / columnWidth);
      const nextNights = Math.max(1, originalNights + dayDelta);
      pendingNights = nextNights;
      setResizePreview({ id: reservation.id, nights: nextNights });
    };

    const handleUp = async () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      setResizingId(null);
      setResizePreview(null);

      if (pendingNights === originalNights) return;

      const newCheckOut = toIsoDate(addDays(parseIsoDate(reservation.checkInDate), pendingNights));
      const snapshot = grid;
      applyLocalUpdate(reservation.id, roomId, roomId, { checkOutDate: newCheckOut });

      try {
        await modifyReservation(reservation.id, {
          checkOutDate: newCheckOut,
          modificationReason: 'Extended via room grid',
        });
        showToast(
          t('roomGrid.toast.extended', {
            date: formatLocalizedDate(newCheckOut, i18n.language, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          }),
          'success'
        );
      } catch (err) {
        setGrid(snapshot);
        if (isConflictError(err)) {
          showToast(extractReservationError(err), 'error');
        } else {
          showToast(t('roomGrid.toast.error'), 'error');
        }
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const gridTemplateColumns = `${ROOM_LABEL_WIDTH}px repeat(${WINDOW_DAYS}, minmax(${DAY_MIN_WIDTH}px, 1fr))`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl text-brand-ink break-words">{t('roomGrid.title')}</h1>
        <p className="text-sm text-brand-ink-muted break-words">{t('roomGrid.subtitle')}</p>
      </header>

      <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-brand-surface-border bg-brand-card p-4">
        <label className="flex min-w-0 items-center gap-2 text-sm font-medium text-brand-ink-muted">
          <CalendarRange className="h-4 w-4 shrink-0" />
          <Input
            type="date"
            value={startDate}
            onChange={handleDateInputChange}
            className="h-10 w-full min-w-0 rounded-lg border-brand-surface-border bg-brand-surface-light px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-focus"
          />
        </label>
        <Button variant="unstyled" size="none"
          type="button"
          onClick={handleResetToday}
          className="rounded-full border border-brand-surface-border bg-brand-card px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-primary-tint focus:outline-none focus:ring-2 focus:ring-brand-focus"
        >
          {t('roomGrid.today')}
        </Button>
        <div className="ms-auto flex min-w-0 items-center gap-2">
          <Button variant="unstyled" size="none"
            type="button"
            onClick={() => handleShiftWindow(-7)}
            aria-label={t('roomGrid.prevWeek')}
            className="rounded-full border border-brand-surface-border bg-brand-card p-2 text-brand-ink transition hover:bg-brand-primary-tint focus:outline-none focus:ring-2 focus:ring-brand-focus"
          >
            <ChevronLeft className="h-4 w-4 rtl:hidden shrink-0" />
            <ChevronRight className="hidden h-4 w-4 rtl:block shrink-0" />
          </Button>
          <Button variant="unstyled" size="none"
            type="button"
            onClick={() => handleShiftWindow(7)}
            aria-label={t('roomGrid.nextWeek')}
            className="rounded-full border border-brand-surface-border bg-brand-card p-2 text-brand-ink transition hover:bg-brand-primary-tint focus:outline-none focus:ring-2 focus:ring-brand-focus"
          >
            <ChevronRight className="h-4 w-4 rtl:hidden shrink-0" />
            <ChevronLeft className="hidden h-4 w-4 rtl:block shrink-0" />
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState title={t('error')} message={error} onRetry={loadGrid} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-brand-surface-border bg-brand-card">
          <div ref={gridContentRef} className="min-w-max">
            <div
              className="sticky top-0 z-20 grid min-w-0 border-b border-brand-surface-border bg-brand-card"
              style={{ gridTemplateColumns }}
            >
              <div className="sticky start-0 z-30 border-e border-brand-surface-border bg-brand-card px-3 py-3 text-xs font-bold uppercase tracking-wide text-brand-ink-muted">
                {t('roomGrid.roomColumn')}
              </div>
              {columns.map((col) => {
                const isToday = col.iso === today;
                return (
                  <div
                    key={col.iso}
                    className={`border-e border-brand-surface-border px-2 py-2 text-center ${
                      isToday ? 'bg-brand-primary-tint' : ''
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wide text-brand-ink-muted">
                      {t(`roomGrid.weekdays.${getWeekdayKey(col.date)}`)}
                    </div>
                    <div className="text-sm font-medium text-brand-ink">
                      {col.date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-md bg-brand-surface-light"
                  />
                ))}
              </div>
            ) : !grid || grid.rooms.length === 0 ? (
              <EmptyState title={t('roomGrid.empty')} message={t('roomGrid.emptyHint')} />
            ) : (
              grid.rooms.map((room) => (
                <RoomRow
                  key={room.id}
                  room={room}
                  columns={columns}
                  startDate={startDate}
                  today={today}
                  canEdit={canEdit}
                  isRtl={isRtl}
                  draggedId={draggedId}
                  resizingId={resizingId}
                  resizePreview={resizePreview}
                  gridTemplateColumns={gridTemplateColumns}
                  onDrop={handleDropOnCell}
                  onDragOver={handleDragOver}
                  onPillDragStart={handlePillDragStart}
                  onPillDragEnd={handlePillDragEnd}
                  onResizePointerDown={handleResizePointerDown}
                />
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmationToast
        message={toast?.message ?? null}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

function RoomRow({
  room,
  columns,
  startDate,
  today,
  canEdit,
  isRtl,
  draggedId,
  resizingId,
  resizePreview,
  gridTemplateColumns,
  onDrop,
  onDragOver,
  onPillDragStart,
  onPillDragEnd,
  onResizePointerDown,
}) {
  const rowRef = useRef(null);
  const [columnWidth, setColumnWidth] = useState(DAY_MIN_WIDTH);

  useEffect(() => {
    if (!rowRef.current) return undefined;
    const updateWidth = () => {
      const total = rowRef.current.getBoundingClientRect().width;
      const available = Math.max(0, total - ROOM_LABEL_WIDTH);
      setColumnWidth(available / columns.length);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [columns.length]);

  const windowStart = parseIsoDate(startDate);

  return (
    <div
      ref={rowRef}
      className="relative grid min-w-0 border-b border-brand-surface-border"
      style={{ gridTemplateColumns, minHeight: ROW_HEIGHT }}
    >
      <div className="sticky start-0 z-10 flex min-w-0 items-center gap-1 border-e border-brand-surface-border bg-brand-card px-3">
        <span className="font-medium text-brand-ink break-words">{room.roomNumber}</span>
        {room.roomTypeCode ? (
          <span className="text-xs text-brand-ink-hint break-words">{room.roomTypeCode}</span>
        ) : null}
      </div>
      {columns.map((col) => {
        const isToday = col.iso === today;
        return (
          <div
            key={col.iso}
            className={`border-e border-brand-surface-border ${
              isToday ? 'bg-brand-primary-tint' : 'bg-brand-surface-light'
            }`}
            onDragOver={onDragOver}
            onDrop={(event) => onDrop(event, room, col.iso)}
          />
        );
      })}

      {room.reservations.map((reservation) => {
        const resCheckIn = parseIsoDate(reservation.checkInDate);
        const resCheckOut = parseIsoDate(reservation.checkOutDate);

        // Clip the pill to the visible window. realStartOffset can be negative
        // when checkInDate predates the window (e.g. a stay that started before
        // the user scrolled here); preWindowNights captures that hidden prefix
        // so the resize preview width is computed against the visible portion.
        const realStartOffset = Math.round((resCheckIn - windowStart) / 86400000);
        const startOffset = Math.max(0, realStartOffset);
        const preWindowNights = Math.max(0, -realStartOffset);
        const endOffset = Math.min(
          columns.length,
          Math.round((resCheckOut - windowStart) / 86400000)
        );
        const baseSpan = endOffset - startOffset;
        if (baseSpan <= 0) return null;

        const isResizing =
          resizingId === reservation.id && resizePreview?.id === reservation.id;
        // resizePreview.nights is the total stay length from checkInDate, so
        // for clipped pills we must subtract the pre-window nights to get the
        // visible width — otherwise dragging a historical-start pill renders
        // an over-wide preview.
        const visibleNights = isResizing
          ? resizePreview.nights - preWindowNights
          : baseSpan;
        const span = Math.min(columns.length - startOffset, Math.max(1, visibleNights));

        const isDragging = draggedId === reservation.id;
        const bgClass = STATUS_PILL_BG[reservation.status] ?? 'bg-brand-primary';

        const positionStyle = isRtl
          ? { right: `calc(${ROOM_LABEL_WIDTH}px + ${startOffset} * ${columnWidth}px)` }
          : { left: `calc(${ROOM_LABEL_WIDTH}px + ${startOffset} * ${columnWidth}px)` };

        return (
          <div
            key={reservation.id}
            draggable={canEdit}
            onDragStart={(event) => onPillDragStart(event, reservation, room.id)}
            onDragEnd={onPillDragEnd}
            tabIndex={0}
            role="button"
            aria-label={`${reservation.guestName} · ${reservation.confirmationNumber}`}
            className={`absolute top-1/2 flex min-w-0 -translate-y-1/2 items-center gap-2 truncate rounded-full px-3 py-1.5 text-sm font-sans text-brand-primary-fg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-focus focus:ring-offset-1 ${bgClass} ${
              canEdit ? 'cursor-grab hover:-translate-y-[calc(50%+1px)] hover:shadow-brand-cta active:cursor-grabbing' : 'cursor-default'
            } ${isDragging ? 'opacity-60 shadow-brand-cta-hover' : ''}`}
            style={{
              ...positionStyle,
              width: `calc(${span} * ${columnWidth}px - 6px)`,
              marginLeft: isRtl ? 0 : 3,
              marginRight: isRtl ? 3 : 0,
            }}
          >
            <span className="min-w-0 flex-1 truncate pe-2">
              <span className="font-bold">{reservation.confirmationNumber}</span>
              <span className="opacity-80"> · {reservation.guestName}</span>
            </span>
            {canEdit ? (
              <span
                onPointerDown={(event) =>
                  onResizePointerDown(event, reservation, room.id, columnWidth)
                }
                role="presentation"
                aria-hidden="true"
                // The handle always sits on the checkout edge — that's `end-0`
                // in both LTR and RTL (logical end = checkout side, because the
                // pill grows in the document's reading direction from check-in
                // to checkout).
                className="absolute top-0 h-full w-2 cursor-ew-resize end-0"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
