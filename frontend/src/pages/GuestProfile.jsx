import { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DashboardHero from '../components/dashboard/DashboardHero';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../context/AuthProvider';
import {
  extractGuestReservationError,
  getGuestProfile,
  updateGuestProfile,
} from '../services/guestReservationService';
import { translateWithFallback } from '../utils/localization';

function ProfileField({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  type = 'text',
  readOnly = false,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400"
      >
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          id={id}
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
          className={`h-12 w-full rounded-full border px-11 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black/5 ${
            readOnly
              ? 'border-zinc-200 bg-zinc-100 text-zinc-500'
              : 'border-zinc-200 bg-zinc-50 text-zinc-950 focus:border-zinc-400 focus:bg-white'
          }`}
        />
      </div>
    </div>
  );
}

const EMPTY_PROFILE = {
  name: '',
  email: '',
  phone: '',
  idNumber: '',
  nationality: '',
};

export default function GuestProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getGuestProfile();
        if (ignore) return;
        setProfile({
          name: data?.name ?? '',
          email: data?.email ?? user?.email ?? '',
          phone: data?.phone ?? '',
          idNumber: data?.idNumber ?? '',
          nationality: data?.nationality ?? '',
        });
      } catch (err) {
        if (ignore) return;
        setError(extractGuestReservationError(err));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [reloadToken, user?.email]);

  const completenessLabel = useMemo(() => {
    const completedFields = ['name', 'phone', 'idNumber', 'nationality'].filter(
      (field) => String(profile[field] ?? '').trim().length > 0
    ).length;

    return `${completedFields}/4`;
  }, [profile]);

  const handleFieldChange = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setSuccessMessage('');
  };

  const handleRetry = () => {
    setReloadToken((current) => current + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        idNumber: profile.idNumber.trim(),
        nationality: profile.nationality.trim(),
      };

      const updated = await updateGuestProfile(payload);
      setProfile((current) => ({
        ...current,
        ...updated,
        email: updated?.email ?? current.email,
      }));
      setSuccessMessage(
        translateWithFallback(
          t,
          'guestProfilePage.saveSuccess',
          'Your guest profile has been updated.'
        )
      );
    } catch (err) {
      setError(extractGuestReservationError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <LoadingState
          message={translateWithFallback(t, 'guestProfilePage.loading', 'Loading profile...')}
        />
      </div>
    );
  }

  if (error && !profile.email && !profile.name && !profile.phone) {
    return (
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <ErrorState
          title={translateWithFallback(t, 'guestProfilePage.errorTitle', 'Profile unavailable')}
          message={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <DashboardHero
        eyebrow={translateWithFallback(t, 'guestProfilePage.eyebrow', 'Guest portal')}
        title={translateWithFallback(t, 'guestProfilePage.title', 'Guest Profile')}
        description={translateWithFallback(
          t,
          'guestProfilePage.description',
          'Keep your contact and identity details accurate so future bookings are faster and your stay records stay complete.'
        )}
        meta={[
          profile.email || user?.email || '-',
          translateWithFallback(
            t,
            'guestProfilePage.completenessMeta',
            'Profile completeness {{value}}',
            { value: completenessLabel }
          ),
        ]}
      >
        <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
            {translateWithFallback(t, 'guestProfilePage.heroCardTitle', 'Verified account')}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-black">{profile.name || user?.username || t('guestFallback')}</p>
              <p className="text-sm text-white/70">{profile.email || user?.email || '-'}</p>
            </div>
          </div>
        </div>
      </DashboardHero>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardPanel
          title={translateWithFallback(t, 'guestProfilePage.formTitle', 'Profile details')}
          description={translateWithFallback(
            t,
            'guestProfilePage.formDescription',
            'These details are reused when you create new bookings from the guest portal.'
          )}
        >
          {error ? (
            <div className="mb-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-5 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
              {successMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <ProfileField
              id="guest-profile-name"
              label={translateWithFallback(t, 'fullName', 'Full name')}
              value={profile.name}
              onChange={(value) => handleFieldChange('name', value)}
              icon={UserRound}
            />
            <ProfileField
              id="guest-profile-email"
              label={translateWithFallback(t, 'emailAddress', 'Email address')}
              value={profile.email}
              icon={Mail}
              type="email"
              readOnly
            />
            <ProfileField
              id="guest-profile-phone"
              label={translateWithFallback(t, 'phoneNumber', 'Phone number')}
              value={profile.phone}
              onChange={(value) => handleFieldChange('phone', value)}
              icon={Phone}
            />
            <ProfileField
              id="guest-profile-id"
              label={translateWithFallback(t, 'idPassport', 'ID / Passport')}
              value={profile.idNumber}
              onChange={(value) => handleFieldChange('idNumber', value)}
              icon={ShieldCheck}
            />
            <ProfileField
              id="guest-profile-nationality"
              label={translateWithFallback(t, 'nationality', 'Nationality')}
              value={profile.nationality}
              onChange={(value) => handleFieldChange('nationality', value)}
              icon={UserRound}
            />

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              <Save className="h-4 w-4" />
              {saving
                ? translateWithFallback(t, 'saving', 'Saving...')
                : translateWithFallback(t, 'guestProfilePage.saveCta', 'Save profile')}
            </button>
          </form>
        </DashboardPanel>

        <DashboardPanel
          title={translateWithFallback(t, 'guestProfilePage.helpTitle', 'Why this matters')}
          description={translateWithFallback(
            t,
            'guestProfilePage.helpDescription',
            'A complete profile makes the guest journey look production-ready and keeps future reservations consistent.'
          )}
        >
          <div className="grid gap-3">
            {[
              translateWithFallback(
                t,
                'guestProfilePage.tipOne',
                'The portal can prefill booking creation instead of asking for everything from scratch every time.'
              ),
              translateWithFallback(
                t,
                'guestProfilePage.tipTwo',
                'Identity details stay linked to the guest account so staff and guest views feel connected.'
              ),
              translateWithFallback(
                t,
                'guestProfilePage.tipThree',
                'This makes the demo feel like a real hotel self-service area, not only an internal admin dashboard.'
              ),
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium leading-6 text-zinc-600"
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
