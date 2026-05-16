import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BriefcaseBusiness, ConciergeBell, Send } from 'lucide-react';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import {
  extractGuestServicesError,
  getGuestServices,
} from '../services/guestServiceCatalogService';
import {
  formatLocalizedCurrency,
  translateWithFallback,
} from '../utils/localization';

const buildReference = () =>
  `SRV-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()
    .toString()
    .slice(-4)}`;

const getServiceDescription = (service, t) => {
  const category = String(service?.category ?? '')
    .toLowerCase()
    .trim();

  if (category === 'food') {
    return translateWithFallback(
      t,
      'guestServiceRequests.foodDescription',
      'Dining and in-room refreshment requests handled by the hotel team.'
    );
  }

  if (category === 'cleaning') {
    return translateWithFallback(
      t,
      'guestServiceRequests.cleaningDescription',
      'Housekeeping support for cleaning, linens, and room refresh requests.'
    );
  }

  return translateWithFallback(
    t,
    'guestServiceRequests.generalDescription',
    'Hotel assistance for comfort, convenience, and general guest support.'
  );
};

function ServiceRequestCard({ service, language, onSubmit, submissionState, t }) {
  const [guestName, setGuestName] = useState('');
  const [details, setDetails] = useState('');

  const serviceId = String(service.id);
  const isSubmitted = submissionState?.serviceId === serviceId;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      serviceId,
      serviceName: service.name,
      guestName: guestName.trim(),
      details: details.trim(),
    });
    setGuestName('');
    setDetails('');
  };

  return (
    <article className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
            {translateWithFallback(t, 'guestServiceRequests.availableLabel', 'Available service')}
          </p>
          <h3 className="text-xl font-black tracking-tight text-zinc-950">
            {service.name}
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">
            {getServiceDescription(service, t)}
          </p>
        </div>
        <div className="rounded-[1.15rem] border border-zinc-200 bg-white px-4 py-3 text-right">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
            {translateWithFallback(t, 'guestServiceRequests.startingFromLabel', 'Starting from')}
          </p>
          <p className="mt-2 text-sm font-bold text-zinc-950">
            {formatLocalizedCurrency(service.price ?? 0, language)}
          </p>
        </div>
      </div>

      <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
              {translateWithFallback(t, 'guestServiceRequests.guestNameLabel', 'Guest name')}
            </span>
            <input
              type="text"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              placeholder={translateWithFallback(
                t,
                'guestServiceRequests.guestNamePlaceholder',
                'Enter guest name'
              )}
              required
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
              {translateWithFallback(t, 'guestServiceRequests.categoryLabel', 'Service category')}
            </span>
            <input
              type="text"
              value={service.category || '-'}
              readOnly
              className="rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-600 outline-none"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
            {translateWithFallback(t, 'guestServiceRequests.detailsLabel', 'Request details')}
          </span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder={translateWithFallback(
              t,
              'guestServiceRequests.detailsPlaceholder',
              'Add any details the hotel team should know.'
            )}
            rows={4}
            required
            className="rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {isSubmitted ? (
            <p className="text-sm font-semibold text-emerald-700">
              {translateWithFallback(
                t,
                'guestServiceRequests.confirmationMessage',
                'Request submitted successfully. Reference: {{reference}}',
                { reference: submissionState.reference }
              )}
            </p>
          ) : (
            <p className="text-sm text-zinc-500">
              {translateWithFallback(
                t,
                'guestServiceRequests.turnaroundHint',
                'The hotel team will review your request and follow up shortly.'
              )}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
          >
            <Send className="h-4 w-4" />
            {translateWithFallback(t, 'guestServiceRequests.submitLabel', 'Submit request')}
          </button>
        </div>
      </form>
    </article>
  );
}

