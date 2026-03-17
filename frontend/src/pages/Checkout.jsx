import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DoorClosed,
  Receipt,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ConfirmationToast from '../components/ConfirmationToast';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import {
  checkOutReservation,
  extractReservationError,
  getBill,
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

function BillBreakdown({ bill }) {
  if (!bill) {
    return (
      <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center">
        <p className="text-sm font-bold text-zinc-950">No bill loaded</p>
        <p className="mt-2 text-sm font-medium text-zinc-500">
          Select a reservation to review the final billing summary.
        </p>
      </div>
    );
  }

  const rows = [
    {
      label: `Room charge (${bill.nights ?? 0} nights x ${money(bill.roomRate)})`,
      value: money(bill.roomCharge),
    },
    {
      label: 'Service charges',
      value: money(bill.serviceCharges),
      hidden: !Number(bill.serviceCharges),
    },
    {
      label: `VAT (${(Number(bill.vatRate ?? 0) * 100).toFixed(0)}%)`,
      value: money(bill.vatAmount),
    },
    {
      label: 'Discounts',
      value: `-${money(bill.discountAmount)}`,
      hidden: !Number(bill.discountAmount),
      muted: true,
    },
  ].filter((row) => !row.hidden);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <span className={`text-sm font-medium ${row.muted ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {row.label}
          </span>
          <span className="text-sm font-bold text-zinc-950">{row.value}</span>
        </div>
      ))}

      <div className="border-t border-zinc-200 pt-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-bold text-zinc-950">Gross balance</span>
          <span className="text-base font-black text-zinc-950">
            {money(bill.balanceDue)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-emerald-700">Total paid</span>
          <span className="text-sm font-bold text-emerald-700">
            -{money(bill.totalPaid)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4 border-t border-zinc-200 pt-3">
          <span className="text-sm font-bold text-zinc-950">Outstanding balance</span>
          <span
            className={`text-lg font-black ${
              Number(bill.outstandingBalance ?? bill.balanceDue ?? 0) > 0
                ? 'text-rose-900'
                : 'text-emerald-700'
            }`}
          >
            {money(bill.outstandingBalance ?? bill.balanceDue)}
          </span>
        </div>
      </div>

      {Array.isArray(bill.lineItems) && bill.lineItems.length > 0 && (
        <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
            Line Items
          </p>
          <div className="mt-3 space-y-2">
            {bill.lineItems.map((item, index) => {
              const amount = Number(item?.amount ?? 0);
              const credit = Boolean(item?.credit);

              return (
                <div
                  key={`${item?.label ?? 'line'}-${index}`}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="font-medium text-zinc-600">{item?.label || 'Line item'}</span>
                  <span className="font-bold text-zinc-950">
                    {credit ? `-${money(amount)}` : money(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Checkout() {
  const location = useLocation();
  const [selected, setSelected] = useState(null);
  const [bill, setBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [toast, setToast] = useState(null);

  const initialQuery = useMemo(
    () => String(location.state?.initialQuery ?? '').trim(),
    [location.state?.initialQuery]
  );

  const fetchBill = useCallback(async (confirmationNumber) => {
    if (!confirmationNumber) return;

    setBillLoading(true);
    setCheckoutError(null);
    try {
      const result = await getBill(confirmationNumber);
      setBill(result);
    } catch (err) {
      setBill(null);
      const message = extractReservationError(err);
      setCheckoutError(message);
      setToast({ message, type: 'error' });
    } finally {
      setBillLoading(false);
    }
  }, []);

  const handleSelect = async (reservation) => {
    setSelected(reservation);
    setBill(null);
    setCheckoutSuccess(false);
    await fetchBill(reservation.confirmationNumber);
  };

  const handleReset = () => {
    setSelected(null);
    setBill(null);
    setCheckoutError(null);
    setCheckoutSuccess(false);
  };

  const handleCheckout = async () => {
    if (!selected?.confirmationNumber || checkoutLoading) return;

    const outstandingBalance = Number(
      bill?.outstandingBalance ?? bill?.balanceDue ?? 0
    );

    if (outstandingBalance > 0) {
      setCheckoutError(
        `Outstanding balance remains on this reservation (${money(
          outstandingBalance
        )}).`
      );
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      await checkOutReservation(selected.confirmationNumber);
      setCheckoutSuccess(true);
      setToast({
        message: `Checkout completed for ${selected.guestName}.`,
        type: 'success',
      });
      setSelected((prev) => (prev ? { ...prev, status: 'CHECKED_OUT' } : prev));
    } catch (err) {
      const message = extractReservationError(err);
      setCheckoutError(message);
      setToast({ message, type: 'error' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const outstandingBalance = Number(
    bill?.outstandingBalance ?? bill?.balanceDue ?? 0
  );
  const canCheckOut =
    selected &&
    reservationStatusRules.canCheckOut(selected.status) &&
    !billLoading &&
    outstandingBalance === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <DashboardHero
        eyebrow="Departure Workflow"
        title="Checkout"
        description="Load a checked-in reservation, validate the final bill, and complete the guest departure."
        meta={[
          'Billing required',
          selected ? `Selected ${selected.confirmationNumber}` : 'Awaiting selection',
          checkoutSuccess ? 'Departure completed' : 'Open workflow',
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Departure Gate
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Outstanding
              </p>
              <p className="mt-2 text-lg font-black">
                {bill ? money(outstandingBalance) : 'No bill'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Status
              </p>
              <p className="mt-2 text-lg font-black">
                {selected ? selected.status : 'Pending'}
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
            description="Choose the active booking before loading the guest bill and checkout controls."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                'Checkout is only available for reservations that are already checked in.',
                'The backend blocks checkout when any balance remains outstanding.',
                'Load the reservation from the lookup panel first, then review the final bill.',
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
              title="Departure Summary"
              description="Validate the reservation state and confirm the guest is ready to depart."
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
                    Room {selected.roomNumber} | {selected.roomTypeName}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                    Outstanding Balance
                  </p>
                  <p
                    className={`mt-2 text-lg font-black ${
                      outstandingBalance > 0 ? 'text-rose-900' : 'text-emerald-700'
                    }`}
                  >
                    {bill ? money(outstandingBalance) : 'Loading...'}
                  </p>
                </div>
              </div>

              {!reservationStatusRules.canCheckOut(selected.status) && (
                <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  This reservation cannot be checked out because its current status is{' '}
                  <strong>{normalizeReservationStatusLabel(selected.status)}</strong>.
                </div>
              )}

              {reservationStatusRules.canCheckOut(selected.status) &&
                outstandingBalance > 0 && (
                  <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                    Outstanding balance must be settled before checkout can be completed.
                  </div>
                )}

              {checkoutSuccess && (
                <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  The guest has been checked out successfully. You can load another reservation or review the invoice.
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Final Bill"
              description="Review the reservation billing details before closing the stay."
              action={
                billLoading ? (
                  <span className="text-sm font-medium text-zinc-500">Loading bill...</span>
                ) : null
              }
            >
              <BillBreakdown bill={bill} />

              {checkoutError && (
                <div className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                  {checkoutError}
                </div>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Departure Controls"
              description="Use the final action only when the balance is settled and the reservation is eligible."
            >
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    icon: Receipt,
                    title: 'Bill Review',
                    description: 'Billing is fetched from the reservation bill endpoint before departure is allowed.',
                  },
                  {
                    icon: AlertTriangle,
                    title: 'Balance Guard',
                    description: 'Any remaining outstanding amount blocks the checkout action.',
                  },
                  {
                    icon: DoorClosed,
                    title: 'Departure',
                    description: 'Only checked-in reservations can move to checked out.',
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

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={checkoutLoading}
                  className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 px-6 py-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  Reset Workflow
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!canCheckOut || checkoutLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                >
                  {checkoutLoading ? (
                    'Processing Checkout...'
                  ) : checkoutSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Checkout Complete
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Complete Checkout
                    </>
                  )}
                </button>
              </div>
            </DashboardPanel>
          </div>
        )}
      </div>
    </div>
  );
}
