import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ModalFrame from '../components/common/ModalFrame';
import RoomFilters from '../components/RoomFilters';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { useRooms } from '../hooks/useRooms';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
  formatLocalizedCurrency,
  getRoomStatusLabel,
  translateKnownValue,
} from '../utils/localization';
import { getStatusBadgeClasses } from '../utils/statusPresentation';

const EMPTY_FILTERS = { status: '', type: '', floor: '', minPrice: '', maxPrice: '' };
const BACKEND_STATUSES = ['AVAILABLE', 'OCCUPIED', 'NEEDS_CLEANING', 'UNDER_MAINTENANCE'];

const buildApiFilters = (filters) => {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.type) params.type = filters.type;
  if (filters.floor) params.floor = Number(filters.floor);
  return params;
};

const buildRoomForm = (roomTypes, initialRoom) => ({
  roomNumber: initialRoom?.roomNumber ?? '',
  roomTypeId: initialRoom?.roomType?.id ?? roomTypes[0]?.id ?? '',
  floor: initialRoom?.floor ?? 1,
  status: initialRoom?.status ?? 'AVAILABLE',
});

function RoomFormModal({ roomTypes, initialRoom, onSave, onClose }) {
  const { t } = useTranslation();
  const isEditing = Boolean(initialRoom);
  const [form, setForm] = useState(() => buildRoomForm(roomTypes, initialRoom));
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildRoomForm(roomTypes, initialRoom));
  }, [initialRoom, roomTypes]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!form.roomNumber.trim()) {
      setFormError(t('roomNumRequired'));
      return;
    }

    if (!form.roomTypeId) {
      setFormError(t('roomType'));
      return;
    }

    setSaving(true);
    const result = await onSave({
      roomNumber: form.roomNumber.trim(),
      roomTypeId: Number(form.roomTypeId),
      floor: Number(form.floor) || null,
      status: form.status,
    });
    setSaving(false);

    if (result.success) {
      onClose();
      return;
    }

    setFormError(result.error);
  };

  const inputClassName =
    'h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

  return (
    <ModalFrame
      title={
        isEditing
          ? t('roomsManagementPage.updateRoomTitle', { room: initialRoom.roomNumber })
          : t('roomsManagementPage.addRoomTitle')
      }
      description={
        isEditing
          ? t('roomsManagementPage.updateRoomDescription')
          : t('roomsManagementPage.addRoomDescription')
      }
      onClose={onClose}
      closeLabel={t('closeDialog')}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
            {t('roomNumLabel')}
          </label>
          <input
            id="room-number"
            aria-label={t('roomNumLabel')}
            value={form.roomNumber}
            onChange={(event) => setField('roomNumber', event.target.value)}
            placeholder={t('roomNumPlaceholder')}
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
            {t('roomType')}
          </label>
          <select
            id="room-type"
            aria-label={t('roomType')}
            value={form.roomTypeId}
            onChange={(event) => setField('roomTypeId', event.target.value)}
            className={inputClassName}
          >
            {roomTypes.map((roomType) => (
              <option key={roomType.id} value={roomType.id}>
                {translateKnownValue(roomType.name, t)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
              {t('floor')}
            </label>
            <input
              id="room-floor"
              aria-label={t('floor')}
              type="number"
              min="1"
              value={form.floor}
              onChange={(event) => setField('floor', event.target.value)}
              className={inputClassName}
            />
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                {t('roomsManagementPage.currentStatus')}
              </label>
              <div className="rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${
                      getStatusBadgeClasses(form.status)
                    }`}
                  >
                    {getRoomStatusLabel(form.status, t)}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-ink-hint">
                    {t('roomsManagementPage.statusManagedOnBoard')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                {t('initialStatusLabel')}
              </label>
              <select
                id="room-status"
                aria-label={t('initialStatusLabel')}
                value={form.status}
                onChange={(event) => setField('status', event.target.value)}
                className={inputClassName}
              >
                {BACKEND_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getRoomStatusLabel(status, t)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted"
          >
            {saving ? t('roomsManagementPage.savingRoom') : t('roomsManagementPage.saveRoom')}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

export default function RoomsManagement() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { rooms, loading, error, fetchRooms, addRoom, editRoom, removeRoom, clearError } = useRooms();
  const { roomTypes, fetchRoomTypes } = useRoomTypes();
  const showMobileCards = useMediaQuery('(max-width: 767px)');

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [bannerError, setBannerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();
  }, [fetchRooms, fetchRoomTypes]);

  const displayedRooms = useMemo(() => {
    const minPrice = filters.minPrice ? Number(filters.minPrice) : null;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;

    return rooms.filter((room) => {
      const price = Number(room.roomType?.basePrice ?? 0);
      if (minPrice != null && price < minPrice) return false;
      if (maxPrice != null && price > maxPrice) return false;
      return true;
    });
  }, [rooms, filters.minPrice, filters.maxPrice]);

 

  const roomTypeOptions = useMemo(
    () => roomTypes.map((roomType) => ({ value: roomType.name, label: translateKnownValue(roomType.name, t) })),
    [roomTypes, t]
  );

  const floorOptions = useMemo(
    () =>
      [...new Set(rooms.map((room) => room.floor).filter((floor) => floor != null))]
        .sort((a, b) => a - b)
        .map((floor) => ({ value: floor, label: String(floor) })),
    [rooms]
  );

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

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    fetchRooms(buildApiFilters(newFilters));
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    fetchRooms();
  };

  const handleCloseRoomModal = () => {
    setShowRoomModal(false);
    setEditingRoom(null);
  };

  const handleOpenCreate = () => {
    setBannerError(null);
    setSuccessMessage(null);
    setEditingRoom(null);
    setShowRoomModal(true);
  };

  const handleOpenEdit = (room) => {
    setBannerError(null);
    setSuccessMessage(null);
    setEditingRoom(room);
    setShowRoomModal(true);
  };

  const handleSaveRoom = async (data) => {
    const result = editingRoom
      ? await editRoom(editingRoom.id, { ...data, status: editingRoom.status })
      : await addRoom(data);

    if (result.success) {
      setSuccessMessage(
        editingRoom
          ? t('roomsManagementPage.roomUpdated', { room: data.roomNumber })
          : t('roomsManagementPage.roomCreated', { room: data.roomNumber })
      );
      handleCloseRoomModal();
      fetchRooms(buildApiFilters(filters));
    }
    return result;
  };

  const handleDelete = async (room) => {
    if (!window.confirm(t('roomsManagementPage.deleteConfirm', { room: room.roomNumber }))) {
      return;
    }

    const result = await removeRoom(room.id);
    if (!result.success) {
      setBannerError(result.error);
      return;
    }

    setSuccessMessage(null);
    fetchRooms(buildApiFilters(filters));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={t('roomsManagementPage.heroEyebrow')}
        title={t('roomsManagement')}
        description={t('roomsManagementPage.description')}
        meta={[
          t('roomsManagementPage.roomsLoaded', { count: rooms.length }),
          t('roomsManagementPage.availableCount', { count: summary.AVAILABLE }),
          t('roomsManagementPage.roomTypesCount', { count: roomTypes.length }),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint">
            {t('roomsManagementPage.snapshotTitle')}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('roomsManagementPage.cleaning')}
              </p>
              <p className="mt-2 text-lg font-black">{summary.NEEDS_CLEANING}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('roomsManagementPage.maintenance')}
              </p>
              <p className="mt-2 text-lg font-black">{summary.UNDER_MAINTENANCE}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep h-auto"
        >
          <Plus className="h-4 w-4" />
          {t('roomsManagementPage.addRoomCta')}
        </Button>
      </div>

      {(bannerError || error) && (
        <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
          <div className="flex items-start justify-between gap-3">
            <span>{bannerError || error}</span>
            <button
              type="button"
              onClick={() => {
                setBannerError(null);
                clearError();
              }}
              className="text-xs font-bold uppercase tracking-[0.18em] text-brand-danger"
            >
              {t('dismissError')}
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-[1.25rem] border border-brand-success/30 bg-brand-success/10 px-4 py-3 text-sm font-medium text-brand-success">
          {successMessage}
        </div>
      )}

      <RoomFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
        roomTypeOptions={roomTypeOptions}
        floorOptions={floorOptions}
        showPriceRange={false}
      />

      <DashboardPanel
        title={t('roomsManagementPage.inventoryTableTitle')}
        description={t('roomsManagementPage.inventoryTableDescription', {
          count: displayedRooms.length,
        })}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-2xl bg-brand-primary-tint" />
            ))}
          </div>
        ) : displayedRooms.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-brand-surface-border bg-brand-surface-light px-6 py-14 text-center">
            <Waves className="mx-auto h-10 w-10 text-brand-ink-hint" />
            <p className="mt-4 text-lg font-black text-brand-ink">{t('roomsManagementPage.noRoomsTitle')}</p>
            <p className="mt-2 text-sm font-medium text-brand-ink-muted">
              {t('roomsManagementPage.noRoomsDescription')}
            </p>
          </div>
        ) : (
          <>
            {showMobileCards ? (
            <div className="space-y-4">
              {displayedRooms.map((room) => {
                const amenities = room.roomType?.amenities
                  ? room.roomType.amenities
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean)
                  : [];

                return (
                  <article
                    key={room.id}
                    className="rounded-[1.5rem] border border-brand-surface-border bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-black tracking-tight text-brand-ink">
                          {room.roomNumber}
                        </p>
                        <p className="mt-1 text-sm font-medium text-brand-ink-muted">
                          {translateKnownValue(room.roomType?.name, t)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${getStatusBadgeClasses(room.status)}`}
                      >
                        {getRoomStatusLabel(room.status, t)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                          {t('roomsManagementPage.tableFloor')}
                        </p>
                        <p className="mt-2 text-sm font-bold text-brand-ink">{room.floor ?? '-'}</p>
                      </div>
                      <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                          {t('roomsManagementPage.tableBasePrice')}
                        </p>
                        <p className="mt-2 text-sm font-bold text-brand-ink">
                          {formatLocalizedCurrency(room.roomType?.basePrice, i18n.language)}
                        </p>
                      </div>
                      <div className="rounded-[1.15rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink-hint">
                          {t('roomsManagementPage.tableCapacity')}
                        </p>
                        <p className="mt-2 text-sm font-bold text-brand-ink">
                          {room.roomType?.maxGuests ?? '-'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {amenities.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-xs font-bold text-brand-ink-muted"
                        >
                          {translateKnownValue(amenity, t)}
                        </span>
                      ))}
                      {amenities.length > 4 ? (
                        <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-xs font-bold text-brand-ink-muted">
                          +{amenities.length - 4}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => handleOpenEdit(room)}
                        className="inline-flex h-auto items-center justify-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
                      >
                        <Pencil className="h-4 w-4" />
                        {t('roomsManagementPage.editButton')}
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() =>
                          navigate('/room-status', {
                            state: {
                              initialFilter: room.status,
                              initialQuery: room.roomNumber,
                            },
                          })
                        }
                        className="inline-flex h-auto items-center justify-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
                      >
                        {t('roomsManagementPage.openStatusBoard')}
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => handleDelete(room)}
                        className="inline-flex h-auto items-center justify-center gap-2 rounded-full border border-brand-danger/30 px-4 py-2 text-sm font-bold text-brand-danger transition hover:bg-brand-danger/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('roomsManagementPage.deleteButton')}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
            ) : (
            <div className="overflow-x-auto rounded-[1.5rem] border border-brand-surface-border">
              <Table className="min-w-full">
              <TableHeader className="bg-brand-surface-light">
                <TableRow>
                  {[
                    t('roomsManagementPage.tableRoom'),
                    t('roomsManagementPage.tableFloor'),
                    t('roomsManagementPage.tableType'),
                    t('roomsManagementPage.tableBasePrice'),
                    t('roomsManagementPage.tableCapacity'),
                    t('roomsManagementPage.tableAmenities'),
                    t('roomsManagementPage.tableActions'),
                  ].map((heading) => (
                    <TableHead
                      key={heading}
                      className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.18em] text-brand-ink-muted h-auto"
                    >
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {displayedRooms.map((room) => {
                  const amenities = room.roomType?.amenities
                    ? room.roomType.amenities
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <TableRow key={room.id}>
                      <TableCell className="px-4 py-4 text-xl font-black tracking-tight text-brand-ink">
                        {room.roomNumber}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm font-medium text-brand-ink-muted">
                        {room.floor ?? '-'}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm font-bold text-brand-ink">
                        {translateKnownValue(room.roomType?.name, t)}
                      </TableCell>
                      
                      <TableCell className="px-4 py-4 text-sm font-bold text-brand-ink">
                        {formatLocalizedCurrency(room.roomType?.basePrice, i18n.language)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm font-medium text-brand-ink-muted">
                        {room.roomType?.maxGuests ?? '-'}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex max-w-xs flex-wrap gap-2">
                          {amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-xs font-bold text-brand-ink-muted"
                            >
                              {translateKnownValue(amenity, t)}
                            </span>
                          ))}
                          {amenities.length > 3 && (
                            <span className="rounded-full border border-brand-surface-border bg-brand-surface-light px-3 py-1 text-xs font-bold text-brand-ink-muted">
                              +{amenities.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => handleOpenEdit(room)}
                            className="inline-flex items-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light h-auto"
                          >
                            <Pencil className="h-4 w-4" />
                            {t('roomsManagementPage.editButton')}
                          </Button>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() =>
                              navigate('/room-status', {
                                state: {
                                  initialFilter: room.status,
                                  initialQuery: room.roomNumber,
                                },
                              })
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-brand-surface-border px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light h-auto"
                          >
                            {t('roomsManagementPage.openStatusBoard')}
                          </Button>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => handleDelete(room)}
                            className="inline-flex items-center gap-2 rounded-full border border-brand-danger/30 px-4 py-2 text-sm font-bold text-brand-danger transition hover:bg-brand-danger/10 h-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('roomsManagementPage.deleteButton')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
            )}
          </>
        )}
      </DashboardPanel>

      {showRoomModal && (
        <RoomFormModal
          roomTypes={roomTypes}
          initialRoom={editingRoom}
          onSave={handleSaveRoom}
          onClose={handleCloseRoomModal}
        />
      )}

    </div>
  );
}
