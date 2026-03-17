import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  CalendarDays,
  CreditCard,
  FileText,
  Hotel,
  Receipt,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import StatusPill from '../components/StatusPill';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import {
  extractReservationError,
  getReservationByConfirmationNumber,
} from '../services/reservationService';
import { reservationStatusRules } from '../domain/reservations/statusRules';

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

function ActionButton({
  icon: Icon,
  title,
  description,
  onClick,
  disabled = false,
  tone = 'default',
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-300 hover:bg-rose-100'
      : 'border-zinc-200 bg-zinc-50 text-zinc-950 hover:border-zinc-300 hover:bg-white';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[1.35rem] border p-4 text-left transition disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 ${toneClass}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-sm font-bold">{title}</p>
      <p className="mt-1 text-sm font-medium leading-6 opacity-80">{description}</p>
    </button>
  );
}

export default function ReservationDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmationNumber: routeConfirmation } = useParams();

  const confirmationNumber = useMemo(() => {
    const fromState = location.state?.confirmationNumber;
    return String(fromState ?? routeConfirmation ?? '').trim();
  }, [location.state?.confirmationNumber, routeConfirmation]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    const run = async () => {
      if (!confirmationNumber) {
        setError('Missing confirmation number.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await getReservationByConfirmationNumber(confirmationNumber);
        setReservation(result);
      } catch (err) {
        setError(extractReservationError(err));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [confirmationNumber]);

  if (loading) {
    return <LoadingState message="Loading reservation details..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load reservation"
        message={error}
        onRetry={() => navigate(0)}
      />
    );
  }

  if (!reservation) {
    return (
      <ErrorState
        title="Reservation not found"
        message="No reservation data is available."
      />
    );
  }

  const guestName = reservation.guestName || reservation.guest?.name || 'Guest';
  const guestEmail = reservation.guestEmail || reservation.guest?.email || 'No guest email provided';
  const roomNumber = reservation.roomNumber || reservation.room?.roomNumber || '-';
  const roomTypeName = reservation.roomTypeName || reservation.room?.roomTypeName || 'Unassigned';
  const floor = reservation.floor || reservation.room?.floor || '-';
  const nights = reservation.nights ?? reservation.dates?.nights ?? 0;
  const totalPrice = reservation.totalPrice ?? reservation.pricing?.totalPrice ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow="Reservation Record"
        title="Reservation Details"
        description="Review guest, stay, and financial context before moving into the next front-desk action."
        meta={[
          reservation.status,
          `Room ${roomNumber}`,
          `${nights} night${nights === 1 ? '' : 's'}`,
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Confirmation
          </p>
          <p className="mt-4 text-2xl font-black">
            <LtrText>{reservation.confirmationNumber}</LtrText>
          </p>
          <div className="mt-4 flex items-center gap-3">
            <StatusPill status={reservation.status} />
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <DashboardPanel
            title="Reservation Overview"
            description="Primary guest and stay information for the current booking."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                      Guest
                    </p>
                    <p className="mt-2 text-lg font-black text-zinc-950">{guestName}</p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">{guestEmail}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                    <Hotel className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                      Room
                    </p>
                    <p className="mt-2 text-lg font-black text-zinc-950">Room {roomNumber}</p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {roomTypeName} | Floor {floor}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                      Stay Window
                    </p>
                    <p className="mt-2 text-sm font-bold text-zinc-950">
                      {formatDate(reservation.checkInDate)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      to {formatDate(reservation.checkOutDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                    <Receipt className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                      Financials
                    </p>
                    <p className="mt-2 text-lg font-black text-zinc-950">{money(totalPrice)}</p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {nights} night{nights === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Action Center"
            description="Move directly into the next workflow that matches the reservation status."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <ActionButton
                icon={CreditCard}
                title="Check-In"
                description="Continue the arrival workflow and complete guest handoff."
                onClick={() =>
                  navigate('/check-in', {
                    state: { initialQuery: reservation.confirmationNumber },
                  })
                }
                disabled={!reservationStatusRules.canCheckIn(reservation.status)}
              />
              <ActionButton
                icon={ArrowRightLeft}
                title="Modify Reservation"
                description="Adjust the room assignment or stay dates."
                onClick={() =>
                  navigate('/reservations/modify', {
                    state: { initialQuery: reservation.confirmationNumber },
                  })
                }
                disabled={!reservationStatusRules.canModify(reservation.status)}
              />
              <ActionButton
                icon={XCircle}
                title="Cancel Reservation"
                description="Process a controlled cancellation with an optional reason."
                onClick={() =>
                  navigate('/reservations/cancel', {
                    state: { initialQuery: reservation.confirmationNumber },
                  })
                }
                disabled={!reservationStatusRules.canCancel(reservation.status)}
                tone="danger"
              />
              <ActionButton
                icon={Receipt}
                title="Checkout"
                description="Review the bill and complete the final departure workflow."
                onClick={() =>
                  navigate('/checkout', {
                    state: { initialQuery: reservation.confirmationNumber },
                  })
                }
                disabled={!reservationStatusRules.canCheckOut(reservation.status)}
              />
              <ActionButton
                icon={FileText}
                title="Invoice"
                description="Generate, preview, print, or download the reservation invoice."
                onClick={() =>
                  navigate('/invoice-preview', {
                    state: { confirmationNumber: reservation.confirmationNumber },
                  })
                }
              />
            </div>
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <DashboardPanel
            title="Reservation Facts"
            description="Core identifiers and billing values tied to this booking."
            action={<StatusPill status={reservation.status} />}
          >
            <dl className="space-y-4">
              {[
                {
                  label: 'Confirmation Number',
                  value: <LtrText>{reservation.confirmationNumber}</LtrText>,
                },
                { label: 'Guest Name', value: guestName },
                { label: 'Guest Email', value: guestEmail },
                { label: 'Room Number', value: `Room ${roomNumber}` },
                { label: 'Room Type', value: roomTypeName },
                { label: 'Nightly Rate', value: money(reservation.roomRate) },
                { label: 'Subtotal', value: money(reservation.subtotal) },
                { label: 'Taxes', value: money(reservation.taxes) },
                { label: 'Total Price', value: money(totalPrice) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3"
                >
                  <dt className="text-sm font-medium text-zinc-500">{item.label}</dt>
                  <dd className="text-sm font-bold text-zinc-950">{item.value}</dd>
                </div>
              ))}
            </dl>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
