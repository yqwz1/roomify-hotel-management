import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Building2,
  ClipboardCheck,
  Receipt,
  Settings2,
  Sparkles,
  Tag,
  Users,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../context/AuthProvider';
import { useManagerDashboard } from '../hooks/useManagerDashboard';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    loading,
    error,
    loadIssues,
    totalRooms,
    availableRooms,
    cleaningRooms,
    maintenanceRooms,
    occupancyRate,
    readinessRate,
    roomTypeCount,
    activeStaff,
    statusCounts,
    floorSummary,
    departmentSummary,
    roomTypeMix,
    alerts,
  } = useManagerDashboard();

  const welcomeName = user?.username || t('managerFallback') || 'Manager';

  const quickActions = useMemo(
    () => [
      {
        icon: BedDouble,
        title: 'New Booking',
        description: 'Search live availability and start a reservation.',
        onClick: () => navigate('/search'),
      },
      {
        icon: ClipboardCheck,
        title: 'Check-In Desk',
        description: 'Handle arrivals and validate reservation details.',
        onClick: () => navigate('/check-in'),
      },
      {
        icon: Settings2,
        title: 'Rooms Management',
        description: 'Update room inventory, floor assignments, and statuses.',
        onClick: () => navigate('/rooms-management'),
      },
      {
        icon: Tag,
        title: 'Room Types',
        description: 'Adjust categories, pricing, and guest capacity.',
        onClick: () => navigate('/room-types'),
      },
      {
        icon: Users,
        title: 'Staff & Access',
        description: 'Review staff accounts, departments, and activity.',
        onClick: () => navigate('/staff'),
      },
      {
        icon: Receipt,
        title: 'Invoices',
        description: 'Generate and review billing documents.',
        onClick: () => navigate('/invoice-preview'),
      },
    ],
    [navigate]
  );

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingState message="Loading live property operations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState
          title="Dashboard unavailable"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow="Property Command Center"
        title={t('managerDashboardTitle') || 'Manager Dashboard'}
        description={`Welcome back, ${welcomeName}. This view focuses on inventory health, staffing coverage, and the rooms that need intervention before they can return to revenue.`}
        meta={[
          `${occupancyRate}% occupied`,
          `${availableRooms} rooms ready`,
          `${activeStaff} active staff`,
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200/80">
            Live Focus
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Readiness
              </p>
              <p className="mt-2 text-3xl font-black">{readinessRate}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Cleaning Queue
              </p>
              <p className="mt-2 text-3xl font-black">{cleaningRooms}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      {loadIssues.length > 0 && (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
          {loadIssues.join(' ')}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardMetricCard
          icon={Building2}
          label="Total Rooms"
          value={String(totalRooms)}
          hint="Full inventory tracked across all floors."
        />
        <DashboardMetricCard
          icon={BedDouble}
          label="Available Now"
          value={String(availableRooms)}
          hint="Rooms immediately ready for allocation."
        />
        <DashboardMetricCard
          icon={Sparkles}
          label="Needs Cleaning"
          value={String(cleaningRooms)}
          hint="Housekeeping queue that still blocks revenue."
        />
        <DashboardMetricCard
          icon={Wrench}
          label="Maintenance"
          value={String(maintenanceRooms)}
          hint="Rooms removed from service pending repairs."
        />
        <DashboardMetricCard
          icon={Users}
          label="Active Staff"
          value={String(activeStaff)}
          hint={`${roomTypeCount} room types currently configured.`}
          tone="dark"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <DashboardPanel
          title="Quick Actions"
          description="Move directly into the highest-frequency workflows without leaving the command center."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <DashboardQuickAction key={action.title} {...action} />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Operational Alerts"
          description="Conditions that currently block inventory, staffing, or service readiness."
        >
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <button
                  key={alert.title}
                  type="button"
                  onClick={() => navigate(alert.href)}
                  className="w-full rounded-[1.4rem] border border-rose-100 bg-rose-50 px-4 py-4 text-start transition hover:border-rose-200 hover:bg-rose-100/80"
                >
                  <p className="text-sm font-bold text-rose-950">{alert.title}</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-rose-900/80">
                    {alert.detail}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-5">
              <p className="text-sm font-bold text-emerald-900">
                No active operational blockers.
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-800/80">
                Inventory, staffing, and room readiness are currently in a healthy state.
              </p>
            </div>
          )}
        </DashboardPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardPanel
          title="Room Status Breakdown"
          description="Live distribution of the room inventory by operational state."
        >
          <div className="space-y-4">
            {statusCounts.map((item) => {
              const width = totalRooms > 0
                ? `${Math.max((item.count / totalRooms) * 100, item.count > 0 ? 6 : 0)}%`
                : '0%';

              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${item.tone}`}>
                        {item.label}
                      </span>
                      <p className="text-sm font-medium text-zinc-500">
                        {item.count} room{item.count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <p className="text-sm font-black text-zinc-950">
                      {totalRooms > 0 ? `${Math.round((item.count / totalRooms) * 100)}%` : '0%'}
                    </p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-zinc-100">
                    <div className={`h-2 rounded-full ${item.bar}`} style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Floor Readiness"
          description="Per-floor readiness snapshot to help operations clear blocked inventory faster."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {floorSummary.map((floor) => (
              <div key={String(floor.floor)} className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                      Floor {floor.floor}
                    </p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
                      {floor.total} rooms
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-600 shadow-sm">
                    {floor.available} ready
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  <div className="rounded-2xl bg-white px-3 py-2 text-center">
                    <p>Occupied</p>
                    <p className="mt-1 text-base font-black text-zinc-950">{floor.occupied}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-2 text-center">
                    <p>Cleaning</p>
                    <p className="mt-1 text-base font-black text-zinc-950">{floor.cleaning}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-2 text-center">
                    <p>Repair</p>
                    <p className="mt-1 text-base font-black text-zinc-950">{floor.maintenance}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardPanel
          title="Staffing Coverage"
          description="Department distribution based on the active staff roster."
        >
          <div className="space-y-3">
            {departmentSummary.length > 0 ? (
              departmentSummary.map((department) => (
                <div key={department.department} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-zinc-950">{department.department}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-600 shadow-sm">
                      {department.count} staff
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-zinc-500">
                No staffing data is available yet.
              </p>
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Room Type Mix"
          description="Inventory allocation by room category, capacity, and starting rate."
        >
          <div className="space-y-3">
            {roomTypeMix.length > 0 ? (
              roomTypeMix.map((roomType) => (
                <div key={roomType.id} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-950">{roomType.name}</p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        Up to {roomType.maxGuests} guest{roomType.maxGuests === 1 ? '' : 's'} | Base rate {currency.format(Number(roomType.basePrice ?? 0))}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-700 shadow-sm">
                      {roomType.assignedRooms} assigned room{roomType.assignedRooms === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-zinc-500">
                No room type data is available yet.
              </p>
            )}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
