import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarRange, FileText, RefreshCw } from 'lucide-react';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import DateRangePicker from '../components/DateRangePicker';
import ErrorBanner from '../components/ErrorBanner';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { searchRooms } from '../services/searchService';
import { modifyReservation, extractReservationError } from '../services/reservationService';
import { useTranslation } from 'react-i18next';
import { reservationStatusRules, normalizeReservationStatusLabel } from '../domain/reservations/statusRules';

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

function ModifyModal({ reservation, onClose, onSave }) {
  const { t } = useTranslation();
  const [checkIn, setCheckIn] = useState(reservation.checkInDate);
  const [checkOut, setCheckOut] = useState(reservation.checkOutDate);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(reservation.roomId);

  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setAvailableRooms([]);
      return;
    }

    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const data = await searchRooms({ checkIn, checkOut });
        const roomList = [...(data.rooms || [])];
        const hasCurrentRoom = roomList.some((room) => room.id === reservation.roomId);

        if (!hasCurrentRoom) {
          roomList.push({
            id: reservation.roomId,
            roomNumber: reservation.roomNumber,
            roomType: {
              name: reservation.roomTypeName,
              basePrice: reservation.roomRate,
              maxGuests: reservation.guestCapacity || 2,
            },
          });
        }

        setAvailableRooms(roomList);
        setSelectedRoomId(reservation.roomId);
      } catch {
        setAvailableRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [
    checkIn,
    checkOut,
    reservation.roomId,
    reservation.roomNumber,
    reservation.roomTypeName,
    reservation.roomRate,
    reservation.guestCapacity,
  ]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
    return Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  }, [checkIn, checkOut]);

  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room.id === Number(selectedRoomId)),
    [availableRooms, selectedRoomId]
  );

  const nightlyRate = Number(selectedRoom?.roomType?.basePrice || reservation.roomRate || 0);
  const subtotal = nightlyRate * nights;
  const taxes = subtotal * 0.1;
  const totalPrice = subtotal + taxes;

  const unchanged =
    checkIn === reservation.checkInDate &&
    checkOut === reservation.checkOutDate &&
    Number(selectedRoomId) === reservation.roomId;

  const handleSave = async () => {
    if (nights <= 0) {
      setError('Check-out must be after check-in.');
      return;
    }

    if (unchanged) {
      setError('No changes detected.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const payload = {
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomId: Number(selectedRoomId),
      };

      const trimmedReason = reason.trim();
      if (trimmedReason) {
        payload.modificationReason = trimmedReason;
      }

      const result = await modifyReservation(
        reservation.id ?? reservation.confirmationNumber,
        payload
      );

      const updated = {
        ...reservation,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomId: Number(selectedRoomId),
        roomNumber: selectedRoom?.roomNumber || reservation.roomNumber,
        roomTypeName: selectedRoom?.roomType?.name || reservation.roomTypeName,
        roomRate: nightlyRate,
        nights,
        subtotal,
        taxes,
        totalPrice,
      };

      onSave(updated, result);
    } catch (err) {
      setError(extractReservationError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-[2rem] border border-black/5 bg-white shadow-2xl">
        <div className="border-b border-zinc-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Reservation Update</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
                {t('modifyReservationTitle') || 'Modify Reservation'}
              </h2>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                {reservation.confirmationNumber}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50 hover:text-black"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <ErrorBanner message={error} onClose={() => setError(null)} />

          <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Current Booking</p>
            <p className="mt-2 text-sm font-bold text-zinc-950">
              Room {reservation.roomNumber} | {reservation.guestName}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              {formatDate(reservation.checkInDate)} to {formatDate(reservation.checkOutDate)} | {reservation.nights} night{reservation.nights === 1 ? '' : 's'}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
              Stay Dates
            </p>
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
            />
          </div>

          {nights > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                Room Selection
              </p>

              {loadingRooms ? (
                <div className="h-12 animate-pulse rounded-full bg-zinc-100" />
              ) : availableRooms.length > 0 ? (
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-bold text-zinc-950 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} ({room.roomType?.name}) - {money(room.roomType?.basePrice)}/night
                      {room.id === reservation.roomId ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                  {t('noRoomsAvailableForDates') || t('noRoomsAvailable') || 'No rooms available for these dates.'}
                </p>
              )}
            </div>
          )}

          {nights > 0 && (
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-900">Updated Price Preview</p>
              <div className="mt-3 space-y-2 text-sm font-medium text-amber-950">
                <div className="flex items-center justify-between">
                  <span>{nights} nights x {money(nightlyRate)}</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taxes (10%)</span>
                  <span>{money(taxes)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-amber-200 pt-2 font-bold">
                  <span>New Total</span>
                  <span>{money(totalPrice)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="modify-reason" className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
              Reason for modification
            </label>
            <input
              id="modify-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Guest request, stay extension, room preference..."
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || unchanged || nights <= 0 || !selectedRoomId}
              className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              {saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModifyReservation() {
  const location = useLocation();
  const { t } = useTranslation();

  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const initialQuery = useMemo(
    () => String(location.state?.initialQuery ?? '').trim(),
    [location.state?.initialQuery]
  );

  const handleSelect = (reservation) => {
    setSelected(reservation);
    setShowModal(false);
  };

  const handleSave = (updated) => {
    setSelected(updated);
    setShowModal(false);
    setToast({
      message: t('modifySuccess', { conf: updated.confirmationNumber }) || `Reservation ${updated.confirmationNumber} updated successfully.`,
      type: 'success',
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {showModal && selected && (
        <ModifyModal
          reservation={selected}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      <DashboardHero
        eyebrow="Reservation Changes"
        title={t('modifyReservationTitle') || 'Modify Reservation'}
        description={t('modifyReservationDesc') || 'Search for a reservation and update stay dates or room assignment.'}
        meta={[
          'Live room validation',
          'Pricing recalculation',
          selected ? `Selected ${selected.confirmationNumber}` : 'Awaiting selection',
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Change Scope
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Dates</p>
              <p className="mt-2 text-lg font-black">Editable</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Room</p>
              <p className="mt-2 text-lg font-black">Re-assignable</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ReservationLookupPanel initialQuery={initialQuery} onSelect={handleSelect} />

        {!selected ? (
          <DashboardPanel
            title="Select a Reservation"
            description="Load a reservation before checking new dates and room availability."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                'Room changes and date changes use the live room search endpoint.',
                'Pricing is recalculated before the reservation is updated.',
                'Use the confirmation number whenever possible for the most reliable lookup.',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium leading-6 text-zinc-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </DashboardPanel>
        ) : (
          <div className="space-y-6">
            <DashboardPanel
              title="Reservation Snapshot"
              description="Review the current booking before opening the modification editor."
              action={<StatusPill status={selected.status} />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Guest</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">{selected.guestName}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">{selected.guestEmail || 'No guest email provided'}</p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Room</p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">Room {selected.roomNumber} | {selected.roomTypeName}</p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Stay Dates</p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {formatDate(selected.checkInDate)} to {formatDate(selected.checkOutDate)}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Current Total</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">{money(selected.totalPrice)}</p>
                </div>
              </div>

              {!reservationStatusRules.canModify(selected.status) && (
                <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  This reservation cannot be modified because its current status is{' '}
                  <strong>{normalizeReservationStatusLabel(selected.status)}</strong>.
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Modification Controls"
              description="Open the editor to change dates, room assignment, and save the recalculated booking."
            >
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    icon: CalendarRange,
                    title: 'Dates',
                    description: 'Change the arrival or departure dates, then search valid alternatives.',
                  },
                  {
                    icon: RefreshCw,
                    title: 'Room Swap',
                    description: 'Move the guest to a different available room when needed.',
                  },
                  {
                    icon: FileText,
                    title: 'Pricing',
                    description: 'Preview the updated subtotal, taxes, and total before saving.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="mt-3 text-sm font-bold text-zinc-950">{item.title}</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                disabled={!reservationStatusRules.canModify(selected.status)}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
              >
                {t('modifyDatesButton') || 'Modify Reservation'}
              </button>
            </DashboardPanel>
          </div>
        )}
      </div>
    </div>
  );
}
