import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BriefcaseBusiness, CheckCheck, Clock3, RefreshCw } from 'lucide-react';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import {
  extractStaffServiceRequestError,
  getStaffServiceRequests,
  updateStaffServiceRequestStatus,
} from '../services/serviceRequestService';
import {
  formatLocalizedDateTime,
  translateWithFallback,
} from '../utils/localization';
import {
  getServiceRequestPriorityBadgeClassName,
  getServiceRequestPriorityLabel,
  getServiceRequestStatusBadgeClassName,
  getServiceRequestStatusLabel,
  getServiceRequestTypeLabel,
} from '../utils/serviceRequestPresentation';

import { Button } from "@/components/ui/button";
const POLL_INTERVAL_MS = 10000;

export default function StaffServiceRequests() {
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyRequestId, setBusyRequestId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setReloadToken((current) => current + 1);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadRequests = async () => {
      setError('');

      try {
        const data = await getStaffServiceRequests();
        if (!isActive) return;
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isActive) return;
        setError(extractStaffServiceRequestError(err));
        setRequests([]);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadRequests();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  const metrics = useMemo(() => {
    const pendingCount = requests.filter((request) => request.status === 'PENDING').length;
    const inProgressCount = requests.filter((request) => request.status === 'IN_PROGRESS').length;
    const completedCount = requests.filter((request) => request.status === 'COMPLETED').length;

    return {
      total: requests.length,
      pendingCount,
      inProgressCount,
      completedCount,
    };
  }, [requests]);

  const handleRetry = () => {
    setLoading(true);
    setReloadToken((current) => current + 1);
  };

  const handleStatusUpdate = async (requestId, status) => {
    setBusyRequestId(requestId);
    setActionError('');

    try {
      const updated = await updateStaffServiceRequestStatus(requestId, status);
      setRequests((current) =>
        current.map((request) => (request.id === requestId ? updated : request))
      );
    } catch (err) {
      setActionError(extractStaffServiceRequestError(err));
    } finally {
      setBusyRequestId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, 'staffServiceRequests.eyebrow', 'Staff services')}
        title={translateWithFallback(t, 'navServiceRequests', 'Service Requests')}
        description={translateWithFallback(
          t,
          'staffServiceRequests.description',
          'Monitor incoming guest requests, prioritize active work, and keep room service tasks moving.'
        )}
        meta={[
          translateWithFallback(
            t,
            'staffServiceRequests.pollingMeta',
            'This board refreshes automatically every 10 seconds.'
          ),
          translateWithFallback(
            t,
            'staffServiceRequests.pendingMeta',
            '{{count}} requests are still waiting for action.',
            { count: metrics.pendingCount }
          ),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex min-w-0 h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950 break-words">
              <BriefcaseBusiness className="h-5 w-5 shrink-0" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {translateWithFallback(t, 'staffServiceRequests.heroTitle', 'Live request queue')}
              </p>
              <p className="truncate text-sm text-white/65">
                {translateWithFallback(
                  t,
                  'staffServiceRequests.heroDescription',
                  'New guest requests appear here automatically as they are submitted.'
                )}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={BriefcaseBusiness}
          label={translateWithFallback(t, 'staffServiceRequests.metrics.total', 'Total requests')}
          value={loading ? t('common.pending') : String(metrics.total)}
          hint={translateWithFallback(
            t,
            'staffServiceRequests.metrics.totalHint',
            'All guest service requests currently tracked by Roomify.'
          )}
        />
        <DashboardMetricCard
          icon={Clock3}
          label={translateWithFallback(t, 'staffServiceRequests.metrics.pending', 'Pending')}
          value={loading ? t('common.pending') : String(metrics.pendingCount)}
          hint={translateWithFallback(
            t,
            'staffServiceRequests.metrics.pendingHint',
            'Waiting for a staff member to pick them up.'
          )}
        />
        <DashboardMetricCard
          icon={RefreshCw}
          label={translateWithFallback(t, 'staffServiceRequests.metrics.inProgress', 'In progress')}
          value={loading ? t('common.pending') : String(metrics.inProgressCount)}
          hint={translateWithFallback(
            t,
            'staffServiceRequests.metrics.inProgressHint',
            'Currently being handled by hotel operations.'
          )}
        />
        <DashboardMetricCard
          icon={CheckCheck}
          label={translateWithFallback(t, 'staffServiceRequests.metrics.completed', 'Completed')}
          value={loading ? t('common.pending') : String(metrics.completedCount)}
          hint={translateWithFallback(
            t,
            'staffServiceRequests.metrics.completedHint',
            'Closed requests remain visible for follow-through.'
          )}
          tone="light"
        />
      </div>

      <DashboardPanel
        title={translateWithFallback(t, 'staffServiceRequests.panelTitle', 'Incoming queue')}
        description={translateWithFallback(
          t,
          'staffServiceRequests.panelDescription',
          'Review room-specific guest requests and update their progress as work moves forward.'
        )}
      >
        {actionError ? (
          <div className="mb-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {actionError}
          </div>
        ) : null}

        {loading ? (
          <LoadingState
            message={translateWithFallback(
              t,
              'staffServiceRequests.loading',
              'Loading service requests.'
            )}
          />
        ) : error ? (
          <ErrorState
            title={translateWithFallback(
              t,
              'staffServiceRequests.errorTitle',
              'Unable to load service requests'
            )}
            message={error}
            onRetry={handleRetry}
          />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={BriefcaseBusiness}
            title={translateWithFallback(
              t,
              'staffServiceRequests.emptyTitle',
              'No service requests yet'
            )}
            message={translateWithFallback(
              t,
              'staffServiceRequests.emptyMessage',
              'New guest requests will appear here as soon as they are submitted.'
            )}
          />
        ) : (
          <div className="grid min-w-0 gap-4">
            {requests.map((request) => {
              const isBusy = busyRequestId === request.id;

              return (
                <article
                  key={request.id}
                  className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5"
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black tracking-tight text-zinc-950 break-words">
                          {request.guestName ||
                            translateWithFallback(t, 'common.guest', 'Guest')}
                        </h3>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${getServiceRequestStatusBadgeClassName(request.status)}`}
                        >
                          {getServiceRequestStatusLabel(request.status, t)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${getServiceRequestPriorityBadgeClassName(request.priority)}`}
                        >
                          {getServiceRequestPriorityLabel(request.priority, t)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-600 break-words">
                        {request.roomNumber
                          ? translateWithFallback(
                              t,
                              'staffServiceRequests.roomMeta',
                              'Room {{roomNumber}}',
                              { roomNumber: request.roomNumber }
                            )
                          : translateWithFallback(t, 'unassigned', 'Unassigned')}
                        {' · '}
                        {getServiceRequestTypeLabel(request.serviceType, t)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-zinc-500 break-words">
                      {formatLocalizedDateTime(request.createdAt, i18n.language)}
                    </p>
                  </div>

                  <p className="mt-4 rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4 text-sm leading-6 text-zinc-700 break-words">
                    {request.description}
                  </p>

                  <div className="mt-4 flex min-w-0 flex-wrap gap-3">
                    <Button variant="unstyled" size="none"
                      type="button"
                      disabled={isBusy || request.status === 'IN_PROGRESS'}
                      onClick={() => handleStatusUpdate(request.id, 'IN_PROGRESS')}
                      className="inline-flex min-w-0 h-11 items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-5 text-sm font-bold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
                    >
                      {translateWithFallback(
                        t,
                        'staffServiceRequests.markInProgress',
                        'Mark In Progress'
                      )}
                    </Button>
                    <Button variant="unstyled" size="none"
                      type="button"
                      disabled={isBusy || request.status === 'COMPLETED'}
                      onClick={() => handleStatusUpdate(request.id, 'COMPLETED')}
                      className="inline-flex min-w-0 h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                    >
                      {translateWithFallback(
                        t,
                        'staffServiceRequests.markCompleted',
                        'Mark Completed'
                      )}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
