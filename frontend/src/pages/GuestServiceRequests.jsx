import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BedDouble, BriefcaseBusiness, Clock3, Send } from 'lucide-react';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import {
  extractGuestReservationError,
  getGuestReservations,
} from '../services/guestReservationService';
import {
  createGuestServiceRequest,
  extractGuestServiceRequestError,
  getGuestServiceRequests,
} from '../services/serviceRequestService';
import {
  buildGuestReservationRoomContextLabel,
  getGuestAssistantReservationAccess,
} from '../utils/guestAssistant';
import {
  formatLocalizedDate,
  formatLocalizedDateTime,
  translateWithFallback,
} from '../utils/localization';
import {
  getServiceRequestPriorityBadgeClassName,
  getServiceRequestPriorityLabel,
  getServiceRequestStatusBadgeClassName,
  getServiceRequestStatusLabel,
  getServiceRequestTypeLabel,
  SERVICE_REQUEST_PRIORITIES,
  SERVICE_REQUEST_TYPES,
} from '../utils/serviceRequestPresentation';

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
const POLL_INTERVAL_MS = 12000;

const createInitialFormState = () => ({
  roomId: '',
  serviceType: '',
  description: '',
  priority: '',
});

const buildReservationLabel = (reservation, language, t) => {
  const roomLabel = buildGuestReservationRoomContextLabel(reservation)
    || translateWithFallback(t, 'unassigned', 'Unassigned');

  const dateRange = `${formatLocalizedDate(
    reservation.checkInDate,
    language,
    { dateStyle: 'medium' }
  )} - ${formatLocalizedDate(reservation.checkOutDate, language, {
    dateStyle: 'medium',
  })}`;

  return `${roomLabel} - ${dateRange}`;
};

