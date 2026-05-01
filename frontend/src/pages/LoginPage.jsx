import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Loader2,
  Mail,
  ShieldCheck,
  Users,
  Zap,
  BedDouble,
  CalendarClock,
  BarChart3,
  LogIn,
  CheckCircle2,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SUPPORT_EMAIL = 'info@roomify.com';
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=Roomify%20Access%20Support`;
const showDemoCredentials = import.meta.env?.MODE === 'development';

/* ─── Mock stats for the visual panel ─── */
const PANEL_STATS = [
  { label: 'Rooms managed', value: '120+', icon: BedDouble },
  { label: 'Daily check-ins', value: '35', icon: CalendarClock },
  { label: 'Occupancy rate', value: '72%', icon: BarChart3 },
];

const PANEL_FEATURES = [
  { icon: ShieldCheck, text: 'Role-based dashboards for every team member' },
  { icon: Zap, text: 'Real-time room and reservation status' },
  { icon: Users, text: 'Staff, manager, and guest portals' },
  { icon: CalendarClock, text: 'Full reservation lifecycle management' },
];

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@roomify.com', color: 'bg-violet-100 text-violet-700' },
  { role: 'Manager', email: 'manager@roomify.com', color: 'bg-blue-100 text-blue-700' },
  { role: 'Staff', email: 'staff@roomify.com', color: 'bg-emerald-100 text-emerald-700' },
  { role: 'Guest', email: 'demo.guest@roomify.dev', color: 'bg-amber-100 text-amber-700' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const brandName = t('brandName');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const nextErrors = { email: '', password: '' };
    let valid = true;

    if (!formData.email) {
      nextErrors.email = t('emailRequired');
      valid = false;
    } else if (!emailRegex.test(formData.email)) {
      nextErrors.email = t('invalidEmail');
      valid = false;
    }

    if (!formData.password) {
      nextErrors.password = t('passwordRequired');
      valid = false;
    }

    setErrors(nextErrors);
    return valid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const user = await login(formData.email, formData.password);
      const from = location.state?.from?.pathname;

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : '';

      switch (primaryRole) {
        case 'ROLE_ADMIN':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'ROLE_MANAGER':
          navigate('/manager/dashboard', { replace: true });
          break;
        case 'ROLE_STAFF':
          navigate('/staff/dashboard', { replace: true });
          break;
        case 'ROLE_GUEST':
          navigate('/guest/dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    } catch (error) {
      setLoginError(
        i18n.language?.startsWith('ar')
          ? t('loginFailedDefault')
          : (error.message || t('loginFailedDefault'))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (email) => {
    setFormData({ email, password: 'password123' });
    setErrors({ email: '', password: '' });
    setLoginError('');
  };

  return (
    <div className="flex min-h-screen items-stretch -mt-16 overflow-y-auto pt-16 font-sans">

      {/* ══════════════════════════════════════════════
          LEFT PANEL — PMS Visual Showcase (desktop)
         ══════════════════════════════════════════════ */}
      <div className="relative hidden overflow-hidden lg:flex lg:min-h-[calc(100vh-4rem)] lg:w-[46%] lg:flex-col lg:justify-between xl:w-[48%]">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-900/30 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
          {/* Top — Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-black tracking-tight text-white">{brandName}</span>
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-100">
                PMS
              </span>
            </div>
          </div>

          {/* Center — Value prop */}
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">
              {t('hotelManagementSystem')}
            </p>
            <h1 className="mb-4 text-[2.1rem] font-extrabold leading-[1.15] tracking-tight text-white xl:text-[2.4rem]">
              {t('manageYourProperty')}
              <br />
              <span className="text-blue-200">{t('withConfidence')}</span>
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-blue-100/80">
              {t('loginDescription')}
            </p>

            {/* Stat chips */}
            <div className="mt-7 flex flex-wrap gap-3">
              {PANEL_STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/10 px-3.5 py-2 backdrop-blur-sm"
                  >
                    <Icon className="h-4 w-4 text-blue-200" />
                    <div>
                      <p className="text-sm font-bold text-white">{s.value}</p>
                      <p className="text-[10px] text-blue-200">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom — Feature list */}
          <div>
            <div className="space-y-3">
              {PANEL_FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white/10">
                    <Icon className="h-3.5 w-3.5 text-blue-200" />
                  </div>
                  <span className="text-[13px] font-medium text-blue-100/90">{text}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[11px] font-medium text-blue-300/50">
              {t('copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — Login Form
         ══════════════════════════════════════════════ */}
      <div className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center bg-slate-50 px-5 py-8 sm:px-8 lg:px-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
            <span className="text-2xl font-black tracking-tight text-slate-900">{brandName}</span>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
              PMS
            </span>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-6">
              <h2 className="mb-1 text-xl font-extrabold tracking-tight text-slate-900" role="heading" aria-level="1">
                {t('signInToAccount')}
              </h2>
              <p className="text-sm text-slate-500">
                {t('enterCredentials')}
              </p>
            </div>

            {/* Error alert */}
            {loginError && (
              <Alert variant="destructive" className="mb-4 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('authFailed')}</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  {t('emailAddress')}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('loginEmailPlaceholder')}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 rounded-lg border bg-white px-3.5 text-sm transition ${errors.email ? 'border-red-400 focus-visible:ring-red-200' : 'border-slate-200 focus-visible:ring-blue-200 focus-visible:border-blue-400'}`}
                />
                {errors.email && (
                  <p className="ps-1 text-xs font-medium text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    {t('password')}
                  </Label>
                  <a
                    href={SUPPORT_LINK}
                    className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
                  >
                    {t('contactSupport')}
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 rounded-lg border bg-white px-3.5 text-sm transition ${errors.password ? 'border-red-400 focus-visible:ring-red-200' : 'border-slate-200 focus-visible:ring-blue-200 focus-visible:border-blue-400'}`}
                />
                {errors.password && (
                  <p className="ps-1 text-xs font-medium text-red-500">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="mt-2 h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" role="status" aria-label={t('loadingLabel')} />
                    {t('signingIn')}
                  </>
                ) : (
                  <>
                    <LogIn className="me-2 h-4 w-4" />
                    {t('signIn')}
                  </>
                )}
              </Button>
            </form>

            {/* ── Demo Credentials (dev only) ── */}
            {showDemoCredentials && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Demo Accounts</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemoCredentials(acc.email)}
                      className="group flex flex-col items-start rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${acc.color}`}>
                        {acc.role}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 group-hover:text-blue-600 transition" dir="ltr">
                        {acc.email}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-center text-[10px] text-slate-400" dir="ltr">
                  Password for all: <span className="font-mono font-semibold text-slate-500">password123</span>
                </p>
              </div>
            )}

            {/* ── Support Card ── */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{t('loginSupportTitle')}</p>
                  <p className="text-[11px] text-slate-500">{t('loginSupportDescription')}</p>
                </div>
                <a
                  href={SUPPORT_LINK}
                  className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Contact
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
