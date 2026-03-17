import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Receipt,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../context/AuthProvider';
import { useStaffDashboard } from '../hooks/useStaffDashboard';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    inventory,
    loading,
    error,
    availableTonight,
    floorsCovered,
    startingRate,
    premiumReady,
    guestCapacityReady,
    roomTypeSummary,
    alerts,
    dateWindow,
  } = useStaffDashboard();

  const welcomeName = user?.username || 'Staff Member';

  const quickActions = useMemo(
    () => [
      {
        icon: Search,
        title: t('roomSearch') || 'Room Search',
        description: 'Find available rooms and start a new reservation.',
        onClick: () => navigate('/search'),
      },
      {
        icon: ClipboardCheck,
        title: t('checkInTitle') || 'Check-In',
        description: 'Complete guest arrivals and checklist verification.',
        onClick: () => navigate('/check-in'),
      },
      {
        icon: CalendarClock,
        title: t('modifyReservationTitle') || 'Modify Reservation',
        description: 'Adjust dates and room assignments when plans change.',
        onClick: () => navigate('/reservations/modify'),
      },
      {
        icon: FileText,
        title: t('cancelReservationTitle') || 'Cancel Reservation',
        description: 'Handle cancellation requests with the current policy.',
        onClick: () => navigate('/reservations/cancel'),
      },
      {
        icon: Receipt,
        title: t('invoicePreview') || 'Invoices',
        description: 'Generate billing documents and confirm delivery.',
        onClick: () => navigate('/invoice-preview'),
      },
      {
        icon: Wallet,
        title: t('checkoutTitle') || 'Checkout',
        description: 'Review balances and complete guest departure.',
        onClick: () => navigate('/checkout'),
      },
    ],
    [navigate, t]
  );

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingState message="Loading tonight's available inventory..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState
          title="Staff dashboard unavailable"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow="Front Desk Operations"
        title={t('staffDashboardTitle') || 'Staff Dashboard'}
        description={`Welcome back, ${welcomeName}. This view is tuned for tonight's availability window so the front desk can move quickly between room search, check-in, billing, and reservation changes.`}
        meta={[
          `${dateWindow.checkIn} arrival window`,
          `${availableTonight} rooms available`,
          `${floorsCovered} floors represented`,
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Tonight's Inventory
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Starting Rate
              </p>
              <p className="mt-2 text-3xl font-black">
                {startingRate ? currency.format(startingRate) : 'N/A'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Largest Fit
              </p>
              <p className="mt-2 text-3xl font-black">{guestCapacityReady || 'N/A'}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={BedDouble}
          label="Available Tonight"
          value={String(availableTonight)}
          hint="Current search window using today's arrival and tomorrow's departure."
        />
        <DashboardMetricCard
          icon={Sparkles}
          label="Premium Ready"
          value={String(premiumReady)}
          hint="Deluxe and suite inventory currently available."
        />
        <DashboardMetricCard
          icon={Search}
          label="Room Types Ready"
          value={String(roomTypeSummary.length)}
          hint="Distinct room categories you can offer immediately."
        />
        <DashboardMetricCard
          icon={Receipt}
          label="Starting Rate"
          value={startingRate ? currency.format(startingRate) : 'N/A'}
          hint="Lowest visible base rate in tonight's live search."
          tone="dark"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardPanel
          title="Operational Actions"
          description="Primary workflows for the current shift."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <DashboardQuickAction key={action.title} {...action} />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Shift Alerts"
          description="Conditions worth calling out before promising inventory changes."
        >
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert} className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-4">
                  <p className="text-sm font-medium leading-6 text-amber-950">{alert}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-5">
              <p className="text-sm font-bold text-emerald-900">
                Inventory looks healthy.
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-800/80">
                The current search window has sufficient availability for standard front desk changes.
              </p>
            </div>
          )}
        </DashboardPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel
          title="Availability by Room Type"
          description="Live mix of the room categories you can currently offer tonight."
        >
          <div className="space-y-3">
            {roomTypeSummary.length > 0 ? (
              roomTypeSummary.map((item) => (
                <div key={item.name} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-zinc-950">{item.name}</p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        Available immediately for the active search window.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-700 shadow-sm">
                      {item.count} room{item.count === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-zinc-500">
                No inventory was returned for tonight's window.
              </p>
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Front Desk Playbook"
          description="Suggested workflow for the most common hotel desk scenarios."
        >
          <div className="grid gap-3">
            {[
              'Start every walk-in or modification request from Room Search so the room promise is based on live availability.',
              'Use Check-In only after confirming identity, payment readiness, and room status.',
              'Generate invoices before checkout when guests request paperwork in advance.',
              `Tonight's search returned ${inventory.length} available rooms, so escalate scarce categories early if premium inventory is low.`,
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium leading-6 text-zinc-600"
              >
                {item}
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
