import { useMemo, useState } from 'react';
import { AlertTriangle, Ban, ShieldAlert } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConfirmationToast from '../components/ConfirmationToast';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import {
  cancelReservation,
  extractReservationError,
} from '../services/reservationService';
import {
  normalizeReservationStatusLabel,
  reservationStatusRules,
} from '../domain/reservations/statusRules';

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

const tOr = (t, key, fallback, options) => {
  const value = t(key, options);
  return value === key ? fallback : value;
};

function CancelDialog({ reservation, onClose, onConfirm }) {
  const { t } = useTranslation();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-[2rem] border border-black/5 bg-white shadow-2xl">
        <div className="border-b border-zinc-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-500">
                Destructive Action
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
                {tOr(t, 'cancelReservationTitle', 'Cancel Reservation')}
              </h2>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                <LtrText>{reservation.confirmationNumber}</LtrText>
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
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-200 text-rose-950">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-rose-950">
                  {tOr(
                    t,
                    'cancelWarning',
                    'This action cannot be undone. The reservation will be permanently cancelled.'
                  )}
                </p>
                <p className="mt-1 text-sm font-medium text-rose-900/80">
                  The guest will lose the active booking and room allocation.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
              Reservation Snapshot
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-zinc-950">{reservation.guestName}</p>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  {reservation.guestEmail || 'No guest email provided'}
                </p>
              </div>
              <div className="text-sm font-medium text-zinc-600 sm:text-right">
                Room {reservation.roomNumber} | {reservation.roomTypeName}
              </div>
              <div className="text-sm font-medium text-zinc-600">
                {formatDate(reservation.checkInDate)} to {formatDate(reservation.checkOutDate)}
              </div>
              <div className="text-sm font-bold text-zinc-950 sm:text-right">
                {money(reservation.totalPrice)}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="cancel-reason"
              className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400"
            >
              {tOr(t, 'reasonForCancellation', 'Reason for cancellation')}
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={tOr(
                t,
                'cancelReasonPlaceholder',
                'Guest request, duplicate booking, or reservation error...'
              )}
              rows={4}
              className="w-full resize-none rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
            >
              {tOr(t, 'keepReservation', 'Keep Reservation')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="rounded-full bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              {confirming
                ? tOr(t, 'cancelling', 'Cancelling...')
                : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CancelReservation() {
  const location = useLocation();
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [toast, setToast] = useState(null);

  const initialQuery = useMemo(
    () => String(location.state?.initialQuery ?? '').trim(),
    [location.state?.initialQuery]
  );

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
      message: tOr(
        t,
        'cancelSuccess',
        `Reservation ${confirmationNumber} has been cancelled.`,
        { conf: confirmationNumber }
      ),
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
        eyebrow="Reservation Protection"
        title={tOr(t, 'cancelReservationTitle', 'Cancel Reservation')}
        description={tOr(
          t,
          'cancelReservationDesc',
          'Search for a reservation, review the impact, and process a controlled cancellation.'
        )}
        meta={[
          'Destructive action',
          'Confirmation-first lookup',
          selected ? `Selected ${selected.confirmationNumber}` : 'Awaiting selection',
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Cancellation Gate
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Selected
              </p>
              <p className="mt-2 text-lg font-black">
                {selected ? <LtrText>{selected.confirmationNumber}</LtrText> : 'Not Selected'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Eligibility
              </p>
              <p className="mt-2 text-lg font-black">
                {!selected ? 'Pending' : canCancel ? 'Allowed' : 'Blocked'}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ReservationLookupPanel initialQuery={initialQuery} onSelect={handleSelect} />

        {!selected ? (
          <DashboardPanel
            title="Select a Reservation"
            description="Load a reservation before reviewing cancellation risk and guest impact."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                'Use the confirmation number whenever possible to avoid matching the wrong guest.',
                'Cancellation is only available for pending or confirmed reservations.',
                'A cancellation reason is optional, but it improves audit clarity for staff.',
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
              description="Review the booking before performing an irreversible cancellation."
              action={<StatusPill status={selected.status} />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    Guest
                  </p>
                  <p className="mt-2 text-lg font-black text-zinc-950">{selected.guestName}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {selected.guestEmail || 'No guest email provided'}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    Confirmation
                  </p>
                  <p className="mt-2 text-lg font-black text-zinc-950">
                    <LtrText>{selected.confirmationNumber}</LtrText>
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    Stay
                  </p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {formatDate(selected.checkInDate)} to {formatDate(selected.checkOutDate)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {selected.nights} night{selected.nights === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    Room and Total
                  </p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    Room {selected.roomNumber} | {selected.roomTypeName}
                  </p>
                  <p className="mt-1 text-lg font-black text-zinc-950">
                    {money(selected.totalPrice)}
                  </p>
                </div>
              </div>

              {!canCancel && (
                <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  This reservation cannot be cancelled because its current status is{' '}
                  <strong>{normalizeReservationStatusLabel(selected.status)}</strong>.
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Cancellation Controls"
              description="Use the final confirmation dialog to record an optional reason and complete the cancellation."
            >
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    icon: AlertTriangle,
                    title: 'Irreversible',
                    description: 'The reservation status will move to cancelled and the booking cannot be restored from this screen.',
                  },
                  {
                    icon: ShieldAlert,
                    title: 'Audit Trail',
                    description: 'Capture a cancellation reason when the front desk needs to document the decision.',
                  },
                  {
                    icon: Ban,
                    title: 'Status Guard',
                    description: 'Only pending and confirmed reservations can be cancelled in the current backend rules.',
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
                      <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowDialog(true)}
                disabled={!canCancel}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-rose-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
              >
                Confirm Cancellation
              </button>
            </DashboardPanel>
          </div>
        )}
      </div>
    </div>
  );
}
