import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BriefcaseBusiness,
  Pencil,
  Plus,
  Power,
  PowerOff,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import ModalFrame from '../components/common/ModalFrame';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import {
  createService,
  extractServiceError,
  getServices,
  setServiceActive,
  updateService,
} from '../services/serviceService';
import {
  formatLocalizedCurrency,
  formatLocalizedNumber,
  translateWithFallback,
} from '../utils/localization';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
const SERVICE_CATEGORIES = ['FOOD', 'CLEANING', 'OTHER'];

const createEmptyForm = () => ({
  name: '',
  category: 'OTHER',
  price: '',
  active: true,
});

function ServiceModal({
  formData,
  setFormData,
  onClose,
  onSubmit,
  saving,
  error,
  editing,
  t,
}) {
  return (
    <ModalFrame
      title={
        editing
          ? translateWithFallback(t, 'hotelServicesPage.editTitle', 'Edit Service')
          : translateWithFallback(t, 'hotelServicesPage.createTitle', 'Add Service')
      }
      description={translateWithFallback(
        t,
        editing
          ? 'hotelServicesPage.editDescription'
          : 'hotelServicesPage.createDescription',
        'Manage guest-facing hotel service catalog entries.'
      )}
      onClose={onClose}
      closeLabel={translateWithFallback(t, 'closeDialog', 'Close')}
      widthClassName="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-[1.25rem] border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm font-medium text-brand-danger">
            {error}
          </div>
        ) : null}

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="service-name" className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(t, 'nameLabel', 'Name')}
            </Label>
            <Input
              id="service-name"
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, name: event.target.value }))
              }
              className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-black/5"
              placeholder={translateWithFallback(
                t,
                'hotelServicesPage.namePlaceholder',
                'Airport transfer'
              )}
              required
            />
          </div>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
              {translateWithFallback(
                t,
                'hotelServicesPage.categoryLabel',
                'Category'
              )}
            </span>
            <NativeSelect
              value={formData.category}
              onChange={(event) =>
                setFormData((current) => ({ ...current, category: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {translateWithFallback(
                    t,
                    `hotelServicesPage.categories.${category.toLowerCase()}`,
                    category
                  )}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service-price" className="text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words">
            {translateWithFallback(t, 'price', 'Price')}
          </Label>
          <Input
            id="service-price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(event) =>
              setFormData((current) => ({ ...current, price: event.target.value }))
            }
            className="h-12 w-full min-w-0 rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-sm font-medium text-brand-ink transition focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-black/5"
            required
          />
        </div>

        <label className="flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-brand-surface-border bg-brand-surface-light px-4 py-4">
          <Checkbox
            checked={formData.active}
            onCheckedChange={(checked) =>
              setFormData((current) => ({ ...current, active: checked === true }))
            }
            className="h-4 w-4 rounded border-brand-surface-border"
          />
          <span className="text-sm font-medium text-brand-ink break-words">
            {translateWithFallback(
              t,
              'hotelServicesPage.activeToggle',
              'Service is available for billing'
            )}
          </span>
        </label>

        <div className="flex min-w-0 flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button variant="unstyled" size="none"
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-surface-border px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
          >
            {translateWithFallback(t, 'cancel', 'Cancel')}
          </Button>
          <Button variant="unstyled" size="none"
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:bg-brand-surface-border disabled:text-brand-ink-muted"
          >
            {saving
              ? translateWithFallback(t, 'saving', 'Saving...')
              : editing
                ? translateWithFallback(t, 'hotelServicesPage.updateAction', 'Save Service')
                : translateWithFallback(t, 'hotelServicesPage.createAction', 'Add Service')}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}

export default function HotelServices() {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm());
  const [serviceActionId, setServiceActionId] = useState(null);

  const loadServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError(extractServiceError(err));
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setFormError(null);
    setFormData(createEmptyForm());
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormError(null);
    setFormData({
      name: service.name ?? '',
      category: service.category ?? 'OTHER',
      price: service.price ?? '',
      active: Boolean(service.active),
    });
    setModalOpen(true);
  };

  const activeCount = useMemo(
    () => services.filter((service) => service.active).length,
    [services]
  );
  const inactiveCount = services.length - activeCount;
  const sortedServices = useMemo(
    () =>
      [...services].sort((left, right) =>
        String(left.name ?? '').localeCompare(String(right.name ?? ''), i18n.language, {
          sensitivity: 'base',
        })
      ),
    [i18n.language, services]
  );
  const averagePrice = useMemo(() => {
    if (services.length === 0) {
      return 0;
    }

    const total = services.reduce((sum, service) => sum + Number(service.price ?? 0), 0);
    return total / services.length;
  }, [services]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      price: Number(formData.price),
      active: Boolean(formData.active),
    };

    try {
      if (editingService) {
        const updated = await updateService(editingService.id, payload);
        setServices((current) =>
          current.map((service) => (service.id === editingService.id ? updated : service))
        );
      } else {
        const created = await createService(payload);
        setServices((current) => [...current, created]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(extractServiceError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service) => {
    const nextActive = !service.active;

    if (!nextActive && !window.confirm(
      translateWithFallback(
        t,
        'hotelServicesPage.deactivateConfirm',
        'Deactivate {{name}}? It will stay in the catalog but will not be available for new service charges.',
        { name: service.name }
      )
    )) {
      return;
    }

    setServiceActionId(service.id);
    setError(null);

    try {
      const updated = await setServiceActive(service, nextActive);
      setServices((current) =>
        current.map((item) => (item.id === service.id ? updated : item))
      );
    } catch (err) {
      setError(extractServiceError(err));
    } finally {
      setServiceActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(
          t,
          'hotelServicesPage.eyebrow',
          'Hotel service catalog'
        )}
        title={translateWithFallback(t, 'servicesTitle', 'Services')}
        description={translateWithFallback(
          t,
          'hotelServicesPage.description',
          'Manage food, cleaning, and auxiliary services that can be attached to guest billing.'
        )}
        meta={[
          translateWithFallback(
            t,
            'hotelServicesPage.metaTotal',
            '{{count}} services configured',
            { count: services.length }
          ),
          translateWithFallback(
            t,
            'hotelServicesPage.metaActive',
            '{{count}} active',
            { count: activeCount }
          ),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">
            {translateWithFallback(
              t,
              'hotelServicesPage.workspaceTitle',
              'Catalog snapshot'
            )}
          </p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {translateWithFallback(t, 'hotelServicesPage.activeLabel', 'Active')}
              </p>
              <p className="mt-2 text-3xl font-black break-words">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55 break-words">
                {translateWithFallback(t, 'hotelServicesPage.averagePriceLabel', 'Average price')}
              </p>
              <p className="mt-2 text-3xl font-black break-words">
                {formatLocalizedCurrency(averagePrice, i18n.language)}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={BriefcaseBusiness}
          label={translateWithFallback(t, 'hotelServicesPage.metrics.totalLabel', 'Total Services')}
          value={formatLocalizedNumber(services.length, i18n.language)}
          hint={translateWithFallback(
            t,
            'hotelServicesPage.metrics.totalHint',
            'All guest-facing service catalog entries.'
          )}
        />
        <DashboardMetricCard
          icon={Plus}
          label={translateWithFallback(t, 'hotelServicesPage.metrics.activeLabel', 'Active Services')}
          value={formatLocalizedNumber(activeCount, i18n.language)}
          hint={translateWithFallback(
            t,
            'hotelServicesPage.metrics.activeHint',
            'Services currently available for billing.'
          )}
        />
        <DashboardMetricCard
          icon={PowerOff}
          label={translateWithFallback(t, 'hotelServicesPage.metrics.inactiveLabel', 'Inactive Services')}
          value={formatLocalizedNumber(inactiveCount, i18n.language)}
          hint={translateWithFallback(
            t,
            'hotelServicesPage.metrics.inactiveHint',
            'Catalog entries currently unavailable to staff.'
          )}
        />
        <DashboardMetricCard
          icon={BriefcaseBusiness}
          label={translateWithFallback(t, 'hotelServicesPage.metrics.averagePriceLabel', 'Average Price')}
          value={formatLocalizedCurrency(averagePrice, i18n.language)}
          hint={translateWithFallback(
            t,
            'hotelServicesPage.metrics.averagePriceHint',
            'Average service price across the active catalog.'
          )}
          tone="light"
        />
      </div>

      <DashboardPanel
        title={translateWithFallback(t, 'hotelServicesPage.catalogTitle', 'Service Catalog')}
        description={translateWithFallback(
          t,
          'hotelServicesPage.catalogDescription',
          'Create, edit, and deactivate hotel services without leaving the admin surface.'
        )}
        action={
          <Button variant="unstyled" size="none"
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-w-0 h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-5 text-sm font-bold text-white transition hover:bg-brand-primary-deep"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {translateWithFallback(t, 'hotelServicesPage.createAction', 'Add Service')}
          </Button>
        }
      >
        {loading ? (
          <LoadingState
            message={translateWithFallback(
              t,
              'hotelServicesPage.loading',
              'Loading hotel services...'
            )}
          />
        ) : error ? (
          <ErrorState
            title={translateWithFallback(t, 'hotelServicesPage.catalogTitle', 'Service Catalog')}
            message={error}
            onRetry={loadServices}
          />
        ) : services.length === 0 ? (
          <EmptyState
            title={translateWithFallback(
              t,
              'hotelServicesPage.emptyTitle',
              'No services configured'
            )}
            message={translateWithFallback(
              t,
              'hotelServicesPage.emptyDescription',
              'Add hotel services before staff start posting service charges.'
            )}
            icon={BriefcaseBusiness}
          />
        ) : (
          <div className="space-y-3">
            {sortedServices.map((service) => (
              <div
                key={service.id}
                className="rounded-[1.35rem] border border-brand-surface-border bg-brand-surface-light p-4"
              >
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-black tracking-tight text-brand-ink break-words">
                      {service.name}
                    </p>
                    <p className="mt-1 text-sm font-medium text-brand-ink-muted break-words">
                      {translateWithFallback(
                        t,
                        `hotelServicesPage.categories.${String(service.category || 'OTHER').toLowerCase()}`,
                        service.category || 'OTHER'
                      )}
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                        service.active
                          ? 'border-brand-success/30 bg-brand-success/10 text-brand-success'
                          : 'border-brand-surface-border bg-white text-brand-ink-muted'
                      }`}
                    >
                      {service.active
                        ? translateWithFallback(t, 'hotelServicesPage.availableLabel', 'Active')
                        : translateWithFallback(t, 'hotelServicesPage.unavailableLabel', 'Inactive')}
                    </span>
                    <span className="rounded-full border border-brand-surface-border bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-ink break-words">
                      {formatLocalizedCurrency(service.price, i18n.language)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                  <Button variant="unstyled" size="none"
                    type="button"
                    onClick={() => openEditModal(service)}
                    className="inline-flex min-w-0 items-center gap-2 rounded-full border border-brand-surface-border bg-white px-4 py-2 text-sm font-bold text-brand-ink transition hover:bg-brand-surface-light"
                  >
                    <Pencil className="h-4 w-4 shrink-0" />
                    {translateWithFallback(t, 'hotelServicesPage.editAction', 'Edit Service')}
                  </Button>
                  <Button variant="unstyled" size="none"
                    type="button"
                    onClick={() => handleToggleActive(service)}
                    disabled={serviceActionId === service.id}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      service.active
                        ? 'border-brand-warning/30 bg-brand-warning/10 text-brand-warning hover:border-brand-warning/40 hover:bg-brand-warning/15'
                        : 'border-brand-success/30 bg-brand-success/10 text-brand-success hover:border-brand-success/40 hover:bg-brand-success/15'
                    }`}
                  >
                    {service.active ? <PowerOff className="h-4 w-4 shrink-0" /> : <Power className="h-4 w-4 shrink-0" />}
                    {service.active
                      ? translateWithFallback(t, 'hotelServicesPage.deactivateAction', 'Deactivate')
                      : translateWithFallback(t, 'hotelServicesPage.activateAction', 'Activate')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      {modalOpen ? (
        <ServiceModal
          formData={formData}
          setFormData={setFormData}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          saving={saving}
          error={formError}
          editing={Boolean(editingService)}
          t={t}
        />
      ) : null}
    </div>
  );
}
