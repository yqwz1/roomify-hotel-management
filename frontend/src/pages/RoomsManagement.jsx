import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModalFrame from '../components/common/ModalFrame';
import RoomFilters from '../components/RoomFilters';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { useRooms } from '../hooks/useRooms';
import { useRoomTypes } from '../hooks/useRoomTypes';
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
  displayName: initialRoom?.displayName ?? '',
  primaryPhotoUrl: initialRoom?.primaryPhotoUrl ?? '',
  galleryPhotoUrls: initialRoom?.galleryPhotoUrls ?? '',
  bedType: initialRoom?.bedType ?? '',
  viewType: initialRoom?.viewType ?? '',
  sizeSquareMeters: initialRoom?.sizeSquareMeters ?? '',
  featuredNote: initialRoom?.featuredNote ?? '',
  customAmenities: initialRoom?.customAmenities ?? '',
  bookable: initialRoom?.bookable ?? true,
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
      displayName: form.displayName.trim(),
      primaryPhotoUrl: form.primaryPhotoUrl.trim(),
      galleryPhotoUrls: form.galleryPhotoUrls.trim(),
      bedType: form.bedType.trim(),
      viewType: form.viewType.trim(),
      sizeSquareMeters: form.sizeSquareMeters ? Number(form.sizeSquareMeters) : null,
      featuredNote: form.featuredNote.trim(),
      customAmenities: form.customAmenities.trim(),
      bookable: Boolean(form.bookable),
    });
    setSaving(false);

    if (result.success) {
      onClose();
      return;
    }

    setFormError(result.error);
  };

  const inputClassName =
    'h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

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
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
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
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
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
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
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
              <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                {t('roomsManagementPage.currentStatus')}
              </label>
              <div className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${
                      getStatusBadgeClasses(form.status)
                    }`}
                  >
                    {getRoomStatusLabel(form.status, t)}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                    {t('roomsManagementPage.statusManagedOnBoard')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Display Name
            </label>
            <input
              value={form.displayName}
              onChange={(event) => setField('displayName', event.target.value)}
              placeholder="Executive Corner Room"
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Primary Photo URL
            </label>
            <input
              value={form.primaryPhotoUrl}
              onChange={(event) => setField('primaryPhotoUrl', event.target.value)}
              placeholder="https://..."
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Gallery Photo URLs
            </label>
            <textarea
              value={form.galleryPhotoUrls}
              onChange={(event) => setField('galleryPhotoUrls', event.target.value)}
              placeholder="Comma-separated image URLs"
              className="min-h-24 w-full rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Room Visibility
            </label>
            <select
              value={form.bookable ? 'true' : 'false'}
              onChange={(event) => setField('bookable', event.target.value === 'true')}
              className={inputClassName}
            >
              <option value="true">Visible and bookable</option>
              <option value="false">Hidden from guest search</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Bed Type
            </label>
            <input
              value={form.bedType}
              onChange={(event) => setField('bedType', event.target.value)}
              placeholder="King Bed"
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              View Type
            </label>
            <input
              value={form.viewType}
              onChange={(event) => setField('viewType', event.target.value)}
              placeholder="City View"
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Size (sqm)
            </label>
            <input
              type="number"
              min="1"
              value={form.sizeSquareMeters}
              onChange={(event) => setField('sizeSquareMeters', event.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Room Amenities Override
            </label>
            <input
              value={form.customAmenities}
              onChange={(event) => setField('customAmenities', event.target.value)}
              placeholder="Coffee Machine, Smart TV, Work Desk"
              className={inputClassName}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Display Note
            </label>
            <textarea
              value={form.featuredNote}
              onChange={(event) => setField('featuredNote', event.target.value)}
              placeholder="Quiet corner room designed for longer stays."
              className="min-h-24 w-full rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
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

  const statusOptions = useMemo(
    () => BACKEND_STATUSES.map((status) => ({ value: status, label: getRoomStatusLabel(status, t) })),
    [t]
  );

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
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
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
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t('roomsManagementPage.snapshotTitle')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
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
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          {t('roomsManagementPage.addRoomCta')}
        </button>
      </div>

      {(bannerError || error) && (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
          <div className="flex items-start justify-between gap-3">
            <span>{bannerError || error}</span>
            <button
              type="button"
              onClick={() => {
                setBannerError(null);
                clearError();
              }}
              className="text-xs font-bold uppercase tracking-[0.18em] text-rose-800"
            >
              {t('dismissError')}
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {successMessage}
        </div>
      )}

      <RoomFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
        statusOptions={statusOptions}
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
              <div key={index} className="h-14 animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        ) : displayedRooms.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center">
            <Waves className="mx-auto h-10 w-10 text-zinc-400" />
            <p className="mt-4 text-lg font-black text-zinc-950">{t('roomsManagementPage.noRoomsTitle')}</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              {t('roomsManagementPage.noRoomsDescription')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-zinc-200">
            <table className="min-w-full border-collapse">
              <thead className="bg-zinc-50">
                <tr>
                  {[
                    t('roomsManagementPage.tableRoom'),
                    t('roomsManagementPage.tableFloor'),
                    t('roomsManagementPage.tableType'),
                    t('roomsManagementPage.tableStatus'),
                    t('roomsManagementPage.tableBasePrice'),
                    t('roomsManagementPage.tableCapacity'),
                    t('roomsManagementPage.tableAmenities'),
                    t('roomsManagementPage.tableActions'),
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-left text-xs font-black uppercase tracking-[0.18em] text-zinc-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {displayedRooms.map((room) => {
                  const amenitySource = room.customAmenities || room.roomType?.amenities;
                  const amenities = amenitySource
                    ? amenitySource
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <tr key={room.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-20 overflow-hidden rounded-2xl bg-zinc-100">
                            {room.primaryPhotoUrl ? (
                              <img src={room.primaryPhotoUrl} alt={room.displayName || room.roomNumber} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xl font-black tracking-tight text-zinc-950">
                              {room.displayName || room.roomNumber}
                            </p>
                            <p className="mt-1 text-sm font-medium text-zinc-500">
                              Room {room.roomNumber}
                              {room.bookable ? ' • Bookable' : ' • Hidden'}
                            </p>
                            {room.featuredNote ? (
                              <p className="mt-1 max-w-sm text-sm font-medium text-zinc-500">
                                {room.featuredNote}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-zinc-600">
                        {room.floor ?? '-'}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-zinc-950">
                        {translateKnownValue(room.roomType?.name, t)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${
                            getStatusBadgeClasses(room.status)
                          }`}
                        >
                          {getRoomStatusLabel(room.status, t)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-zinc-950">
                        {formatLocalizedCurrency(room.roomType?.basePrice, i18n.language)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-zinc-600">
                        {room.roomType?.maxGuests ?? '-'}
                        {(room.bedType || room.viewType || room.sizeSquareMeters) ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            {[room.bedType, room.viewType, room.sizeSquareMeters ? `${room.sizeSquareMeters} sqm` : null]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex max-w-xs flex-wrap gap-2">
                          {amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-600"
                            >
                              {translateKnownValue(amenity, t)}
                            </span>
                          ))}
                          {amenities.length > 3 && (
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-600">
                              +{amenities.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(room)}
                            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                          >
                            <Pencil className="h-4 w-4" />
                            {t('roomsManagementPage.editButton')}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate('/room-status', {
                                state: {
                                  initialFilter: room.status,
                                  initialQuery: room.roomNumber,
                                },
                              })
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                          >
                            {t('roomsManagementPage.openStatusBoard')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(room)}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-rose-900 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('roomsManagementPage.deleteButton')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