export default function GuestServiceRequests() {
  const { t, i18n } = useTranslation();
  const [reservations, setReservations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [requestsReloadToken, setRequestsReloadToken] = useState(0);
  const [formState, setFormState] = useState(createInitialFormState);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRequestsReloadToken((current) => current + 1);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadReservations = async () => {
      setLoadingReservations(true);
      setError('');

      try {
        const data = await getGuestReservations();
        if (!isActive) return;
        setReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isActive) return;
        setError(extractGuestReservationError(err));
        setReservations([]);
      } finally {
        if (isActive) {
          setLoadingReservations(false);
        }
      }
    };

    loadReservations();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  useEffect(() => {
    let isActive = true;

    const loadRequests = async () => {
      try {
        const data = await getGuestServiceRequests();
        if (!isActive) return;
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isActive) return;
        setError((current) => current || extractGuestServiceRequestError(err));
        setRequests([]);
      } finally {
        if (isActive) {
          setLoadingRequests(false);
        }
      }
    };

    loadRequests();

    return () => {
      isActive = false;
    };
  }, [requestsReloadToken]);

  const reservationAccess = useMemo(
    () => getGuestAssistantReservationAccess(reservations),
    [reservations]
  );
  const activeReservations = reservationAccess.activeReservations;

  useEffect(() => {
    if (activeReservations.length === 1) {
      setFormState((current) => ({
        ...current,
        roomId: String(activeReservations[0].roomId),
      }));
      return;
    }

    if (
      activeReservations.length > 1 &&
      !activeReservations.some(
        (reservation) => String(reservation.roomId) === String(formState.roomId)
      )
    ) {
      setFormState((current) => ({
        ...current,
        roomId: String(activeReservations[0].roomId),
      }));
      return;
    }

    if (activeReservations.length === 0 && formState.roomId) {
      setFormState((current) => ({
        ...current,
        roomId: '',
      }));
    }
  }, [activeReservations, formState.roomId]);

  const openRequestsCount = useMemo(
    () => requests.filter((request) => request.status !== 'COMPLETED').length,
    [requests]
  );

  const latestRequest = requests[0] ?? null;

  const handleRetry = () => {
    setLoadingReservations(true);
    setLoadingRequests(true);
    setReloadToken((current) => current + 1);
    setRequestsReloadToken((current) => current + 1);
  };

  const handleChange = (field) => (event) => {
    setFormState((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setSubmissionError('');
    setSubmissionSuccess('');

    try {
      const created = await createGuestServiceRequest({
        roomId: Number(formState.roomId),
        serviceType: formState.serviceType,
        description: formState.description.trim(),
        ...(formState.priority ? { priority: formState.priority } : {}),
      });

      setRequests((current) => [created, ...current]);
      setSubmissionSuccess(
        translateWithFallback(
          t,
          'guestServiceRequests.submissionSuccess',
          'Your service request was submitted successfully.'
        )
      );
      setFormState((current) => ({
        roomId: current.roomId,
        serviceType: '',
        description: '',
        priority: '',
      }));
    } catch (err) {
      setSubmissionError(extractGuestServiceRequestError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const showInitialLoading = loadingReservations || loadingRequests;
  const showRoomSelector = activeReservations.length > 1;
  const autoSelectedReservation =
    activeReservations.length === 1 ? activeReservations[0] : null;
  const canRequestServices = activeReservations.length > 0;
  const serviceAccessMessage = reservationAccess.checkedOutOnly
    ? translateWithFallback(
        t,
        'guestServiceRequests.checkedOutRoomMessage',
        'Room services are available only during an active stay.'
      )
    : reservationAccess.hasAnyReservations
      ? translateWithFallback(
          t,
          'guestServiceRequests.checkInRequiredMessage',
          'Room services are available only during an active stay.'
        )
      : translateWithFallback(
          t,
          'guestServiceRequests.noReservationMessage',
          'Room services are available only during an active stay.'
        );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, 'guestServiceRequests.eyebrow', 'Guest services')}
        title={translateWithFallback(t, 'navRequestService', 'Request Service')}
        description={translateWithFallback(
          t,
          'guestServiceRequests.description',
          'Send housekeeping, dining, maintenance, or laundry requests directly to the hotel team.'
        )}
        meta={[
          translateWithFallback(
          t,
          'guestServiceRequests.activeRoomsMeta',
          '{{count}} active room selections available for service requests.',
          { count: activeReservations.length }
        ),
          translateWithFallback(
            t,
            'guestServiceRequests.openRequestsMeta',
            '{{count}} submitted requests are still in progress.',
            { count: openRequestsCount }
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
                {translateWithFallback(
                  t,
                  'guestServiceRequests.heroTitle',
                  'Direct hotel support'
                )}
              </p>
              <p className="truncate text-sm text-white/65">
                {translateWithFallback(
                  t,
                  'guestServiceRequests.heroDescription',
                  'Requests refresh automatically so you can track status changes during your stay.'
                )}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={BedDouble}
          label={translateWithFallback(t, 'guestServiceRequests.metrics.rooms', 'Active rooms')}
          value={showInitialLoading ? t('common.pending') : String(activeReservations.length)}
          hint={translateWithFallback(
            t,
            'guestServiceRequests.metrics.roomsHint',
            'Only active stays can receive service requests.'
          )}
        />
        <DashboardMetricCard
          icon={Clock3}
          label={translateWithFallback(
            t,
            'guestServiceRequests.metrics.openRequests',
            'Open requests'
          )}
          value={showInitialLoading ? t('common.pending') : String(openRequestsCount)}
          hint={translateWithFallback(
            t,
            'guestServiceRequests.metrics.openRequestsHint',
            'Pending and in-progress updates from the hotel team.'
          )}
        />
        <DashboardMetricCard
          icon={Send}
          label={translateWithFallback(
            t,
            'guestServiceRequests.metrics.latestRequest',
            'Latest request'
          )}
          value={
            latestRequest
              ? getServiceRequestTypeLabel(latestRequest.serviceType, t)
              : translateWithFallback(t, 'guestServiceRequests.noneYet', 'None yet')
          }
          hint={
            latestRequest
              ? getServiceRequestStatusLabel(latestRequest.status, t)
              : translateWithFallback(
                  t,
                  'guestServiceRequests.metrics.latestRequestHint',
                  'Submit your first request to start tracking status here.'
                )
          }
        />
        <DashboardMetricCard
          icon={BriefcaseBusiness}
          label={translateWithFallback(
            t,
            'guestServiceRequests.metrics.lastUpdated',
            'Last updated'
          )}
          value={
            latestRequest
              ? formatLocalizedDateTime(latestRequest.createdAt, i18n.language)
              : '-'
          }
          hint={translateWithFallback(
            t,
            'guestServiceRequests.metrics.lastUpdatedHint',
            'Guest request history refreshes automatically.'
          )}
          tone="light"
        />
      </div>

      {showInitialLoading ? (
        <LoadingState
          message={translateWithFallback(
            t,
            'guestServiceRequests.loading',
            'Loading your room selections and service requests.'
          )}
        />
      ) : error ? (
        <ErrorState
          title={translateWithFallback(
            t,
            'guestServiceRequests.errorTitle',
            'Unable to load service requests'
          )}
          message={error}
          onRetry={handleRetry}
        />
      ) : (
        <div className="grid min-w-0 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <DashboardPanel
            title={translateWithFallback(
              t,
              'guestServiceRequests.formTitle',
              'Submit a request'
            )}
            description={translateWithFallback(
              t,
              'guestServiceRequests.formDescription',
              'Choose the room and service details so the hotel team can act on the correct stay.'
            )}
          >
            {!canRequestServices ? (
              <EmptyState
                icon={BedDouble}
                title={translateWithFallback(
                  t,
                  reservationAccess.checkedOutOnly
                    ? 'guestServiceRequests.checkedOutTitle'
                    : 'guestServiceRequests.noActiveRoomTitle',
                  reservationAccess.checkedOutOnly
                    ? 'Services unavailable after checkout'
                    : 'No active room available'
                )}
                message={serviceAccessMessage}
              />
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {submissionSuccess ? (
                  <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {submissionSuccess}
                  </div>
                ) : null}
                {submissionError ? (
                  <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {submissionError}
                  </div>
                ) : null}

                {showRoomSelector ? (
                  <label className="grid min-w-0 gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 break-words">
                      {translateWithFallback(
                        t,
                        'guestServiceRequests.selectRoomLabel',
                        'Select Room'
                      )}
                    </span>
                    <NativeSelect
                      value={formState.roomId}
                      onChange={handleChange('roomId')}
                      className="h-12 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
                      required
                    >
                      {activeReservations.map((reservation) => (
                        <option
                          key={`${reservation.confirmationNumber}-${reservation.roomId}`}
                          value={reservation.roomId}
                        >
                          {buildReservationLabel(reservation, i18n.language, t)}
                        </option>
                      ))}
                    </NativeSelect>
                  </label>
                ) : autoSelectedReservation ? (
                  <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 break-words">
                      {translateWithFallback(
                        t,
                        'guestServiceRequests.selectedRoomLabel',
                        'Selected Room'
                      )}
                    </p>
                    <p className="mt-2 text-sm font-bold text-zinc-950 break-words">
                      {buildReservationLabel(autoSelectedReservation, i18n.language, t)}
                    </p>
                  </div>
                ) : null}

                <label className="grid min-w-0 gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 break-words">
                    {translateWithFallback(
                      t,
                      'guestServiceRequests.serviceTypeLabel',
                      'Service Type'
                    )}
                  </span>
                  <NativeSelect
                    value={formState.serviceType}
                    onChange={handleChange('serviceType')}
                    className="h-12 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
                    required
                  >
                    <option value="">
                      {translateWithFallback(
                        t,
                        'guestServiceRequests.serviceTypePlaceholder',
                        'Choose a service'
                      )}
                    </option>
                    {SERVICE_REQUEST_TYPES.map((serviceType) => (
                      <option key={serviceType} value={serviceType}>
                        {getServiceRequestTypeLabel(serviceType, t)}
                      </option>
                    ))}
                  </NativeSelect>
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 break-words">
                    {translateWithFallback(
                      t,
                      'guestServiceRequests.descriptionLabel',
                      'Description'
                    )}
                  </span>
                  <Textarea
                    value={formState.description}
                    onChange={handleChange('description')}
                    rows={5}
                    maxLength={1000}
                    className="w-full min-w-0 rounded-[1.5rem] border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
                    placeholder={translateWithFallback(
                      t,
                      'guestServiceRequests.descriptionPlaceholder',
                      'Describe what you need and include any timing or access details.'
                    )}
                    required
                  />
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 break-words">
                    {translateWithFallback(
                      t,
                      'guestServiceRequests.priorityLabel',
                      'Priority'
                    )}
                  </span>
                  <NativeSelect
                    value={formState.priority}
                    onChange={handleChange('priority')}
                    className="h-12 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
                  >
                    <option value="">
                      {translateWithFallback(
                        t,
                        'guestServiceRequests.priorityPlaceholder',
                        'Optional'
                      )}
                    </option>
                    {SERVICE_REQUEST_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {getServiceRequestPriorityLabel(priority, t)}
                      </option>
                    ))}
                  </NativeSelect>
                </label>

                <Button variant="unstyled" size="none"
                  type="submit"
                  disabled={
                    submitting ||
                    !formState.roomId ||
                    !formState.serviceType ||
                    !formState.description.trim()
                  }
                  className="inline-flex min-w-0 h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                >
                  {submitting
                    ? translateWithFallback(
                        t,
                        'guestServiceRequests.submitting',
                        'Submitting...'
                      )
                    : translateWithFallback(
                        t,
                        'guestServiceRequests.submitLabel',
                        'Submit request'
                      )}
                </Button>
              </form>
            )}
          </DashboardPanel>

          <DashboardPanel
            title={translateWithFallback(
              t,
              'guestServiceRequests.historyTitle',
              'Request status'
            )}
            description={translateWithFallback(
              t,
              'guestServiceRequests.historyDescription',
              'Track the latest updates to your submitted requests from the hotel team.'
            )}
          >
            {requests.length === 0 ? (
              <EmptyState
                icon={BriefcaseBusiness}
                title={translateWithFallback(
                  t,
                  'guestServiceRequests.emptyTitle',
                  'No service requests yet'
                )}
                message={translateWithFallback(
                  t,
                  'guestServiceRequests.emptyMessage',
                  'Once you submit a request, its status will appear here automatically.'
                )}
              />
            ) : (
              <div className="grid min-w-0 gap-4">
                {requests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5"
                  >
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black tracking-tight text-zinc-950 break-words">
                            {getServiceRequestTypeLabel(request.serviceType, t)}
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
                        <p className="text-sm font-medium text-zinc-500 break-words">
                          {request.roomNumber
                            ? translateWithFallback(
                                t,
                                'guestServiceRequests.requestRoomMeta',
                                'Room {{roomNumber}}',
                                { roomNumber: request.roomNumber }
                              )
                            : '-'}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-zinc-500 break-words">
                        {formatLocalizedDateTime(request.createdAt, i18n.language)}
                      </p>
                    </div>

                    <p className="mt-4 rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4 text-sm leading-6 text-zinc-700 break-words">
                      {request.description}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </DashboardPanel>
        </div>
      )}
    </div>
  );
}
