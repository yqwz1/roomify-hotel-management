import { useEffect, useMemo, useState } from 'react';
import { Building2, Mail, MapPin, Palette, Phone, Receipt, TimerReset } from 'lucide-react';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import ConfirmationToast from '../components/ConfirmationToast';
import {
  extractHotelSettingsError,
  getHotelSettings,
  updateHotelSettings,
} from '../services/hotelSettingsService';

const DEFAULT_FORM = {
  hotelName: '',
  logoUrl: '',
  primaryColor: '#18181b',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  checkInTime: '15:00',
  checkOutTime: '12:00',
  currencyCode: 'SAR',
  taxRate: '0.15',
  vatLabel: 'VAT',
  cancellationPolicy: '',
  invoiceFooter: '',
  invoicePrefix: 'INV',
};

function Field({ label, children, hint }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">{label}</span>
      {children}
      {hint ? <p className="text-xs font-medium text-zinc-500">{hint}</p> : null}
    </label>
  );
}

const inputClassName =
  'h-12 w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';
const textAreaClassName =
  'min-h-28 w-full rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-950 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5';

export default function HotelSettings() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const settings = await getHotelSettings();
        if (ignore) return;
        setForm({
          hotelName: settings.hotelName || '',
          logoUrl: settings.logoUrl || '',
          primaryColor: settings.primaryColor || '#18181b',
          contactEmail: settings.contactEmail || '',
          contactPhone: settings.contactPhone || '',
          contactAddress: settings.contactAddress || '',
          checkInTime: settings.checkInTime || '15:00',
          checkOutTime: settings.checkOutTime || '12:00',
          currencyCode: settings.currencyCode || 'SAR',
          taxRate: String(settings.taxRate ?? '0.15'),
          vatLabel: settings.vatLabel || 'VAT',
          cancellationPolicy: settings.cancellationPolicy || '',
          invoiceFooter: settings.invoiceFooter || '',
          invoicePrefix: settings.invoicePrefix || 'INV',
        });
      } catch (err) {
        if (!ignore) {
          setError(extractHotelSettingsError(err));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const previewStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${form.primaryColor || '#18181b'} 0%, #111827 100%)`,
    }),
    [form.primaryColor]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        taxRate: Number(form.taxRate),
      };
      const saved = await updateHotelSettings(payload);
      setForm((current) => ({
        ...current,
        taxRate: String(saved.taxRate ?? current.taxRate),
      }));
      setToast({ message: 'Hotel settings saved successfully.', type: 'success' });
    } catch (err) {
      setError(extractHotelSettingsError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingState message="Loading hotel settings..." />
      </div>
    );
  }

  if (error && !form.hotelName) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState title="Hotel settings unavailable" message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <ConfirmationToast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <DashboardHero
        eyebrow="Hotel Configuration"
        title="Hotel Settings"
        description="Customize the current hotel instance so the system looks and behaves like a real property, not a generic demo."
        meta={[
          form.hotelName || 'Hotel name pending',
          `Check-in ${form.checkInTime || '--:--'}`,
          `Check-out ${form.checkOutTime || '--:--'}`,
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            Brand Snapshot
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Currency</p>
              <p className="mt-2 text-lg font-black">{form.currencyCode || 'SAR'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Tax Rate</p>
              <p className="mt-2 text-lg font-black">{`${Math.round(Number(form.taxRate || 0) * 100)}%`}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      {error ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DashboardPanel
            title="Branding"
            description="Set the identity the manager wants guests and staff to see."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hotel Name">
                <input
                  value={form.hotelName}
                  onChange={(event) => handleChange('hotelName', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Primary Color" hint="Hex color used for the hotel preview.">
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(event) => handleChange('primaryColor', event.target.value)}
                    className="h-12 w-16 rounded-full border border-zinc-200 bg-white px-2"
                  />
                  <input
                    value={form.primaryColor}
                    onChange={(event) => handleChange('primaryColor', event.target.value)}
                    className={inputClassName}
                  />
                </div>
              </Field>
              <Field label="Logo URL" hint="Use a hosted image URL for the graduation demo.">
                <input
                  value={form.logoUrl}
                  onChange={(event) => handleChange('logoUrl', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Invoice Prefix" hint="Used when new invoice numbers are generated.">
                <input
                  value={form.invoicePrefix}
                  onChange={(event) => handleChange('invoicePrefix', event.target.value.toUpperCase())}
                  className={inputClassName}
                />
              </Field>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Contact And Policies"
            description="Give the hotel a credible identity and guest-facing rules."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Contact Email">
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => handleChange('contactEmail', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Contact Phone">
                <input
                  value={form.contactPhone}
                  onChange={(event) => handleChange('contactPhone', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Address">
                  <textarea
                    value={form.contactAddress}
                    onChange={(event) => handleChange('contactAddress', event.target.value)}
                    className={textAreaClassName}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Cancellation Policy">
                  <textarea
                    value={form.cancellationPolicy}
                    onChange={(event) => handleChange('cancellationPolicy', event.target.value)}
                    className={textAreaClassName}
                  />
                </Field>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Operations And Billing"
            description="Store property-level stay rules and invoice defaults."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Check-In Time">
                <input
                  type="time"
                  value={form.checkInTime}
                  onChange={(event) => handleChange('checkInTime', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Check-Out Time">
                <input
                  type="time"
                  value={form.checkOutTime}
                  onChange={(event) => handleChange('checkOutTime', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Currency Code">
                <input
                  value={form.currencyCode}
                  onChange={(event) => handleChange('currencyCode', event.target.value.toUpperCase())}
                  className={inputClassName}
                />
              </Field>
              <Field label="Tax Rate" hint="Stored as a decimal, for example 0.15 for 15%.">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(event) => handleChange('taxRate', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Tax Label">
                <input
                  value={form.vatLabel}
                  onChange={(event) => handleChange('vatLabel', event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Invoice Footer Note">
                  <textarea
                    value={form.invoiceFooter}
                    onChange={(event) => handleChange('invoiceFooter', event.target.value)}
                    className={textAreaClassName}
                  />
                </Field>
              </div>
            </div>
          </DashboardPanel>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-14 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {saving ? 'Saving Hotel Settings...' : 'Save Hotel Settings'}
          </button>
        </form>

        <div className="space-y-6">
          <DashboardPanel
            title="Live Preview"
            description="A simple manager-side preview of how this property will look."
          >
            <div className="overflow-hidden rounded-[1.8rem] shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]" style={previewStyle}>
              <div className="p-6 text-white">
                <div className="flex items-center gap-4">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt={form.hotelName}
                      className="h-14 w-14 rounded-2xl border border-white/20 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-950">
                      <Building2 className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">Configured Property</p>
                    <p className="truncate text-2xl font-black">{form.hotelName || 'Hotel Name'}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {[
                    { icon: Mail, label: form.contactEmail || 'No email configured' },
                    { icon: Phone, label: form.contactPhone || 'No phone configured' },
                    { icon: MapPin, label: form.contactAddress || 'No address configured' },
                    { icon: TimerReset, label: `Check-in ${form.checkInTime || '--:--'} • Check-out ${form.checkOutTime || '--:--'}` },
                    { icon: Receipt, label: `${form.currencyCode || 'SAR'} • ${form.vatLabel || 'VAT'} ${Math.round(Number(form.taxRate || 0) * 100)}%` },
                    { icon: Palette, label: `Primary color ${form.primaryColor || '#18181b'}` },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <Icon className="h-4 w-4 text-white/70" />
                        <p className="text-sm font-medium text-white">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Why This Helps"
            description="These settings make the demo feel like a configurable hotel product."
          >
            <div className="grid gap-3">
              {[
                'Branding and contact details make the system feel like one real property, not a generic template.',
                'Check-in, check-out, tax, and invoice defaults make the hotel settings operational, not cosmetic only.',
                'Managers can now present a specific hotel identity before you add more advanced modules.',
              ].map((item) => (
                <div key={item} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium leading-6 text-zinc-600">
                  {item}
                </div>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
