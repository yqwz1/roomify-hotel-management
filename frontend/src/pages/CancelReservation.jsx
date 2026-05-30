import { useState } from 'react';
import { AlertTriangle, Ban, ShieldAlert } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConfirmationToast from '../components/ConfirmationToast';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ModalFrame from '../components/common/ModalFrame';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { Textarea } from '../components/ui/textarea';
import {
  cancelReservation,
  extractReservationError,
} from '../services/reservationService';
import { reservationStatusRules } from '../domain/reservations/statusRules';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getReservationStatusLabel,
  translateKnownValue,
} from '../utils/localization';
import { readReservationLookupNavigationState } from '../utils/reservationLookup';

import { Button } from "@/components/ui/button";
function CancelDialog({ reservation, onClose, onConfirm }) {
  const { t, i18n } = useTranslation();
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);

    try {
      const result = await cancelReservation(
        reservation.id ?? reservation.confirmationNumber,
        reason
      );
      onConfirm(result);
    } catch (err) {
      setError(extractReservationError(err));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <ModalFrame
      title={t('cancelReservationTitle')}
      description={t('cancelReservationPage.destructiveAction')}
      onClose={onClose}
      closeLabel={t('closeDialog')}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-brand-danger/30 bg-brand-danger/10 p-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex min-w-0 h-10 w-10 items-center justify-center rounded-2xl bg-brand-danger/20 text-brand-ink break-words">
                <AlertTriangle className="h-5 w-5 shrink-0" />
              </span>
              <div>
                <p className="text-sm font-bold text-brand-ink break-words">
                  {t('cancelWarning')}
                </p>
                <p className="mt-1 text-sm font-medium text-brand-danger/80 break-words">
                  {t('cancelReservationPage.guestImpact')}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
              {t('cancelReservationPage.reservationSnapshot')}
            </p>
            <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-brand-ink break-words">{reservation.guestName}</p>
                <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                  {reservation.guestEmail || t('common.noGuestEmailProvided')}
                </p>
              </div>
              <div className="text-sm font-medium text-brand-ink-muted sm:text-end">
                {t('roomNumber', { number: reservation.roomNumber })} | {translateKnownValue(reservation.roomTypeName, t)}
              </div>
              <div className="text-sm font-medium text-brand-ink-muted">
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
                })}
              </div>
              <div className="text-sm font-bold text-brand-ink sm:text-end">
                {formatLocalizedCurrency(reservation.totalPrice, i18n.language)}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
              {error}
            </div>
          )}

          <div className="space-y-2 flex min-w-0 flex-col">
            <label
              htmlFor="cancel-reason"
              className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint"
            >
              {t('reasonForCancellation')}
            </label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t('cancelReasonPlaceholder')}
              rows={4}
              className="w-full resize-none rounded-[1.5rem] border border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm font-medium text-brand-ink focus-visible:border-brand-primary focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/5"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button variant="unstyled" size="none"
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
            >
              {t('keepReservation')}
            </Button>
            <Button variant="unstyled" size="none"
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="rounded-full bg-brand-danger px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-danger disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted"
            >
              {confirming ? t('cancelling') : t('cancelReservationPage.confirmCancellation')}
            </Button>
          </div>
      </div>
    </ModalFrame>
  );
}

export default function CancelReservation() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { initialFilters, initialQuery } = readReservationLookupNavigationState(location.state);
  const [selected, setSelected] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [toast, setToast] = useState(null);

  const canCancel = selected ? reservationStatusRules.canCancel(selected.status) : false;

  const handleSelect = (reservation) => {
    setSelected(reservation);
    setShowDialog(false);
  };

  const handleConfirm = (result) => {
    const nextStatus = result?.currentStatus || 'CANCELLED';
    const confirmationNumber = selected?.confirmationNumber;

    setSelected((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    setShowDialog(false);
    setToast({
      message: t('cancelSuccess', { conf: confirmationNumber }),
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

      {showDialog && selected && (
        <CancelDialog
          reservation={selected}
          onClose={() => setShowDialog(false)}
          onConfirm={handleConfirm}
        />
      )}

      <DashboardHero
        eyebrow={t('cancelReservationPage.heroEyebrow')}
        title={t('cancelReservationTitle')}
        description={t('cancelReservationDesc')}
        meta={[
          t('cancelReservationPage.destructiveAction'),
          t('cancelReservationPage.confirmationFirst'),
          selected ? selected.confirmationNumber : t('common.pending'),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
            {t('cancelReservationPage.gateTitle')}
          </p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('cancelReservationPage.selected')}
              </p>
              <p className="mt-2 text-lg font-black break-words">
                {selected ? <LtrText>{selected.confirmationNumber}</LtrText> : t('notSelected')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('cancelReservationPage.eligibility')}
              </p>
              <p className="mt-2 text-lg font-black break-words">
                {!selected ? t('common.pending') : canCancel ? t('common.allowed') : t('common.blocked')}
              </p>
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
            title={t('cancelReservationPage.selectTitle')}
            description={t('cancelReservationPage.selectDescription')}
          >
            <div className="grid min-w-0 gap-3 md:grid-cols-3">
              {t('cancelReservationPage.tips', { returnObjects: true }).map((item) => (
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
              title={t('cancelReservationPage.snapshotTitle')}
              description={t('cancelReservationPage.snapshotDescription')}
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
                    {t('confirmationNumber')}
                  </p>
                  <p className="mt-2 text-lg font-black text-brand-ink break-words">
                    <LtrText>{selected.confirmationNumber}</LtrText>
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                    {t('common.stay')}
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
                  <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                    {t('nightsCount', { count: selected.nights })}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">
                    {t('cancelReservationPage.roomAndTotal')}
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                    {t('roomNumber', { number: selected.roomNumber })} | {translateKnownValue(selected.roomTypeName, t)}
                  </p>
                  <p className="mt-1 text-lg font-black text-brand-ink break-words">
                    {formatLocalizedCurrency(selected.totalPrice, i18n.language)}
                  </p>
                </div>
              </div>

              {!canCancel && (
                <div className="mt-4 rounded-[1.25rem] border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm font-medium text-brand-warning">
                  {t('cancelReservationPage.statusBlocked', {
                    status: getReservationStatusLabel(selected.status, t),
                  })}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel
              title={t('cancelReservationPage.controlsTitle')}
              description={t('cancelReservationPage.controlsDescription')}
            >
              <div className="grid min-w-0 gap-3 md:grid-cols-3">
                {[
                  {
                    icon: AlertTriangle,
                    title: t('cancelReservationPage.irreversibleTitle'),
                    description: t('cancelReservationPage.irreversibleDescription'),
                  },
                  {
                    icon: ShieldAlert,
                    title: t('cancelReservationPage.auditTitle'),
                    description: t('cancelReservationPage.auditDescription'),
                  },
                  {
                    icon: Ban,
                    title: t('cancelReservationPage.statusGuardTitle'),
                    description: t('cancelReservationPage.statusGuardDescription'),
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
                      <p className="mt-1 text-sm font-medium leading-6 text-brand-ink-muted break-words">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <Button variant="unstyled" size="none"
                type="button"
                onClick={() => setShowDialog(true)}
                disabled={!canCancel}
                className="mt-5 inline-flex min-w-0 w-full items-center justify-center rounded-full bg-brand-danger px-6 py-4 text-sm font-bold text-white transition hover:bg-brand-danger disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted"
              >
                {t('cancelReservationPage.confirmCancellation')}
              </Button>
            </DashboardPanel>
          </div>
        )}
      </div>
    </div>
  );
}
