import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BriefcaseBusiness,
  ClipboardList,
  History,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import DashboardQuickAction from '../components/dashboard/DashboardQuickAction';
import { useAuth } from '../context/AuthProvider';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { useStaff } from '../hooks/useStaff';
import { extractAuditLogError, getRecentAuditLogs } from '../services/auditLogService';
import {
  formatLocalizedCurrency,
  formatLocalizedDateTime,
  formatLocalizedNumber,
  translateKnownValue,
  translateWithFallback,
} from '../utils/localization';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { staff, loading: loadingStaff, error: staffError, fetchStaff } = useStaff();
  const {
    roomTypes,
    loading: loadingRoomTypes,
    error: roomTypeError,
    fetchRoomTypes,
  } = useRoomTypes();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(true);
  const [auditLogError, setAuditLogError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    fetchStaff();
    fetchRoomTypes();
  }, [fetchRoomTypes, fetchStaff, reloadToken]);

  useEffect(() => {
    let ignore = false;

    const loadAuditLogs = async () => {
      setLoadingAuditLogs(true);
      setAuditLogError(null);

      try {
        const data = await getRecentAuditLogs(8);
        if (ignore) return;
        setAuditLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (ignore) return;
        setAuditLogs([]);
        setAuditLogError(extractAuditLogError(err));
      } finally {
        if (!ignore) {
          setLoadingAuditLogs(false);
        }
      }
    };

    loadAuditLogs();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  const handleReload = () => {
    setReloadToken((current) => current + 1);
  };

  const activeStaffCount = useMemo(
    () => staff.filter((member) => member.active).length,
    [staff]
  );
  const inactiveStaffCount = useMemo(
    () => staff.filter((member) => !member.active).length,
    [staff]
  );
  const averageRoomTypeRate = useMemo(() => {
    if (roomTypes.length === 0) {
      return 0;
    }

    const total = roomTypes.reduce(
      (sum, roomType) => sum + Number(roomType.basePrice ?? 0),
      0
    );
    return total / roomTypes.length;
  }, [roomTypes]);
  const welcomeName = user?.username || translateWithFallback(t, 'roleAdmin', 'Admin');
  const isPageLoading = loadingStaff && loadingRoomTypes && loadingAuditLogs;
  const hasPageError =
    !staff.length && !roomTypes.length && !auditLogs.length &&
    (staffError || roomTypeError || auditLogError);

  const quickActions = [
    {
      icon: Users,
      title: translateWithFallback(t, 'staffMenu', 'Staff'),
      description: translateWithFallback(
        t,
        'adminDashboardPage.quickActions.staffDescription',
        'Manage staff accounts, status, and access recovery.'
      ),
      onClick: () => navigate('/staff'),
    },
    {
      icon: Tag,
      title: translateWithFallback(t, 'roomTypes', 'Room Types'),
      description: translateWithFallback(
        t,
        'adminDashboardPage.quickActions.roomTypesDescription',
        'Control room categories, pricing, and guest capacity.'
      ),
      onClick: () => navigate('/room-types'),
    },
    {
      icon: BriefcaseBusiness,
      title: translateWithFallback(t, 'servicesTitle', 'Services'),
      description: translateWithFallback(
        t,
        'adminDashboardPage.quickActions.servicesDescription',
        'Manage hotel service catalog entries and service availability.'
      ),
      onClick: () => navigate('/services'),
    },
  ];

  if (isPageLoading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingState
          message={translateWithFallback(
            t,
            'adminDashboardPage.loading',
            'Loading admin workspace...'
          )}
        />
      </div>
    );
  }

  if (hasPageError) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState
          title={translateWithFallback(
            t,
            'adminDashboardPage.errorTitle',
            'Admin workspace unavailable'
          )}
          message={staffError || roomTypeError || auditLogError}
          onRetry={handleReload}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(
          t,
          'adminDashboardPage.eyebrow',
          'System access control'
        )}
        title={translateWithFallback(
          t,
          'adminDashboardTitle',
          'Admin Dashboard'
        )}
        description={translateWithFallback(
          t,
          'adminDashboardPage.description',
          'Welcome back, {{name}}. This workspace keeps staff access, room setup, hotel services, and recent audit activity in one place.',
          { name: welcomeName }
        )}
        meta={[
          translateWithFallback(
            t,
            'adminDashboardPage.metaStaff',
            '{{count}} staff accounts',
            { count: staff.length }
          ),
          translateWithFallback(
            t,
            'adminDashboardPage.metaRoomTypes',
            '{{count}} room types',
            { count: roomTypes.length }
          ),
          translateWithFallback(
            t,
            'adminDashboardPage.metaAudit',
            '{{count}} recent audit entries',
            { count: auditLogs.length }
          ),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {translateWithFallback(
              t,
              'adminDashboardPage.focusTitle',
              'Admin focus'
            )}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {translateWithFallback(
                  t,
                  'adminDashboardPage.focusStaff',
                  'Active staff'
                )}
              </p>
              <p className="mt-2 text-3xl font-black">{activeStaffCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {translateWithFallback(
                  t,
                  'adminDashboardPage.focusAudit',
                  'Audit trail'
                )}
              </p>
              <p className="mt-2 text-3xl font-black">{auditLogs.length}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={Users}
          label={translateWithFallback(
            t,
            'adminDashboardPage.metrics.staffLabel',
            'Staff Accounts'
          )}
          value={formatLocalizedNumber(staff.length, i18n.language)}
          hint={translateWithFallback(
            t,
            'adminDashboardPage.metrics.staffHint',
            'All hotel staff accounts visible to administrators.'
          )}
        />
        <DashboardMetricCard
          icon={ShieldCheck}
          label={translateWithFallback(
            t,
            'adminDashboardPage.metrics.activeStaffLabel',
            'Active Staff'
          )}
          value={formatLocalizedNumber(activeStaffCount, i18n.language)}
          hint={translateWithFallback(
            t,
            'adminDashboardPage.metrics.activeStaffHint',
            'Accounts currently active for operational access.'
          )}
        />
        <DashboardMetricCard
          icon={Tag}
          label={translateWithFallback(
            t,
            'adminDashboardPage.metrics.roomTypesLabel',
            'Room Types'
          )}
          value={formatLocalizedNumber(roomTypes.length, i18n.language)}
          hint={translateWithFallback(
            t,
            'adminDashboardPage.metrics.roomTypesHint',
            'Configured room categories available to the hotel.'
          )}
        />
        <DashboardMetricCard
          icon={ClipboardList}
          label={translateWithFallback(
            t,
            'adminDashboardPage.metrics.averageRateLabel',
            'Average Base Rate'
          )}
          value={formatLocalizedCurrency(averageRoomTypeRate, i18n.language)}
          hint={translateWithFallback(
            t,
            'adminDashboardPage.metrics.averageRateHint',
            'Average starting rate across the configured room catalog.'
          )}
          valueDirection="ltr"
          valueWrap="nowrap"
          tone="light"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardPanel
          title={translateWithFallback(
            t,
            'adminDashboardPage.quickActionsTitle',
            'Quick Actions'
          )}
          description={translateWithFallback(
            t,
            'adminDashboardPage.quickActionsDescription',
            'Move directly into the core system configuration surfaces.'
          )}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <DashboardQuickAction key={action.title} {...action} />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={translateWithFallback(
            t,
            'adminDashboardPage.staffSummaryTitle',
            'Staff Summary'
          )}
          description={translateWithFallback(
            t,
            'adminDashboardPage.staffSummaryDescription',
            'Staff account activity and access state at a glance.'
          )}
        >
          {loadingStaff ? (
            <LoadingState message={translateWithFallback(t, 'adminDashboardPage.loadingStaff', 'Loading staff accounts...')} />
          ) : staffError ? (
            <ErrorState
              title={translateWithFallback(t, 'adminDashboardPage.staffSummaryTitle', 'Staff Summary')}
              message={staffError}
              onRetry={handleReload}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {translateWithFallback(t, 'adminDashboardPage.totalStaff', 'Total')}
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{staff.length}</p>
              </div>
              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {translateWithFallback(t, 'adminDashboardPage.activeStaff', 'Active')}
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{activeStaffCount}</p>
              </div>
              <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  {translateWithFallback(t, 'adminDashboardPage.inactiveStaff', 'Inactive')}
                </p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{inactiveStaffCount}</p>
              </div>
            </div>
          )}
        </DashboardPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardPanel
          title={translateWithFallback(
            t,
            'adminDashboardPage.roomTypeSummaryTitle',
            'Room Type Summary'
          )}
          description={translateWithFallback(
            t,
            'adminDashboardPage.roomTypeSummaryDescription',
            'Configured room categories and base-price posture.'
          )}
        >
          {loadingRoomTypes ? (
            <LoadingState message={translateWithFallback(t, 'adminDashboardPage.loadingRoomTypes', 'Loading room types...')} />
          ) : roomTypeError ? (
            <ErrorState
              title={translateWithFallback(t, 'adminDashboardPage.roomTypeSummaryTitle', 'Room Type Summary')}
              message={roomTypeError}
              onRetry={handleReload}
            />
          ) : roomTypes.length === 0 ? (
            <EmptyState
              title={translateWithFallback(
                t,
                'adminDashboardPage.emptyRoomTypesTitle',
                'No room types configured'
              )}
              message={translateWithFallback(
                t,
                'adminDashboardPage.emptyRoomTypesDescription',
                'Create room categories before assigning inventory or pricing.'
              )}
              icon={Tag}
            />
          ) : (
            <div className="space-y-3">
              {roomTypes.slice(0, 6).map((roomType) => (
                <div
                  key={roomType.id}
                  className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-zinc-950">
                        {translateKnownValue(roomType.name, t)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-500">
                        {translateWithFallback(
                          t,
                          'adminDashboardPage.capacityLine',
                          'Up to {{count}} guests',
                          { count: Number(roomType.maxGuests ?? 0) }
                        )}
                      </p>
                    </div>
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-700">
                      {formatLocalizedCurrency(roomType.basePrice, i18n.language)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title={translateWithFallback(
            t,
            'adminDashboardPage.auditTitle',
            'Recent Audit Activity'
          )}
          description={translateWithFallback(
            t,
            'adminDashboardPage.auditDescription',
            'Recent system-level events captured by the audit log.'
          )}
        >
          {loadingAuditLogs ? (
            <LoadingState message={translateWithFallback(t, 'adminDashboardPage.loadingAuditLogs', 'Loading audit activity...')} />
          ) : auditLogError ? (
            <ErrorState
              title={translateWithFallback(t, 'adminDashboardPage.auditTitle', 'Recent Audit Activity')}
              message={auditLogError}
              onRetry={handleReload}
            />
          ) : auditLogs.length === 0 ? (
            <EmptyState
              title={translateWithFallback(
                t,
                'adminDashboardPage.emptyAuditTitle',
                'No audit activity yet'
              )}
              message={translateWithFallback(
                t,
                'adminDashboardPage.emptyAuditDescription',
                'Audit entries will appear here after staff, room type, and service changes.'
              )}
              icon={History}
            />
          ) : (
            <div className="space-y-3" data-testid="admin-audit-logs">
              {auditLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-zinc-950">{entry.action}</p>
                      <p className="mt-1 text-sm font-medium text-zinc-600">
                        {entry.target}
                      </p>
                    </div>
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      {entry.actor}
                    </span>
                  </div>
                  {entry.metadata ? (
                    <p className="mt-3 text-sm font-medium leading-6 text-zinc-500">
                      {entry.metadata}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                    {formatLocalizedDateTime(entry.createdAt, i18n.language, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}
