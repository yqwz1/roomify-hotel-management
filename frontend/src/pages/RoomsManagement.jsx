import { useEffect, useMemo, useState } from 'react';
import {
  Pencil,
  Plus,
  Trash2,
  Waves,
  X,
} from 'lucide-react';
import { useRooms } from '../hooks/useRooms';
import { useRoomTypes } from '../hooks/useRoomTypes';
import RoomFilters from '../components/RoomFilters';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';

const EMPTY_FILTERS = { status: '', type: '', floor: '', minPrice: '', maxPrice: '' };

const BACKEND_STATUSES = [
  'AVAILABLE',
  'OCCUPIED',
  'NEEDS_CLEANING',
  'UNDER_MAINTENANCE',
];

const STATUS_LABELS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  NEEDS_CLEANING: 'Needs Cleaning',
  UNDER_MAINTENANCE: 'Under Maintenance',
};

const STATUS_STYLES = {
  AVAILABLE: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  OCCUPIED: 'border-zinc-300 bg-zinc-100 text-zinc-700',
  NEEDS_CLEANING: 'border-amber-200 bg-amber-50 text-amber-900',
  UNDER_MAINTENANCE: 'border-rose-200 bg-rose-50 text-rose-900',
};

const buildApiFilters = (filters) => {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.type) params.type = filters.type;
  if (filters.floor) params.floor = Number(filters.floor);
  return params;
};

