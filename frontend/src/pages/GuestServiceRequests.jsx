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

const POLL_INTERVAL_MS = 12000;
const ACTIVE_RESERVATION_STATUSES = new Set(['CONFIRMED', 'CHECKED_IN']);

const createInitialFormState = () => ({
  roomId: '',
  serviceType: '',
  description: '',
  priority: '',
});

const isActiveReservation = (reservation) => {
  if (!reservation?.roomId || !reservation?.roomNumber) {
    return false;
  }

  if (!ACTIVE_RESERVATION_STATUSES.has(reservation.status)) {
    return false;
  }

  if (!reservation.checkOutDate) {
    return true;
  }

  const checkout = new Date(`${reservation.checkOutDate}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return !Number.isNaN(checkout.getTime()) && checkout >= today;
};

const buildReservationLabel = (reservation, language, t) => {
  const roomLabel = reservation.roomNumber
    ? translateWithFallback(
        t,
        'guestServiceRequests.roomLabel',
        'Room {{roomNumber}}',
        { roomNumber: reservation.roomNumber }
      )
    : translateWithFallback(t, 'unassigned', 'Unassigned');

  const dateRange = `${formatLocalizedDate(
    reservation.checkInDate,
    language,
    { dateStyle: 'medium' }
  )} آ· ${formatLocalizedDate(reservation.checkOutDate, language, {
    dateStyle: 'medium',
  })}`;

  return `${roomLabel} آ· ${dateRange}`;
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

  const activeReservations = useMemo(
    () => reservations.filter(isActiveReservation),
    [reservations]
  );

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
        <div className="rounded-[1.75rem] border border-white/12 bg-card/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-foreground">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-primary-foreground">
                {translateWithFallback(
                  t,
                  'guestServiceRequests.heroTitle',
                  'Direct hotel support'
                )}
              </p>
              <p className="truncate text-sm text-primary-foreground/65">
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={BedDouble}
          label={translateWithFallback(t, 'guestServiceRequests.metrics.rooms', 'Active rooms')}
          value={showInitialLoading ? t('common.pending') : String(activeReservations.length)}
          hint={translateWithFallback(
            t,
            'guestServiceRequests.metrics.roomsHint',
            'Only confirmed and checked-in stays can receive service requests.'
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
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
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
            {activeReservations.length === 0 ? (
              <EmptyState
                icon={BedDouble}
                title={translateWithFallback(
                  t,
                  'guestServiceRequests.noActiveRoomTitle',
                  'No active room available'
                )}
                message={translateWithFallback(
                  t,
                  'guestServiceRequests.noActiveRoomMessage',
                  'You need a confirmed or checked-in reservation before you can request hotel services.'
                )}
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
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      {translateWithFallback(
                        t,
                        'guestServiceRequests.selectRoomLabel',
                        'Select Room'
                      )}
                    </span>
                    <select
                      value={formState.roomId}
                      onChange={handleChange('roomId')}
                      className="h-12 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground outline-none transition focus:border-ring"
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
                    </select>
                  </label>
                ) : autoSelectedReservation ? (
                  <div className="rounded-[1.35rem] border border-border bg-muted px-4 py-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      {translateWithFallback(
                        t,
                        'guestServiceRequests.selectedRoomLabel',
                        'Selected Room'
                      )}
                    </p>
                    <p className="mt-2 text-sm font-bold text-foreground">
                      {buildReservationLabel(autoSelectedReservation, i18n.language, t)}
                    </p>
                  </div>
                ) : null}

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {translateWithFallback(
                      t,
                      'guestServiceRequests.serviceTypeLabel',
                      'Service Type'
                    )}
                  </span>
                  <select
                    value={formState.serviceType}
                    onChange={handleChange('serviceType')}
                    className="h-12 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground outline-none transition focus:border-ring"
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
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {translateWithFallback(
                      t,
                      'guestServiceRequests.descriptionLabel',
                      'Description'
                    )}
                  </span>
                  <textarea
                    value={formState.description}
                    onChange={handleChange('description')}
                    rows={5}
                    maxLength={1000}
                    className="rounded-[1.5rem] border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring"
                    placeholder={translateWithFallback(
                      t,
                      'guestServiceRequests.descriptionPlaceholder',
                      'Describe what you need and include any timing or access details.'
                    )}
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {translateWithFallback(
                      t,
                      'guestServiceRequests.priorityLabel',
                      'Priority'
                    )}
                  </span>
                  <select
                    value={formState.priority}
                    onChange={handleChange('priority')}
                    className="h-12 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground outline-none transition focus:border-ring"
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
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !formState.roomId ||
                    !formState.serviceType ||
                    !formState.description.trim()
                  }
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted/90 disabled:text-muted-foreground"
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
                </button>
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
              <div className="grid gap-4">
                {requests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-[1.5rem] border border-border bg-muted p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black tracking-tight text-foreground">
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
                        <p className="text-sm font-medium text-muted-foreground">
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
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatLocalizedDateTime(request.createdAt, i18n.language)}
                      </p>
                    </div>

                    <p className="mt-4 rounded-[1.25rem] border border-border bg-card px-4 py-4 text-sm leading-6 text-muted-foreground">
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