export default function GuestServiceRequests() {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [submissionState, setSubmissionState] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadServices = async () => {
      setLoadingServices(true);
      setServicesError('');

      try {
        const data = await getGuestServices();
        if (!isActive) return;
        setServices(Array.isArray(data) ? data.filter((item) => item?.active !== false) : []);
      } catch (err) {
        if (!isActive) return;
        setServicesError(extractGuestServicesError(err));
        setServices([]);
      } finally {
        if (isActive) {
          setLoadingServices(false);
        }
      }
    };

    loadServices();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  const handleRetry = () => {
    setReloadToken((current) => current + 1);
  };

  const handleSubmit = ({ serviceId, serviceName, guestName, details }) => {
    setSubmissionState({
      serviceId,
      serviceName,
      guestName,
      details,
      reference: buildReference(),
    });
  };

  const activeCount = services.length;
  const startingPrice = useMemo(() => {
    if (services.length === 0) return null;

    return services.reduce((lowest, service) => {
      const price = Number(service.price ?? 0);
      if (!Number.isFinite(price)) return lowest;
      return lowest == null ? price : Math.min(lowest, price);
    }, null);
  }, [services]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, 'guestServiceRequests.eyebrow', 'Guest services')}
        title={translateWithFallback(t, 'guestServiceRequests.title', 'Service requests')}
        description={translateWithFallback(
          t,
          'guestServiceRequests.description',
          'Browse active hotel services and send a request directly from your guest workspace.'
        )}
        meta={[
          loadingServices
            ? translateWithFallback(
                t,
                'guestServiceRequests.loadingMeta',
                'Checking current service availability.'
              )
            : translateWithFallback(
                t,
                'guestServiceRequests.loadedMeta',
                '{{count}} services available now.',
                { count: activeCount }
              ),
          submissionState
            ? translateWithFallback(
                t,
                'guestServiceRequests.lastReferenceMeta',
                'Latest request reference: {{reference}}',
                { reference: submissionState.reference }
              )
            : translateWithFallback(
                t,
                'guestServiceRequests.noReferenceMeta',
                'No service requests submitted in this session yet.'
              ),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
              <ConciergeBell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {translateWithFallback(t, 'guestServiceRequests.heroCardTitle', 'Hotel assistance')}
              </p>
              <p className="truncate text-sm text-white/65">
                {translateWithFallback(
                  t,
                  'guestServiceRequests.heroCardDescription',
                  'Active services only are shown here for faster guest requests.'
                )}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardMetricCard
          icon={BriefcaseBusiness}
          label={translateWithFallback(t, 'guestServiceRequests.metrics.availableLabel', 'Available services')}
          value={loadingServices ? t('common.pending') : String(activeCount)}
          hint={translateWithFallback(
            t,
            'guestServiceRequests.metrics.availableHint',
            'Only currently active hotel services are shown.'
          )}
        />
        <DashboardMetricCard
          icon={ConciergeBell}
          label={translateWithFallback(t, 'guestServiceRequests.metrics.startingPriceLabel', 'Starting price')}
          value={
            loadingServices
              ? t('common.pending')
              : startingPrice == null
                ? '-'
                : formatLocalizedCurrency(startingPrice, i18n.language)
          }
          hint={translateWithFallback(
            t,
            'guestServiceRequests.metrics.startingPriceHint',
            'Based on the lowest current service rate.'
          )}
        />
        <DashboardMetricCard
          icon={Send}
          label={translateWithFallback(t, 'guestServiceRequests.metrics.lastRequestLabel', 'Latest request')}
          value={submissionState?.reference || '-'}
          hint={
            submissionState?.serviceName ||
            translateWithFallback(
              t,
              'guestServiceRequests.metrics.lastRequestHint',
              'Submit a service request to generate a confirmation reference.'
            )
          }
        />
      </div>

      <DashboardPanel
        title={translateWithFallback(t, 'guestServiceRequests.panelTitle', 'Request a hotel service')}
        description={translateWithFallback(
          t,
          'guestServiceRequests.panelDescription',
          'Choose from the active services below and send the details your hotel team needs.'
        )}
      >
        {loadingServices ? (
          <LoadingState
            message={translateWithFallback(
              t,
              'guestServiceRequests.loadingMessage',
              'Loading available services.'
            )}
          />
        ) : servicesError ? (
          <ErrorState
            title={translateWithFallback(
              t,
              'guestServiceRequests.errorTitle',
              'Unable to load services'
            )}
            message={servicesError}
            onRetry={handleRetry}
          />
        ) : services.length === 0 ? (
          <EmptyState
            icon={ConciergeBell}
            title={translateWithFallback(
              t,
              'guestServiceRequests.emptyTitle',
              'No active services available'
            )}
            message={translateWithFallback(
              t,
              'guestServiceRequests.emptyMessage',
              'The hotel has no active guest services available right now.'
            )}
          />
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <ServiceRequestCard
                key={service.id}
                service={service}
                language={i18n.language}
                onSubmit={handleSubmit}
                submissionState={submissionState}
                t={t}
              />
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
