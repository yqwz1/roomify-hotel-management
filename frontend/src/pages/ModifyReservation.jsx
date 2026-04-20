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
import { reservationStatusRules } from '../domain/reservations/statusRules';
import { readReservationLookupNavigationState } from '../utils/reservationLookup';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getReservationStatusLabel,
  translateKnownValue,
} from '../utils/localization';

const VAT_RATE = 0.15;

function ModifyModal({ reservation, onClose, onSave }) {
  const { t, i18n } = useTranslation();
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
  const taxes = subtotal * VAT_RATE;
  const totalPrice = subtotal + taxes;

  const unchanged =
    checkIn === reservation.checkInDate &&
    checkOut === reservation.checkOutDate &&
    Number(selectedRoomId) === reservation.roomId;

  const handleSave = async () => {
    if (nights <= 0) {
      setError(t('checkoutAfterCheckin'));
      return;
    }

    if (unchanged) {
      setError(t('noChangesDetected'));
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
              <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                {t('modifyReservationPage.reservationUpdate')}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
                {t('modifyReservationTitle')}
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
              {t('closeDialog')}
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <ErrorBanner message={error} onClose={() => setError(null)} />

          <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
              {t('modifyReservationPage.currentBookingTitle')}
            </p>
            <p className="mt-2 text-sm font-bold text-zinc-950">
              {t('roomNumber', { number: reservation.roomNumber })} | {reservation.guestName}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              {formatLocalizedDate(reservation.checkInDate, i18n.language, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}{' '}
              -{' '}
              {formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}{' '}
              | {t('nightsCount', { count: reservation.nights })}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
              {t('modifyReservationPage.stayDates')}
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
                {t('modifyReservationPage.roomSelection')}
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
                      {t('roomNumber', { number: room.roomNumber })} ({translateKnownValue(
                        room.roomType?.name,
                        t
                      )}) - {formatLocalizedCurrency(room.roomType?.basePrice, i18n.language)}/{t('perNight')}
                      {room.id === reservation.roomId
                        ? ` ${t('modifyReservationPage.currentRoomSuffix')}`
                        : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                  {t('noRoomsAvailableForDates') || t('noRoomsAvailable')}
                </p>
              )}
            </div>
          )}

          {nights > 0 && (
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-900">
                {t('modifyReservationPage.pricePreviewTitle')}
              </p>
              <div className="mt-3 space-y-2 text-sm font-medium text-amber-950">
                <div className="flex items-center justify-between">
                  <span>
                    {t('nightsCount', { count: nights })} x{' '}
                    {formatLocalizedCurrency(nightlyRate, i18n.language)}
                  </span>
                  <span>{formatLocalizedCurrency(subtotal, i18n.language)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('taxes15')}</span>
                  <span>{formatLocalizedCurrency(taxes, i18n.language)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-amber-200 pt-2 font-bold">
                  <span>{t('newTotal')}</span>
                  <span>{formatLocalizedCurrency(totalPrice, i18n.language)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="modify-reason" className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
              {t('modifyReservationPage.reasonLabel')}
            </label>
            <input
              id="modify-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('modifyReasonPlaceholder')}
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
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
              type="button"
              onClick={handleSave}
              disabled={saving || unchanged || nights <= 0 || !selectedRoomId}
              className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              {saving ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModifyReservation() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { initialFilters, initialQuery } = readReservationLookupNavigationState(location.state);

  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSelect = (reservation) => {
    setSelected(reservation);
    setShowModal(false);
  };

  const handleSave = (updated) => {
    setSelected(updated);
    setShowModal(false);
    setToast({
      message: t('modifySuccess', { conf: updated.confirmationNumber }),
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
        eyebrow={t('modifyReservationPage.heroEyebrow')}
        title={t('modifyReservationTitle')}
        description={t('modifyReservationDesc')}
        meta={[
          t('modifyReservationPage.liveRoomValidation'),
          t('modifyReservationPage.pricingRecalculation'),
          selected ? selected.confirmationNumber : t('modifyReservationPage.statusMeta'),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {t('modifyReservationPage.changeScope')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('modifyReservationPage.dates')}
              </p>
              <p className="mt-2 text-lg font-black">{t('modifyReservationPage.editable')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('modifyReservationPage.room')}
              </p>
              <p className="mt-2 text-lg font-black">{t('modifyReservationPage.reassignable')}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ReservationLookupPanel
          initialFilters={initialFilters}
          initialQuery={initialQuery}
          onSelect={handleSelect}
        />

        {!selected ? (
          <DashboardPanel
            title={t('modifyReservationPage.selectTitle')}
            description={t('modifyReservationPage.selectDescription')}
          >
            <div className="grid gap-3 md:grid-cols-3">
              {t('modifyReservationPage.tips', { returnObjects: true }).map((item) => (
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
              title={t('modifyReservationPage.snapshotTitle')}
              description={t('modifyReservationPage.snapshotDescription')}
              action={<StatusPill status={selected.status} />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    {t('common.guest')}
                  </p>
                  <p className="mt-2 text-lg font-black text-zinc-950">{selected.guestName}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {selected.guestEmail || t('common.noGuestEmailProvided')}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    {t('common.room')}
                  </p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {t('roomNumber', { number: selected.roomNumber })} | {translateKnownValue(selected.roomTypeName, t)}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    {t('modifyReservationPage.stayDates')}
                  </p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {formatLocalizedDate(selected.checkInDate, i18n.language, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {formatLocalizedDate(selected.checkOutDate, i18n.language, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    {t('modifyReservationPage.currentTotal')}
                  </p>
                  <p className="mt-2 text-lg font-black text-zinc-950">
                    {formatLocalizedCurrency(selected.totalPrice, i18n.language)}
                  </p>
                </div>
              </div>

              {!reservationStatusRules.canModify(selected.status) && (
                <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  {t('modifyReservationPage.statusBlocked', {
                    status: getReservationStatusLabel(selected.status, t),
                  })}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel
              title={t('modifyReservationPage.controlsTitle')}
              description={t('modifyReservationPage.controlsDescription')}
            >
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    icon: CalendarRange,
                    title: t('modifyReservationPage.datesTitle'),
                    description: t('modifyReservationPage.datesDescription'),
                  },
                  {
                    icon: RefreshCw,
                    title: t('modifyReservationPage.roomSwapTitle'),
                    description: t('modifyReservationPage.roomSwapDescription'),
                  },
                  {
                    icon: FileText,
                    title: t('modifyReservationPage.pricingTitle'),
                    description: t('modifyReservationPage.pricingDescription'),
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
                {t('modifyReservationPage.saveChangesCta')}
              </button>
            </DashboardPanel>
          </div>
        )}
      </div>
    </div>
  );
}
