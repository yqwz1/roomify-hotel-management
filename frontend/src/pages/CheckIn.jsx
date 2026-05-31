import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ClipboardCheck, KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReservationLookupPanel from '../components/ReservationLookupPanel';
import StatusPill from '../components/StatusPill';
import ConfirmationToast from '../components/ConfirmationToast';
import { LtrText } from '../components/LtrText';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { checkInReservation, extractReservationError } from '../services/reservationService';
import { reservationStatusRules, normalizeReservationStatusLabel } from '../domain/reservations/statusRules';
import { readReservationLookupNavigationState } from '../utils/reservationLookup';
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
  const { initialFilters, initialQuery } = readReservationLookupNavigationState(location.state);

  const [selected, setSelected] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

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
    <div className="roomify-page-enter mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
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
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
            {t('checkInPage.gateTitle')}
          </p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('checkInPage.checklist')}
              </p>
              <p className="mt-2 text-3xl font-black break-words">
                {completedCount}/{CHECKLIST_ITEMS.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {t('checkInPage.reservation')}
              </p>
              <p className="mt-2 text-lg font-black break-words">
                {selected ? <LtrText>{selected.confirmationNumber}</LtrText> : t('notSelected')}
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
            title={t('checkInPage.selectTitle')}
            description={t('checkInPage.selectDescription')}
          >
            <div className="grid min-w-0 gap-3 md:grid-cols-3">
              {t('checkInPage.tips', { returnObjects: true }).map((item) => (
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
              title={t('checkInPage.summaryTitle')}
              description={t('checkInPage.summaryDescription')}
              action={<StatusPill status={selected.status} />}
            >
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">{t('common.guest')}</p>
                  <p className="mt-2 text-lg font-black text-brand-ink break-words">{selected.guest?.name || selected.guestName}</p>
                  <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                    {selected.guest?.email || selected.guestEmail || t('common.noGuestEmailProvided')}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">{t('checkInPage.confirmation')}</p>
                  <p className="mt-2 text-lg font-black text-brand-ink break-words">
                    <LtrText>{selected.confirmationNumber}</LtrText>
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">{t('common.room')}</p>
                  <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                    {t('roomNum', { number: selected.room?.roomNumber || selected.roomNumber })} |{' '}
                    {translateKnownValue(selected.room?.roomTypeName || selected.roomTypeName, t)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                    {t('floorNum', { floor: selected.room?.floor || selected.floor || '-' })}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">{t('common.stay')}</p>
                  <p className="mt-2 text-sm font-bold text-brand-ink break-words">
                    {formatLocalizedDate(selected.dates?.checkIn || selected.checkInDate, i18n.language, {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                    {formatLocalizedDate(selected.dates?.checkOut || selected.checkOutDate, i18n.language, {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">{t('nights')}</p>
                  <p className="mt-2 text-lg font-black text-brand-ink break-words">
                    {selected.dates?.nights || selected.nights || 0}
                  </p>
                </div>

                <div className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-ink-hint break-words">{t('checkInPage.reservationTotal')}</p>
                  <p className="mt-2 text-lg font-black text-brand-ink break-words">
                    {formatLocalizedCurrency(selected.pricing?.totalPrice || selected.totalPrice || 0, i18n.language)}
                  </p>
                </div>
              </div>

              {!reservationStatusRules.canCheckIn(selected.status) && (
                <div className="mt-4 rounded-[1.25rem] border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm font-medium text-brand-warning">
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
                <div className="grid min-w-0 gap-3 md:grid-cols-2">
                  {CHECKLIST_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const checked = Boolean(checklist[item.id]);

                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-start gap-4 rounded-[1.35rem] border p-4 transition ${
                          checked
                            ? 'border-brand-success/30 bg-brand-success/10'
                            : 'border-brand-surface-border bg-brand-surface-light hover:border-brand-surface-border hover:bg-white'
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleCheck(item.id)}
                          className="mt-0.5 h-5 w-5 rounded border-brand-surface-border focus-visible:ring-black/10 data-[state=checked]:bg-brand-success data-[state=checked]:border-brand-success"
                        />
                        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${
                          checked ? 'bg-brand-success/20 text-brand-success' : 'bg-white text-brand-ink-muted shadow-sm'
                        }`}>
                          <Icon className="h-4 w-4 shrink-0" />
                        </span>
                        <span className="min-w-0">
                          <p className={`text-sm font-bold ${checked ? 'text-brand-success' : 'text-brand-ink'}`}>
                            {resolveChecklistLabel(t, item.id)}
                          </p>
                          <p className={`mt-1 text-sm font-medium ${checked ? 'text-brand-success/80' : 'text-brand-ink-muted'}`}>
                            {checked ? t('checkInPage.checklistDone') : t('checkInPage.checklistPending')}
                          </p>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex min-w-0 items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.2em] text-brand-ink-hint">
                    <span>{t('progress')}</span>
                    <span>{completedCount}/{CHECKLIST_ITEMS.length}</span>
                  </div>
                  <div className="h-2 rounded-full bg-brand-primary-tint">
                    <div
                      className="h-2 rounded-full bg-brand-primary transition-all duration-300"
                      style={{ width: `${(completedCount / CHECKLIST_ITEMS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </DashboardPanel>
            )}

            {reservationStatusRules.canCheckIn(selected.status) && (
              <Button
                type="button"
                onClick={handleCheckIn}
                disabled={!canCheckIn || submitting}
                className="inline-flex min-w-0 w-full items-center justify-center rounded-full bg-brand-primary px-6 py-4 text-sm font-bold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted h-auto"
              >
                {submitting
                  ? t('processing')
                  : !allChecked
                    ? `${t('completeChecklistToCheckIn')} (${completedCount}/${CHECKLIST_ITEMS.length})`
                    : t('confirmCheckIn')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
