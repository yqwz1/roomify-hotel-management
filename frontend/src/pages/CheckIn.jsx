import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ClipboardCheck, KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { useTranslation } from 'react-i18next';
import { checkInReservation, extractReservationError } from '../services/reservationService';
import { reservationStatusRules, normalizeReservationStatusLabel } from '../domain/reservations/statusRules';

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const CHECKLIST_ITEMS = [
  { id: 'keys', label: 'Room keys prepared', icon: KeyRound },
  { id: 'clean', label: 'Room is clean and inspected', icon: Sparkles },
  { id: 'id', label: 'Guest ID verified', icon: ShieldCheck },
  { id: 'payment', label: 'Payment method confirmed', icon: ClipboardCheck },
  { id: 'welcome', label: 'Welcome amenities placed', icon: Sparkles },
];

const resolveChecklistLabel = (t, id) => {
  switch (id) {
    case 'keys':
      return t('roomKeysPrepared') || 'Room keys prepared';
    case 'clean':
      return t('roomCleaned') || 'Room is clean and inspected';
    case 'id':
      return t('guestIdVerified') || 'Guest ID verified';
    case 'payment':
      return t('paymentConfirmed') || 'Payment method confirmed';
    default:
      return t('welcomeAmenitiesPlaced') || 'Welcome amenities placed';
  }
};

export default function CheckIn() {
  const location = useLocation();
  const { t } = useTranslation();

  const [selected, setSelected] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const initialQuery = useMemo(
    () => String(location.state?.initialQuery ?? '').trim(),
    [location.state?.initialQuery]
  );

  const completedCount = CHECKLIST_ITEMS.filter((item) => checklist[item.id]).length;
  const allChecked = completedCount === CHECKLIST_ITEMS.length;
  const canCheckIn =
    selected &&
    reservationStatusRules.canCheckIn(selected.status) &&
    allChecked;

  const toggleCheck = (id) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (reservation) => {
    setSelected(reservation);
    setChecklist({});
  };

  const handleCheckIn = async () => {
    if (!canCheckIn || submitting) return;

    setSubmitting(true);
    setToast(null);

    try {
      await checkInReservation(selected.confirmationNumber);
      const guestName = selected.guest?.name || selected.guestName;
      const roomNumber = selected.room?.roomNumber || selected.roomNumber;

      setToast({
        message: `Check-in successful for ${guestName} - Room ${roomNumber}`,
        type: 'success',
      });
      setSelected((prev) => ({ ...prev, status: 'CHECKED_IN' }));
    } catch (error) {
      setToast({ message: extractReservationError(error), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const heroMeta = [
    'Reservation-first',
    'Checklist required',
    selected ? `Selected ${selected.confirmationNumber}` : 'Awaiting selection',
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <DashboardHero
        eyebrow="Arrival Workflow"
        title={t('checkInTitle') || 'Check-In'}
        description={t('checkInDesc') || 'Look up a reservation and complete the guest check-in process.'}
        meta={heroMeta}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Arrival Gate
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Checklist
              </p>
              <p className="mt-2 text-3xl font-black">
                {completedCount}/{CHECKLIST_ITEMS.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Reservation
              </p>
              <p className="mt-2 text-lg font-black">
                {selected ? <LtrText>{selected.confirmationNumber}</LtrText> : 'Not Selected'}
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
            description="Use the lookup panel to load a reservation before validating the arrival checklist."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                'Search by confirmation number when available for the most reliable lookup.',
                'Guest-name search returns only the first matching reservation.',
                'Check-in is allowed only after every pre-arrival item is marked complete.',
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
              title="Arrival Summary"
              description="Review the reservation details before the guest receives room access."
              action={<StatusPill status={selected.status} />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Guest</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">{selected.guest?.name || selected.guestName}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">{selected.guest?.email || selected.guestEmail || 'No guest email provided'}</p>
                </div>

                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Confirmation</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">
                    <LtrText>{selected.confirmationNumber}</LtrText>
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Room</p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    Room {selected.room?.roomNumber || selected.roomNumber} | {selected.room?.roomTypeName || selected.roomTypeName}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    Floor {selected.room?.floor || selected.floor || '-'}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Stay</p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {formatDate(selected.dates?.checkIn || selected.checkInDate)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    to {formatDate(selected.dates?.checkOut || selected.checkOutDate)}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Nights</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">
                    {selected.dates?.nights || selected.nights || 0}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Reservation Total</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">
                    ${Number(selected.pricing?.totalPrice || selected.totalPrice || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {!reservationStatusRules.canCheckIn(selected.status) && (
                <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  This reservation cannot be checked in because its current status is{' '}
                  <strong>{normalizeReservationStatusLabel(selected.status)}</strong>.
                </div>
              )}
            </DashboardPanel>

            {reservationStatusRules.canCheckIn(selected.status) && (
              <DashboardPanel
                title={t('preCheckInChecklist') || 'Pre-Check-In Checklist'}
                description={t('completeAllItems') || 'Complete all items before confirming check-in.'}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  {CHECKLIST_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const checked = Boolean(checklist[item.id]);

                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-start gap-4 rounded-[1.35rem] border p-4 transition ${
                          checked
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCheck(item.id)}
                          className="mt-0.5 h-5 w-5 rounded border-zinc-300 text-black focus:ring-black/10"
                        />
                        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${
                          checked ? 'bg-emerald-200 text-emerald-900' : 'bg-white text-zinc-500 shadow-sm'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <p className={`text-sm font-bold ${checked ? 'text-emerald-900' : 'text-zinc-950'}`}>
                            {resolveChecklistLabel(t, item.id)}
                          </p>
                          <p className={`mt-1 text-sm font-medium ${checked ? 'text-emerald-800/80' : 'text-zinc-500'}`}>
                            {checked ? 'Completed for this arrival.' : 'Required before final handoff.'}
                          </p>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                    <span>{t('progress') || 'Progress'}</span>
                    <span>{completedCount}/{CHECKLIST_ITEMS.length}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100">
                    <div
                      className="h-2 rounded-full bg-zinc-950 transition-all duration-300"
                      style={{ width: `${(completedCount / CHECKLIST_ITEMS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </DashboardPanel>
            )}

            {reservationStatusRules.canCheckIn(selected.status) && (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={!canCheckIn || submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
              >
                {submitting
                  ? (t('processing') || 'Processing...')
                  : !allChecked
                    ? `${t('completeChecklistToCheckIn') || 'Complete checklist to check in'} (${completedCount}/${CHECKLIST_ITEMS.length})`
                    : (t('confirmCheckIn') || 'Confirm Check-In')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
