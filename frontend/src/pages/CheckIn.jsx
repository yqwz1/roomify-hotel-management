import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ClipboardCheck, KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { checkInReservation, extractReservationError } from '../services/reservationService';
import { reservationStatusRules, normalizeReservationStatusLabel } from '../domain/reservations/statusRules';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getReservationStatusLabel,
  translateKnownValue,
} from '../utils/localization';

const CHECKLIST_ITEMS = [
  { id: 'keys', icon: KeyRound },
  { id: 'clean', icon: Sparkles },
  { id: 'id', icon: ShieldCheck },
  { id: 'payment', icon: ClipboardCheck },
  { id: 'welcome', icon: Sparkles },
];

const resolveChecklistLabel = (t, id) => {
  switch (id) {
    case 'keys':
      return t('roomKeysPrepared');
    case 'clean':
      return t('roomCleaned');
    case 'id':
      return t('guestIdVerified');
    case 'payment':
      return t('paymentConfirmed');
    default:
      return t('welcomeAmenitiesPlaced');
  }
};

export default function CheckIn() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

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
        message: t('checkInSuccess', { name: guestName, room: roomNumber }),
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
    t('checkInPage.reservationFirst'),
    t('checkInPage.checklistRequired'),
    selected
      ? `${t('checkInPage.reservation')}: ${selected.confirmationNumber}`
      : t('checkInPage.awaitingSelection'),
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <ConfirmationToast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <DashboardHero
        eyebrow={t('checkInPage.heroEyebrow')}
        title={t('checkInTitle')}
        description={t('checkInDesc')}
        meta={heroMeta}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            {t('checkInPage.gateTitle')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('checkInPage.checklist')}
              </p>
              <p className="mt-2 text-3xl font-black">
                {completedCount}/{CHECKLIST_ITEMS.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {t('checkInPage.reservation')}
              </p>
              <p className="mt-2 text-lg font-black">
                {selected ? <LtrText>{selected.confirmationNumber}</LtrText> : t('notSelected')}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ReservationLookupPanel initialQuery={initialQuery} onSelect={handleSelect} />

        {!selected ? (
          <DashboardPanel
            title={t('checkInPage.selectTitle')}
            description={t('checkInPage.selectDescription')}
          >
            <div className="grid gap-3 md:grid-cols-3">
              {t('checkInPage.tips', { returnObjects: true }).map((item) => (
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
              title={t('checkInPage.summaryTitle')}
              description={t('checkInPage.summaryDescription')}
              action={<StatusPill status={selected.status} />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">{t('common.guest')}</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">{selected.guest?.name || selected.guestName}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {selected.guest?.email || selected.guestEmail || t('common.noGuestEmailProvided')}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">{t('checkInPage.confirmation')}</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">
                    <LtrText>{selected.confirmationNumber}</LtrText>
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">{t('common.room')}</p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {t('roomNum', { number: selected.room?.roomNumber || selected.roomNumber })} |{' '}
                    {translateKnownValue(selected.room?.roomTypeName || selected.roomTypeName, t)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {t('floorNum', { floor: selected.room?.floor || selected.floor || '-' })}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">{t('common.stay')}</p>
                  <p className="mt-2 text-sm font-bold text-zinc-950">
                    {formatLocalizedDate(selected.dates?.checkIn || selected.checkInDate, i18n.language, {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {formatLocalizedDate(selected.dates?.checkOut || selected.checkOutDate, i18n.language, {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">{t('nights')}</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">
                    {selected.dates?.nights || selected.nights || 0}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">{t('checkInPage.reservationTotal')}</p>
                  <p className="mt-2 text-lg font-black text-zinc-950">
                    {formatLocalizedCurrency(selected.pricing?.totalPrice || selected.totalPrice || 0, i18n.language)}
                  </p>
                </div>
              </div>

              {!reservationStatusRules.canCheckIn(selected.status) && (
                <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  {t('checkInPage.statusBlocked', {
                    status: getReservationStatusLabel(selected.status, t) || normalizeReservationStatusLabel(selected.status),
                  })}
                </div>
              )}
            </DashboardPanel>

            {reservationStatusRules.canCheckIn(selected.status) && (
              <DashboardPanel
                title={t('preCheckInChecklist')}
                description={t('completeAllItems')}
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
                            {checked ? t('checkInPage.checklistDone') : t('checkInPage.checklistPending')}
                          </p>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                    <span>{t('progress')}</span>
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
                  ? t('processing')
                  : !allChecked
                    ? `${t('completeChecklistToCheckIn')} (${completedCount}/${CHECKLIST_ITEMS.length})`
                    : t('confirmCheckIn')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