function ModalFrame({ title, description, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-black/5 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950">{title}</h2>
            {description && (
              <p className="mt-1 text-sm font-medium text-zinc-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function AddRoomModal({ roomTypes, onSave, onClose }) {
  const [form, setForm] = useState({
    roomNumber: '',
    roomTypeId: roomTypes[0]?.id ?? '',
    floor: 1,
    status: 'AVAILABLE',
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!form.roomNumber.trim()) {
      setFormError('Room number is required.');
      return;
    }

    if (!form.roomTypeId) {
      setFormError('Please select a room type.');
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

    setFormError(result.error ?? 'Failed to create room.');
  };

  const inputClassName =
    'h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

  return (
    <ModalFrame
      title="Add New Room"
      description="Create a room record using an existing room type and an initial operational status."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Room Number
          </label>
          <input
            value={form.roomNumber}
            onChange={(event) => setField('roomNumber', event.target.value)}
            placeholder="e.g. 305"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Room Type
          </label>
          <select
            value={form.roomTypeId}
            onChange={(event) => setField('roomTypeId', event.target.value)}
            className={inputClassName}
          >
            {roomTypes.map((roomType) => (
              <option key={roomType.id} value={roomType.id}>
                {roomType.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Floor
            </label>
            <input
              type="number"
              min="1"
              value={form.floor}
              onChange={(event) => setField('floor', event.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              Initial Status
            </label>
            <select
              value={form.status}
              onChange={(event) => setField('status', event.target.value)}
              className={inputClassName}
            >
              {BACKEND_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {saving ? 'Saving Room...' : 'Save Room'}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function UpdateStatusModal({ room, onSave, onClose }) {
  const [selectedStatus, setSelectedStatus] = useState(room.status);
  const [modalError, setModalError] = useState(null);
  const [saving, setSaving] = useState(false);

  const inputClassName =
    'h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setModalError(null);

    if (selectedStatus === room.status) {
      onClose();
      return;
    }

    setSaving(true);
    const result = await onSave(room.id, selectedStatus);
    setSaving(false);

    if (result.success) {
      onClose();
      return;
    }

    setModalError(result.error ?? 'Failed to update room status.');
  };

  return (
    <ModalFrame
      title={`Update Room ${room.roomNumber}`}
      description="Choose the next operational status. The backend still enforces transition rules."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {modalError && (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {modalError}
          </div>
        )}

        <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Current Status
          </p>
          <div
            className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] ${
              STATUS_STYLES[room.status]
            }`}
          >
            {STATUS_LABELS[room.status]}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            New Status
          </label>
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className={inputClassName}
          >
            {BACKEND_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {selectedStatus === 'AVAILABLE' && room.status === 'OCCUPIED' && (
          <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            The backend will reject an occupied room returning directly to available. Move it
            through needs cleaning first.
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {saving ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

export default function RoomsManagement() {
  const { rooms, loading, error, fetchRooms, addRoom, changeStatus, removeRoom, clearError } =
    useRooms();
  const { roomTypes, fetchRoomTypes } = useRoomTypes();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [bannerError, setBannerError] = useState(null);

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
    () => BACKEND_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
    []
  );

  const roomTypeOptions = useMemo(
    () => roomTypes.map((roomType) => ({ value: roomType.name, label: roomType.name })),
    [roomTypes]
  );

  const floorOptions = useMemo(
    () =>
      [...new Set(rooms.map((room) => room.floor).filter((floor) => floor != null))]
        .sort((a, b) => a - b)
        .map((floor) => ({ value: floor, label: String(floor) })),
    [rooms]
  );

  const summary = useMemo(() => {
    return rooms.reduce(
      (acc, room) => {
        if (acc[room.status] != null) {
          acc[room.status] += 1;
        }
        return acc;
      },
      {
        AVAILABLE: 0,
        OCCUPIED: 0,
        NEEDS_CLEANING: 0,
        UNDER_MAINTENANCE: 0,
      }
    );
  }, [rooms]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    fetchRooms(buildApiFilters(newFilters));
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    fetchRooms();
  };

  const handleAddRoom = async (data) => {
    const result = await addRoom(data);
    if (result.success) {
      fetchRooms(buildApiFilters(filters));
    }
    return result;
  };

  const handleChangeStatus = async (id, status) => {
    const result = await changeStatus(id, status);
    if (result.success) {
      fetchRooms(buildApiFilters(filters));
    }
    return result;
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Delete Room ${room.roomNumber}? This cannot be undone.`)) return;

    const result = await removeRoom(room.id);
    if (!result.success) {
      setBannerError(result.error ?? 'Failed to delete room.');
      return;
    }

    fetchRooms(buildApiFilters(filters));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow="Inventory Control"
        title="Rooms Management"
        description="Manage live room inventory, operational status, and room setup from a single manager workspace."
        meta={[
          `${rooms.length} rooms loaded`,
          `${summary.AVAILABLE} available`,
          `${roomTypes.length} room types`,
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Inventory Snapshot
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Cleaning
              </p>
              <p className="mt-2 text-lg font-black">{summary.NEEDS_CLEANING}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Maintenance
              </p>
              <p className="mt-2 text-lg font-black">{summary.UNDER_MAINTENANCE}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          Add Room
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
              Dismiss
            </button>
          </div>
        </div>
      )}

      <RoomFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
        statusOptions={statusOptions}
        roomTypeOptions={roomTypeOptions}
        floorOptions={floorOptions}
      />

      <DashboardPanel
        title="Inventory Table"
        description={`${displayedRooms.length} room${displayedRooms.length === 1 ? '' : 's'} shown in the current filter state.`}
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
            <p className="mt-4 text-lg font-black text-zinc-950">No rooms match the filters</p>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              Adjust the status, type, floor, or price range filters to expand the inventory list.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-zinc-200">
            <table className="min-w-full border-collapse">
              <thead className="bg-zinc-50">
                <tr>
                  {[
                    'Room',
                    'Floor',
                    'Type',
                    'Status',
                    'Base Price',
                    'Capacity',
                    'Amenities',
                    'Actions',
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
                  const amenities = room.roomType?.amenities
                    ? room.roomType.amenities
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <tr key={room.id}>
                      <td className="px-4 py-4 text-xl font-black tracking-tight text-zinc-950">
                        {room.roomNumber}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-zinc-600">
                        {room.floor ?? '-'}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-zinc-950">
                        {room.roomType?.name ?? '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${
                            STATUS_STYLES[room.status]
                          }`}
                        >
                          {STATUS_LABELS[room.status] ?? room.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-zinc-950">
                        ${Number(room.roomType?.basePrice ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-zinc-600">
                        {room.roomType?.maxGuests ?? '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex max-w-xs flex-wrap gap-2">
                          {amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-600"
                            >
                              {amenity}
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
                            onClick={() => setStatusModal(room)}
                            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                          >
                            <Pencil className="h-4 w-4" />
                            Status
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(room)}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-rose-900 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
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

      {showAddModal && (
        <AddRoomModal
          roomTypes={roomTypes}
          onSave={handleAddRoom}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {statusModal && (
        <UpdateStatusModal
          room={statusModal}
          onSave={handleChangeStatus}
          onClose={() => setStatusModal(null)}
        />
      )}
    </div>
  );
}
