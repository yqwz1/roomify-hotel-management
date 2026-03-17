import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BedDouble, CalendarDays, LifeBuoy, Mail, UserRound } from 'lucide-react';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import { useAuth } from '../context/AuthProvider';
import { getRoleCodeLabel } from '../utils/localization';

const SUPPORT_EMAIL = 'info@roomify.com';
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=Roomify%20Guest%20Support`;

export default function GuestDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pageTx = 'guestDashboardPage';

  const displayName = useMemo(
    () => user?.username || user?.email || t('guestFallback') || t('roleGuest'),
    [user?.email, user?.username, t]
  );

  const accountItems = [
    { label: t('usernameLabel'), value: user?.username || '-' },
    { label: t('emailLabel'), value: user?.email || '-' },
    { label: t('roleLabel'), value: getRoleCodeLabel(user?.roles?.[0] || 'ROLE_GUEST', t) },
    { label: t(`${pageTx}.supportContact`), value: SUPPORT_EMAIL },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={t(`${pageTx}.eyebrow`)}
        title={t('guestDashboardTitle')}
        description={t(`${pageTx}.description`, { name: displayName })}
        meta={[
          t(`${pageTx}.supportExperience`),
          t(`${pageTx}.directHotelContact`),
          t(`${pageTx}.accountOverviewMeta`),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{displayName}</p>
              <p className="truncate text-sm text-white/65">{user?.email || SUPPORT_EMAIL}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={CalendarDays}
          label={t(`${pageTx}.metrics.bookingsLabel`)}
          value={t(`${pageTx}.metrics.bookingsValue`)}
          hint={t(`${pageTx}.metrics.bookingsHint`)}
        />
        <DashboardMetricCard
          icon={Mail}
          label={t(`${pageTx}.metrics.supportEmailLabel`)}
          value={t(`${pageTx}.metrics.supportEmailValue`)}
          hint={SUPPORT_EMAIL}
        />
        <DashboardMetricCard
          icon={BedDouble}
          label={t(`${pageTx}.metrics.browseLabel`)}
          value={t(`${pageTx}.metrics.browseValue`)}
          hint={t(`${pageTx}.metrics.browseHint`)}
        />
        <DashboardMetricCard
          icon={LifeBuoy}
          label={t(`${pageTx}.metrics.helpDeskLabel`)}
          value={t(`${pageTx}.metrics.helpDeskValue`)}
          hint={t(`${pageTx}.metrics.helpDeskHint`)}
          tone="dark"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel
          title={t(`${pageTx}.actionsTitle`)}
          description={t(`${pageTx}.actionsDescription`)}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DashboardQuickAction
              icon={CalendarDays}
              title={t('bookings')}
              description={t(`${pageTx}.bookingsDescription`)}
              onClick={() => navigate('/bookings')}
            />
            <DashboardQuickAction
              icon={BedDouble}
              title={t('browseRoomsBtn')}
              description={t(`${pageTx}.browseDescription`)}
              onClick={() => navigate('/')}
            />
            <DashboardQuickAction
              icon={Mail}
              title={t('helpSupport')}
              description={t(`${pageTx}.supportDescription`)}
              onClick={() => window.location.assign(SUPPORT_LINK)}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={t(`${pageTx}.accountTitle`)}
          description={t(`${pageTx}.accountDescription`)}
        >
          <div className="grid gap-3">
            {accountItems.map((item) => (
              <div key={item.label} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-950">{item.value}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title={t(`${pageTx}.reservationHelpTitle`)}
        description={t(`${pageTx}.reservationHelpDescription`)}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {t(`${pageTx}.tips`, { returnObjects: true }).map((item) => (
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
  );
}
