import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, CalendarDays, LifeBuoy, Mail, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import { useAuth } from '../context/AuthProvider';

const SUPPORT_EMAIL = 'info@roomify.com';
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=Roomify%20Guest%20Support`;

export default function GuestDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const displayName = useMemo(
    () => user?.username || user?.email || t('guestFallback') || 'Guest',
    [user?.email, user?.username, t]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow="Guest Services"
        title={t('guestDashboardTitle') || 'Guest Dashboard'}
        description={`Welcome, ${displayName}. This space keeps your account details, booking support, and hotel contact options in one place.`}
        meta={[
          'Support-first experience',
          'Direct hotel contact',
          'Account overview',
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
          label="Bookings Help"
          value="Ready"
          hint="Support tools and guidance are available from the bookings page."
        />
        <DashboardMetricCard
          icon={Mail}
          label="Support Email"
          value="Live"
          hint={SUPPORT_EMAIL}
        />
        <DashboardMetricCard
          icon={BedDouble}
          label="Browse Rooms"
          value="Open"
          hint="Return to public room browsing and hotel information."
        />
        <DashboardMetricCard
          icon={LifeBuoy}
          label="Help Desk"
          value="Direct"
          hint="Contact the hotel directly for itinerary changes."
          tone="dark"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel
          title="Guest Actions"
          description="The fastest paths to booking help, account access, and hotel contact."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <DashboardQuickAction
              icon={CalendarDays}
              title={t('bookings') || 'Bookings'}
              description="Open booking support and guest assistance tools."
              onClick={() => navigate('/bookings')}
            />
            <DashboardQuickAction
              icon={BedDouble}
              title={t('browseRoomsBtn') || 'Browse Rooms'}
              description="Return to the public hotel pages and explore current offers."
              onClick={() => navigate('/')}
            />
            <DashboardQuickAction
              icon={Mail}
              title={t('helpSupport') || 'Help & Support'}
              description="Email the hotel with your confirmation number and travel dates."
              onClick={() => window.location.assign(SUPPORT_LINK)}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Account Overview"
          description="Current sign-in information and the best support channel."
        >
          <div className="grid gap-3">
            {[
              { label: t('usernameLabel') || 'Username', value: user?.username || 'N/A' },
              { label: t('emailLabel') || 'Email', value: user?.email || 'N/A' },
              { label: t('roleLabel') || 'Role', value: user?.roles?.[0] || 'ROLE_GUEST' },
              { label: 'Support Contact', value: SUPPORT_EMAIL },
            ].map((item) => (
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
        title="Reservation Help"
        description="What to prepare before contacting the hotel about an existing booking."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            'Keep your confirmation number ready before requesting itinerary or billing changes.',
            'Use the Bookings page first so you can reach the correct support path quickly.',
            'For room changes or date changes, contact the hotel directly so staff can verify live availability.',
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
  );
}
