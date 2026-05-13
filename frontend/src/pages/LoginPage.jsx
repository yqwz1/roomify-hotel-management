import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
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
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EASE } from '@/components/motion/Reveal';

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
  { role: 'Admin', email: 'admin@roomify.com', color: 'bg-zinc-100 text-zinc-800' },
  { role: 'Manager', email: 'manager@roomify.com', color: 'bg-zinc-100 text-zinc-800' },
  { role: 'Staff', email: 'staff@roomify.com', color: 'bg-emerald-50 text-emerald-800' },
  { role: 'Guest', email: 'demo.guest@roomify.dev', color: 'bg-amber-50 text-amber-800' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const brandName = t('brandName');
  const reduceMotion = useReducedMotion();

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

  // Stagger config for the left-panel content
  const leftStagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-screen items-stretch -mt-16 overflow-y-auto pt-16 font-sans">

      {/* ══════════════════════════════════════════════
          LEFT PANEL — PMS Visual Showcase (desktop)
         ══════════════════════════════════════════════ */}
      <div className="relative hidden overflow-hidden lg:flex lg:min-h-[calc(100vh-4rem)] lg:w-[46%] lg:flex-col lg:justify-between xl:w-[48%]">
        {/* Gradient background — using zinc/dark from dashboard hero */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#09090b_0%,#18181b_55%,#27272a_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(161,161,170,0.14),transparent_28%)]" />

        {/* Animated ambient orbs */}
        <motion.div
          aria-hidden="true"
          className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-white/[0.05] blur-3xl"
          animate={reduceMotion ? {} : { y: [0, 20, 0], x: [0, -16, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-24 -left-20 h-[360px] w-[360px] rounded-full bg-white/[0.04] blur-3xl"
          animate={reduceMotion ? {} : { y: [0, -18, 0], x: [0, 14, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12"
          initial="hidden"
          animate="visible"
          variants={leftStagger}
        >
          {/* Top — Brand */}
          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: EASE }}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-black tracking-tight text-white">{brandName}</span>
              <span className="rounded-full border border-white/12 bg-white/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 backdrop-blur">
                PMS
              </span>
            </div>
          </motion.div>

          {/* Center — Value prop */}
          <motion.div variants={fadeUp} transition={{ duration: 0.7, ease: EASE }}>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6, ease: EASE }}
              className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400"
            >
              {t('hotelManagementSystem')}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.8, ease: EASE }}
              className="mb-4 text-[2.1rem] font-black leading-[1.15] tracking-tight text-white xl:text-[2.4rem]"
            >
              {t('manageYourProperty')}
              <br />
              <span className="text-zinc-400">{t('withConfidence')}</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6, ease: EASE }}
              className="max-w-sm text-sm font-medium leading-relaxed text-zinc-400"
            >
              {t('loginDescription')}
            </motion.p>

            {/* Stat chips */}
            <motion.div
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
              }}
              className="mt-7 flex flex-wrap gap-3"
            >
              {PANEL_STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    variants={fadeUp}
                    transition={{ duration: 0.55, ease: EASE }}
                    whileHover={reduceMotion ? {} : { y: -3, scale: 1.03 }}
                    className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-sm transition-colors hover:bg-white/10"
                  >
                    <Icon className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="text-sm font-black text-white">{s.value}</p>
                      <p className="text-[10px] font-medium text-zinc-500">{s.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Bottom — Feature list */}
          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: EASE }}>
            <motion.div
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
              }}
              className="space-y-3"
            >
              {PANEL_FEATURES.map(({ icon: Icon, text }) => (
                <motion.div
                  key={text}
                  variants={{
                    hidden: { opacity: 0, x: -12 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="group flex items-center gap-3"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors group-hover:bg-white/15">
                    <Icon className="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-white" />
                  </div>
                  <span className="text-[13px] font-medium text-zinc-300">{text}</span>
                </motion.div>
              ))}
            </motion.div>
            <p className="mt-6 text-[11px] font-bold text-zinc-600">
              {t('copyright', { year: new Date().getFullYear() })}
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — Login Form
         ══════════════════════════════════════════════ */}
      <div className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center bg-[#f7f3ed] px-5 py-8 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile brand */}
          <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
            <span className="text-2xl font-black tracking-tight text-zinc-950">{brandName}</span>
            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
              PMS
            </span>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
            }}
          >
            {/* Header */}
            <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: EASE }} className="mb-6">
              <h2 className="mb-1 text-xl font-black tracking-tight text-zinc-950" role="heading" aria-level="1">
                {t('signInToAccount')}
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                {t('enterCredentials')}
              </p>
            </motion.div>

            {/* Error alert */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <Alert variant="destructive" className="mb-4 rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('authFailed')}</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* ── Form ── */}
            <motion.form
              variants={fadeUp}
              transition={{ duration: 0.55, ease: EASE }}
              onSubmit={handleSubmit}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-bold text-zinc-700">
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
                  className={`h-11 rounded-xl border bg-white px-3.5 text-sm transition-all duration-200 focus-visible:scale-[1.005] ${errors.email ? 'border-red-400 focus-visible:ring-red-200' : 'border-zinc-200 focus-visible:ring-zinc-300 focus-visible:border-zinc-400'}`}
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="ps-1 text-xs font-semibold text-red-500"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-bold text-zinc-700">
                    {t('password')}
                  </Label>
                  <a
                    href={SUPPORT_LINK}
                    className="text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-950"
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
                  className={`h-11 rounded-xl border bg-white px-3.5 text-sm transition-all duration-200 focus-visible:scale-[1.005] ${errors.password ? 'border-red-400 focus-visible:ring-red-200' : 'border-zinc-200 focus-visible:ring-zinc-300 focus-visible:border-zinc-400'}`}
                />
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="ps-1 text-xs font-semibold text-red-500"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              <motion.div whileHover={reduceMotion || isLoading ? {} : { scale: 1.01 }} whileTap={isLoading ? {} : { scale: 0.99 }}>
                <Button
                  type="submit"
                  className="mt-2 h-11 w-full rounded-full bg-zinc-950 text-sm font-bold text-white shadow-lg shadow-zinc-950/20 transition-all hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-950/25"
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
              </motion.div>
            </motion.form>

            {/* ── Demo Credentials (dev only) ── */}
            {showDemoCredentials && (
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.55, ease: EASE }}
                className="mt-5 rounded-[1.35rem] border border-zinc-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-zinc-100">
                    <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Demo Accounts</p>
                </div>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.4 } },
                  }}
                  className="grid grid-cols-2 gap-2"
                >
                  {DEMO_ACCOUNTS.map((acc) => (
                    <motion.button
                      key={acc.email}
                      variants={{
                        hidden: { opacity: 0, scale: 0.94 },
                        visible: { opacity: 1, scale: 1 },
                      }}
                      transition={{ duration: 0.4, ease: EASE }}
                      whileHover={reduceMotion ? {} : { y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => fillDemoCredentials(acc.email)}
                      className="group flex flex-col items-start rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 py-2 text-left transition hover:border-zinc-300 hover:bg-white hover:shadow-sm"
                    >
                      <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${acc.color}`}>
                        {acc.role}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-zinc-950 transition" dir="ltr">
                        {acc.email}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
                <p className="mt-2 text-center text-[10px] text-zinc-400" dir="ltr">
                  Password for all: <span className="font-mono font-bold text-zinc-600">password123</span>
                </p>
              </motion.div>
            )}

            {/* ── Support Card ── */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: EASE }}
              whileHover={reduceMotion ? {} : { y: -2 }}
              className="mt-4 rounded-[1.35rem] border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900">{t('loginSupportTitle')}</p>
                  <p className="text-[11px] font-medium text-zinc-500">{t('loginSupportDescription')}</p>
                </div>
                <a
                  href={SUPPORT_LINK}
                  className="group flex-shrink-0 inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                >
                  Contact
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
