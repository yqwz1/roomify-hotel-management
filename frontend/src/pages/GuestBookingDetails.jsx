import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarRange,
  FileText,
  Receipt,
  Save,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DateRangePicker from '../components/DateRangePicker';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import ModalFrame from '../components/common/ModalFrame';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import StatusPill from '../components/StatusPill';
import { reservationStatusRules } from '../domain/reservations/statusRules';
import {
  cancelGuestReservation,
  extractGuestReservationError,
  getGuestReservationByConfirmation,
  modifyGuestReservation,
} from '../services/guestReservationService';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getBooleanLabel,
  getPaymentStatusLabel,
  getReservationStatusLabel,
  translateKnownValue,
  translateWithFallback,
} from '../utils/localization';

function FactRow({ label, value }) {
  return (
    <div className="flex flex-col gap-2 rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm font-bold text-zinc-950 sm:text-right">{value}</dd>
    </div>
  );
}

function EditBookingDialog({ reservation, onClose, onSaved }) {
  const { t } = useTranslation();
  const [checkIn, setCheckIn] = useState(reservation.checkInDate);
  const [checkOut, setCheckOut] = useState(reservation.checkOutDate);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await modifyGuestReservation(reservation.confirmationNumber, {
        checkInDate: checkIn,
        checkOutDate: checkOut,
        modificationReason: reason.trim(),
      });
      onSaved();
    } catch (err) {
      setError(extractGuestReservationError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalFrame
      title={translateWithFallback(t, 'guestBookingDetailsPage.editTitle', 'Edit booking')}
      description={translateWithFallback(
        t,
        'guestBookingDetailsPage.editDescription',
        'Guests can adjust stay dates while the reservation is still in an editable status.'
      )}
      onClose={onClose}
      closeLabel={translateWithFallback(t, 'closeDialog', 'Close')}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-5">
        {error ? (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {error}
          </div>
        ) : null}

        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
        />

        <div className="space-y-2">
          <label
            htmlFor="guest-modification-reason"
            className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400"
          >
            {translateWithFallback(t, 'guestBookingDetailsPage.reasonLabel', 'Why are you changing this stay?')}
          </label>
          <input
            id="guest-modification-reason"
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={translateWithFallback(
              t,
              'guestBookingDetailsPage.reasonPlaceholder',
              'Example: updated travel plans'
            )}
            className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            {translateWithFallback(t, 'cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !reason.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            <Save className="h-4 w-4" />
            {saving
              ? translateWithFallback(t, 'saving', 'Saving...')
              : translateWithFallback(t, 'saveChanges', 'Save changes')}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

function CancelBookingDialog({ reservation, onClose, onCancelled }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    setSubmitting(true);
    setError('');

    try {
      await cancelGuestReservation(reservation.confirmationNumber, reason);
      onCancelled();
    } catch (err) {
      setError(extractGuestReservationError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title={translateWithFallback(t, 'guestBookingDetailsPage.cancelTitle', 'Cancel booking')}
      description={translateWithFallback(
        t,
        'guestBookingDetailsPage.cancelDescription',
        'Cancellation stays available only while the reservation has not started.'
      )}
      onClose={onClose}
      closeLabel={translateWithFallback(t, 'closeDialog', 'Close')}
      widthClassName="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm font-medium leading-6 text-rose-900">
          {translateWithFallback(
            t,
            'guestBookingDetailsPage.cancelWarning',
            'This action updates the reservation status immediately and the stay will no longer be active.'
          )}
        </div>

        {error ? (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="guest-cancel-reason"
            className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400"
          >
            {translateWithFallback(t, 'reasonForCancellation', 'Reason for cancellation')}
          </label>
          <textarea
            id="guest-cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            placeholder={translateWithFallback(
              t,
              'cancelReasonPlaceholder',
              'Optional note for the hotel'
            )}
            className="w-full resize-none rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            {translateWithFallback(t, 'keepReservation', 'Keep reservation')}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            <XCircle className="h-4 w-4" />
            {submitting
              ? translateWithFallback(t, 'cancelling', 'Cancelling...')
              : translateWithFallback(t, 'cancelReservation', 'Cancel reservation')}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

export default function GuestBookingDetails() {
  const navigate = useNavigate();
  const { confirmationNumber } = useParams();
  const { t, i18n } = useTranslation();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadReservation = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getGuestReservationByConfirmation(confirmationNumber);
        if (ignore) return;
        setReservation(data);
      } catch (err) {
        if (ignore) return;
        setReservation(null);
        setError(extractGuestReservationError(err));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadReservation();

    return () => {
      ignore = true;
    };
  }, [confirmationNumber, reloadToken]);

  const canModify = reservationStatusRules.canModify(reservation?.status);
  const canCancel = reservationStatusRules.canCancel(reservation?.status);

  const summaryMeta = useMemo(() => {
    if (!reservation) return [];

    return [
      getReservationStatusLabel(reservation.status, t),
      reservation.roomNumber
        ? t('roomNumber', { number: reservation.roomNumber })
        : translateWithFallback(t, 'common.room', 'Room'),
      reservation.checkInDate
        ? formatLocalizedDate(reservation.checkInDate, i18n.language, { dateStyle: 'medium' })
        : '-',
    ];
  }, [i18n.language, reservation, t]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <LoadingState
          message={translateWithFallback(
            t,
            'guestBookingDetailsPage.loading',
            'Loading booking details...'
          )}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <ErrorState
          title={translateWithFallback(
            t,
            'guestBookingDetailsPage.errorTitle',
            'Booking details unavailable'
          )}
          message={error}
          onRetry={() => setReloadToken((current) => current + 1)}
        />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <EmptyState
          icon={FileText}
          title={translateWithFallback(
            t,
            'guestBookingDetailsPage.emptyTitle',
            'Reservation not found'
          )}
          message={translateWithFallback(
            t,
            'guestBookingDetailsPage.emptyDescription',
            'The selected reservation could not be loaded from your guest account.'
          )}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      {showEditDialog ? (
        <EditBookingDialog
          reservation={reservation}
          onClose={() => setShowEditDialog(false)}
          onSaved={() => {
            setShowEditDialog(false);
            setReloadToken((current) => current + 1);
          }}
        />
      ) : null}

      {showCancelDialog ? (
        <CancelBookingDialog
          reservation={reservation}
          onClose={() => setShowCancelDialog(false)}
          onCancelled={() => {
            setShowCancelDialog(false);
            setReloadToken((current) => current + 1);
          }}
        />
      ) : null}

      <button
        type="button"
        onClick={() => navigate('/guest/bookings')}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
      >
        <ArrowLeft className="h-4 w-4" />
        {translateWithFallback(t, 'guestBookingDetailsPage.backCta', 'Back to bookings')}
      </button>

      <DashboardHero
        eyebrow={translateWithFallback(t, 'guestBookingDetailsPage.eyebrow', 'Guest portal')}
        title={translateWithFallback(t, 'guestBookingDetailsPage.title', 'Booking Details')}
        description={translateWithFallback(
          t,
          'guestBookingDetailsPage.description',
          'This page combines stay details, invoice summary, and allowed guest actions in one place.'
        )}
        meta={summaryMeta}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {translateWithFallback(t, 'confirmationNumber', 'Confirmation number')}
          </p>
          <p className="mt-3 text-2xl font-black">{reservation.confirmationNumber}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill status={reservation.status} />
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <DashboardPanel
            title={translateWithFallback(t, 'common.stay', 'Stay')}
            description={translateWithFallback(
              t,
              'guestBookingDetailsPage.stayDescription',
              'Room assignment, dates, and guest identity linked to this reservation.'
            )}
          >
            <dl className="space-y-4">
              <FactRow
                label={translateWithFallback(t, 'fullName', 'Full name')}
                value={reservation.guestName || '-'}
              />
              <FactRow
                label={translateWithFallback(t, 'emailAddress', 'Email address')}
                value={reservation.guestEmail || '-'}
              />
              <FactRow
                label={translateWithFallback(t, 'common.room', 'Room')}
                value={reservation.roomNumber ? t('roomNumber', { number: reservation.roomNumber }) : '-'}
              />
              <FactRow
                label={translateWithFallback(t, 'roomType', 'Room type')}
                value={translateKnownValue(reservation.roomTypeName || '-', t)}
              />
              <FactRow
                label={translateWithFallback(t, 'checkInDate', 'Check-in')}
                value={formatLocalizedDate(reservation.checkInDate, i18n.language, {
                  dateStyle: 'medium',
                })}
              />
              <FactRow
                label={translateWithFallback(t, 'checkOutDate', 'Check-out')}
                value={formatLocalizedDate(reservation.checkOutDate, i18n.language, {
                  dateStyle: 'medium',
                })}
              />
            </dl>
          </DashboardPanel>

          <DashboardPanel
            title={translateWithFallback(t, 'guestBookingDetailsPage.actionsTitle', 'Allowed guest actions')}
            description={translateWithFallback(
              t,
              'guestBookingDetailsPage.actionsDescription',
              'The guest portal only exposes actions that are valid for the current reservation status.'
            )}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <button
                type="button"
                onClick={() => setShowEditDialog(true)}
                disabled={!canModify}
                className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:border-zinc-300 hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <CalendarRange className="h-5 w-5" />
                <p className="mt-3 text-sm font-bold">
                  {translateWithFallback(t, 'modifyReservation', 'Modify booking')}
                </p>
                <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                  {translateWithFallback(
                    t,
                    'guestBookingDetailsPage.modifyHint',
                    'Update stay dates while this reservation is still pending or confirmed.'
                  )}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setShowCancelDialog(true)}
                disabled={!canCancel}
                className="rounded-[1.35rem] border border-rose-200 bg-rose-50 p-4 text-left text-rose-900 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
              >
                <XCircle className="h-5 w-5" />
                <p className="mt-3 text-sm font-bold">
                  {translateWithFallback(t, 'cancelReservation', 'Cancel booking')}
                </p>
                <p className="mt-1 text-sm font-medium leading-6 opacity-80">
                  {translateWithFallback(
                    t,
                    'guestBookingDetailsPage.cancelHint',
                    'Cancel the stay before check-in if your plans changed.'
                  )}
                </p>
              </button>

              <Link
                to="/guest/billing-status"
                className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:border-zinc-300 hover:bg-white"
              >
                <Receipt className="h-5 w-5 text-zinc-950" />
                <p className="mt-3 text-sm font-bold text-zinc-950">
                  {translateWithFallback(t, 'navBillingStatus', 'Billing status')}
                </p>
                <p className="mt-1 text-sm font-medium leading-6 text-zinc-500">
                  {translateWithFallback(
                    t,
                    'guestBookingDetailsPage.billingHint',
                    'Open the billing area for invoice state and balance summaries.'
                  )}
                </p>
              </Link>
            </div>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title={translateWithFallback(t, 'navBilling', 'Billing')}
            description={translateWithFallback(
              t,
              'guestBookingDetailsPage.billingDescription',
              'This is the practical invoice and payment summary the guest needs during the demo.'
            )}
          >
            <dl className="space-y-4">
              <FactRow
                label={translateWithFallback(t, 'common.stayTotal', 'Stay total')}
                value={formatLocalizedCurrency(reservation.totalPrice ?? 0, i18n.language)}
              />
              <FactRow
                label={translateWithFallback(t, 'checkoutPage.totalPaidLabel', 'Total paid')}
                value={formatLocalizedCurrency(reservation.totalPaid ?? 0, i18n.language)}
              />
              <FactRow
                label={translateWithFallback(t, 'checkoutPage.outstandingBalanceLabel', 'Outstanding balance')}
                value={formatLocalizedCurrency(reservation.outstandingBalance ?? 0, i18n.language)}
              />
              <FactRow
                label={translateWithFallback(t, 'checkoutPage.paymentStatusLabel', 'Payment status')}
                value={getPaymentStatusLabel(reservation.paymentStatus, t)}
              />
              <FactRow
                label={translateWithFallback(t, 'invoicePreview', 'Invoice')}
                value={reservation.invoiceNumber || translateWithFallback(t, 'common.pending', 'Pending')}
              />
              <FactRow
                label={translateWithFallback(t, 'common.finalized', 'Finalized')}
                value={getBooleanLabel(Boolean(reservation.invoiceFinalized), t)}
              />
            </dl>

            <div className="mt-4 flex justify-end border-t border-zinc-200 pt-4">
              <Link
                to={`/guest/invoices/${reservation.confirmationNumber}`}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
              >
                <Receipt className="h-4 w-4" />
                {translateWithFallback(t, 'guestBookingDetailsPage.invoiceCta', 'Open invoice')}
              </Link>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title={translateWithFallback(t, 'guestBookingDetailsPage.policyTitle', 'Guest-side rules')}
            description={translateWithFallback(
              t,
              'guestBookingDetailsPage.policyDescription',
              'These rules make the portal feel realistic without building a full policy engine.'
            )}
          >
            <div className="grid gap-3">
              {[
                translateWithFallback(
                  t,
                  'guestBookingDetailsPage.policyOne',
                  'Modify is available only before the stay moves into checked-in or completed states.'
                ),
                translateWithFallback(
                  t,
                  'guestBookingDetailsPage.policyTwo',
                  'Cancellation follows the same reservation status rules enforced for staff operations.'
                ),
                translateWithFallback(
                  t,
                  'guestBookingDetailsPage.policyThree',
                  'Payment collection and checkout remain staff workflows, while the guest can still review billing status.'
                ),
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
        </div>
      </div>
    </div>
  );
}
