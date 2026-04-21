import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BedDouble, CalendarClock, Receipt, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';
import { checkHealth } from '../services/healthService';
import { getHotelSettings } from '../services/hotelSettingsService';
import { useAuth } from '../context/AuthProvider';
import { getDefaultRouteForRoles } from '../components/navigation/navConfig';

const FEATURE_ICONS = {
  roomOps: BedDouble,
  reservations: CalendarClock,
  staff: Users,
  billing: Receipt,
};

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const brandName = t('brandName');
  const dashboardPath = getDefaultRouteForRoles(user?.roles ?? []);
  const dashboardLabel = user?.roles?.includes('ROLE_GUEST') ? t('myDashboard') : t('dashboard');
  const [health, setHealth] = useState(null);
  const [hotelSettings, setHotelSettings] = useState(null);
  const [statusFetchedAt, setStatusFetchedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const data = await checkHealth();
        if (!isMounted) {
          return;
        }

        setHealth(data);
        setStatusFetchedAt(data?.timestamp || Date.now());
      } catch {
        if (!isMounted) {
          return;
        }

        setHealth(null);
        setStatusFetchedAt(Date.now());
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const settings = await getHotelSettings();
        if (isMounted) {
          setHotelSettings(settings);
        }
      } catch {
        if (isMounted) {
          setHotelSettings(null);
        }
      }
    };

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const features = useMemo(
    () => [
      {
        id: 'roomOps',
        title: t('home.features.roomOpsTitle'),
        description: t('home.features.roomOpsDescription'),
      },
      {
        id: 'reservations',
        title: t('home.features.reservationsTitle'),
        description: t('home.features.reservationsDescription'),
      },
      {
        id: 'staff',
        title: t('home.features.staffTitle'),
        description: t('home.features.staffDescription'),
      },
      {
        id: 'billing',
        title: t('home.features.billingTitle'),
        description: t('home.features.billingDescription'),
      },
    ],
    [t]
  );

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <div className="flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="overflow-hidden rounded-[2rem] bg-black p-8 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)] sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
              {t('home.eyebrow')}
            </p>
            <p className="mt-6 font-heading text-5xl font-black tracking-tighter sm:text-6xl">
              {hotelSettings?.hotelName || brandName}
            </p>
            <h1 className="mt-6 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {t('home.title')}
            </h1>
            <p className="mt-6 max-w-xl text-base font-medium leading-7 text-zinc-400">
              {t('home.description')}
            </p>
            {hotelSettings?.contactPhone || hotelSettings?.contactEmail ? (
              <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-zinc-300">
                <p>{hotelSettings?.contactPhone || 'Phone unavailable'}</p>
                <p className="mt-1">{hotelSettings?.contactEmail || 'Email unavailable'}</p>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={isAuthenticated ? dashboardPath : '/login'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-zinc-100"
              >
                {isAuthenticated ? dashboardLabel : t('home.cta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/bookings"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                {t('home.secondary')}
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">
              {t('home.featureHeading')}
            </p>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
              {t('home.featureDescription')}
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = FEATURE_ICONS[feature.id];
                return (
                  <article
                    key={feature.id}
                    className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-5"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-black">{feature.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <Footer
        loading={loading}
        connectionState={health ? 'connected' : 'disconnected'}
        timestamp={statusFetchedAt}
      />
    </div>
  );
}
