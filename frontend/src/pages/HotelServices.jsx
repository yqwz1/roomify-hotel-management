import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BriefcaseBusiness,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import ModalFrame from '../components/common/ModalFrame';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import {
  createService,
  deleteService,
  extractServiceError,
  getServices,
  updateService,
} from '../services/serviceService';
import {
  formatLocalizedCurrency,
  formatLocalizedNumber,
  translateWithFallback,
} from '../utils/localization';

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
          : translateWithFallback(t, 'hotelServicesPage.createTitle', 'Create Service')
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
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              {translateWithFallback(t, 'nameLabel', 'Name')}
            </span>
            <input
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, name: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder={translateWithFallback(
                t,
                'hotelServicesPage.namePlaceholder',
                'Airport transfer'
              )}
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
              {translateWithFallback(
                t,
                'hotelServicesPage.categoryLabel',
                'Category'
              )}
            </span>
            <select
              value={formData.category}
              onChange={(event) =>
                setFormData((current) => ({ ...current, category: event.target.value }))
              }
              className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
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
            </select>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            {translateWithFallback(t, 'price', 'Price')}
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(event) =>
              setFormData((current) => ({ ...current, price: event.target.value }))
            }
            className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5"
            required
          />
        </label>

        <label className="flex items-center gap-3 rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
          <Checkbox
            checked={formData.active}
            onCheckedChange={(checked) =>
              setFormData((current) => ({ ...current, active: checked === true }))
            }
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm font-medium text-zinc-700">
            {translateWithFallback(
              t,
              'hotelServicesPage.activeToggle',
              'Service is available for booking'
            )}
          </span>
        </label>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
          >
            {translateWithFallback(t, 'cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {saving
              ? translateWithFallback(t, 'saving', 'Saving...')
              : editing
                ? translateWithFallback(t, 'hotelServicesPage.updateAction', 'Update Service')
                : translateWithFallback(t, 'hotelServicesPage.createAction', 'Create Service')}
          </button>
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

  const handleDelete = async (service) => {
    if (
      !window.confirm(
        translateWithFallback(
          t,
          'hotelServicesPage.deleteConfirm',
          'Delete {{name}} from the hotel services catalog?',
          { name: service.name }
        )
      )
    ) {
      return;
    }

    try {
      await deleteService(service.id);
      setServices((current) => current.filter((item) => item.id !== service.id));
    } catch (err) {
      setError(extractServiceError(err));
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
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {translateWithFallback(
              t,
              'hotelServicesPage.workspaceTitle',
              'Catalog snapshot'
            )}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {translateWithFallback(t, 'hotelServicesPage.activeLabel', 'Active')}
              </p>
              <p className="mt-2 text-3xl font-black">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {translateWithFallback(t, 'hotelServicesPage.averagePriceLabel', 'Average price')}
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatLocalizedCurrency(averagePrice, i18n.language)}
              </p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          icon={Trash2}
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
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            {translateWithFallback(t, 'hotelServicesPage.createAction', 'Create Service')}
          </button>
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
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-black tracking-tight text-zinc-950">
                      {service.name}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {translateWithFallback(
                        t,
                        `hotelServicesPage.categories.${String(service.category || 'OTHER').toLowerCase()}`,
                        service.category || 'OTHER'
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                        service.active
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-zinc-200 bg-white text-zinc-600'
                      }`}
                    >
                      {service.active
                        ? translateWithFallback(t, 'hotelServicesPage.availableLabel', 'Active')
                        : translateWithFallback(t, 'hotelServicesPage.unavailableLabel', 'Inactive')}
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-700">
                      {formatLocalizedCurrency(service.price, i18n.language)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(service)}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Pencil className="h-4 w-4" />
                    {translateWithFallback(t, 'editStaff', 'Edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(service)}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-900 transition hover:border-rose-300 hover:bg-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    {translateWithFallback(t, 'deleteRoomTitle', 'Delete')}
                  </button>
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
