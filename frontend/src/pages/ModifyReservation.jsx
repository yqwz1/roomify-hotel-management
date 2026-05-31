import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarRange, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import DateRangePicker from '../components/DateRangePicker';
import ErrorBanner from '../components/ErrorBanner';
import ModalFrame from '../components/common/ModalFrame';
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
import { VAT_RATE } from '../utils/billing';

import { NativeSelect } from "@/components/ui/native-select";
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
    <ModalFrame
      title={t('modifyReservationTitle')}
      description={t('modifyReservationPage.reservationUpdate')}
      onClose={onClose}
      closeLabel={t('closeDialog')}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-5">
          <ErrorBanner message={error} onClose={() => setError(null)} />

          <div className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
              {t('modifyReservationPage.currentBookingTitle')}
            </p>
            <p className="mt-2 text-sm font-bold text-brand-ink break-words">
              {t('roomNumber', { number: reservation.roomNumber })} | {reservation.guestName}
            </p>
            <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
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
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
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
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                {t('modifyReservationPage.roomSelection')}
              </p>

              {loadingRooms ? (
                <div className="h-12 animate-pulse rounded-full bg-brand-primary-tint" />
              ) : availableRooms.length > 0 ? (
                <NativeSelect
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-bold text-brand-ink focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
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
                </NativeSelect>
              ) : (
                <p className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger break-words">
                  {t('noRoomsAvailableForDates') || t('noRoomsAvailable')}
                </p>
              )}
            </div>
          )}

          {nights > 0 && (
            <div className="rounded-[1.5rem] border border-brand-warning/30 bg-brand-warning/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-warning break-words">
                {t('modifyReservationPage.pricePreviewTitle')}
              </p>
              <div className="mt-3 space-y-2 text-sm font-medium text-brand-ink">
                <div className="flex min-w-0 items-center justify-between">
                  <span>
                    {t('nightsCount', { count: nights })} x{' '}
                    {formatLocalizedCurrency(nightlyRate, i18n.language)}
                  </span>
                  <span>{formatLocalizedCurrency(subtotal, i18n.language)}</span>
                </div>
                <div className="flex min-w-0 items-center justify-between">
                  <span>{t('taxes15')}</span>
                  <span>{formatLocalizedCurrency(taxes, i18n.language)}</span>
                </div>
                <div className="flex min-w-0 items-center justify-between border-t border-brand-warning/30 pt-2 font-bold">
                  <span>{t('newTotal')}</span>
                  <span>{formatLocalizedCurrency(totalPrice, i18n.language)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="modify-reason" className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint">
              {t('modifyReservationPage.reasonLabel')}
            </Label>
            <Input
              id="modify-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('modifyReasonPlaceholder')}
              className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button variant="unstyled" size="none"
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
            >
              {t('cancel')}
            </Button>
            <Button variant="unstyled" size="none"
              type="button"
              onClick={handleSave}
              disabled={saving || unchanged || nights <= 0 || !selectedRoomId}
              className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted"
            >
              {saving ? t('saving') : t('saveChanges')}
            </Button>
          </div>
      </div>
    </ModalFrame>
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
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
            {t('modifyReservationPage.changeScope')}
          </p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('modifyReservationPage.dates')}
              </p>
              <p className="mt-2 text-lg font-black break-words">{t('modifyReservationPage.editable')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('modifyReservationPage.room')}
              </p>
              <p className="mt-2 text-lg font-black break-words">{t('modifyReservationPage.reassignable')}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[0.92fr_1.08fr]">
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
            <div className="grid min-w-0 gap-3 md:grid-cols-3">
              {t('modifyReservationPage.tips', { returnObjects: true }).map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4 text-sm font-medium leading-6 text-brand-ink-muted"
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
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                    {t('common.guest')}
                  </p>
                  <p className="mt-2 text-lg font-black text-brand-ink break-words">{selected.guestName}</p>
                  <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                    {selected.guestEmail || t('common.noGuestEmailProvided')}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                    {t('common.room')}
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                    {t('roomNumber', { number: selected.roomNumber })} | {translateKnownValue(selected.roomTypeName, t)}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                    {t('modifyReservationPage.stayDates')}
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-ink break-words">
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
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                    {t('modifyReservationPage.currentTotal')}
                  </p>
                  <p className="mt-2 text-lg font-black text-brand-ink break-words">
                    {formatLocalizedCurrency(selected.totalPrice, i18n.language)}
                  </p>
                </div>
              </div>

              {!reservationStatusRules.canModify(selected.status) && (
                <div className="mt-4 rounded-[1.25rem] border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm font-medium text-brand-warning">
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
              <div className="grid min-w-0 gap-3 md:grid-cols-3">
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
                      className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4"
                    >
                      <span className="flex min-w-0 h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-ink shadow-sm break-words">
                        <Icon className="h-4 w-4 shrink-0" />
                      </span>
                      <p className="mt-3 text-sm font-bold text-brand-ink break-words">{item.title}</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-brand-ink-muted break-words">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                onClick={() => setShowModal(true)}
                disabled={!reservationStatusRules.canModify(selected.status)}
                className="mt-5 inline-flex min-w-0 w-full items-center justify-center rounded-full bg-brand-primary px-6 py-4 text-sm font-bold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted h-auto"
              >
                {t('modifyReservationPage.saveChangesCta')}
              </Button>
            </DashboardPanel>
          </div>
        )}
      </div>
    </div>
  );
}
