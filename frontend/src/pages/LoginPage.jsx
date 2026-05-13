import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  LogIn,
  ArrowRight,
  ChevronDown,
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

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@roomify.com', dot: 'bg-zinc-700' },
  { role: 'Manager', email: 'manager@roomify.com', dot: 'bg-zinc-500' },
  { role: 'Staff', email: 'staff@roomify.com', dot: 'bg-emerald-500' },
  { role: 'Guest', email: 'demo.guest@roomify.dev', dot: 'bg-amber-500' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const brandName = t('brandName');
  const reduceMotion = useReducedMotion();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (loginError) setLoginError('');
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
    <div className="relative isolate flex min-h-screen items-start justify-center overflow-hidden bg-[#f7f3ed] px-4 py-10 sm:px-6 sm:py-14 lg:py-20 -mt-16 pt-24 lg:pt-28 font-sans">
      {/* ── Ambient background ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* Soft conic glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_45%)]" />
        {/* Animated blobs */}
        <motion.div
          className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-amber-200/30 blur-3xl"
          animate={reduceMotion ? {} : { y: [0, 22, 0], x: [0, -14, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 -right-24 h-[420px] w-[420px] rounded-full bg-emerald-200/25 blur-3xl"
          animate={reduceMotion ? {} : { y: [0, -18, 0], x: [0, 14, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Subtle grid */}
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(24,24,27,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.04)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative w-full max-w-[440px]"
      >
        <div className="rounded-[2rem] border border-zinc-200/80 bg-white/95 p-8 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] ring-1 ring-zinc-900/5 backdrop-blur-xl sm:p-10">

          {/* Brand row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-zinc-950 text-xs font-black text-white shadow-sm">
                R
              </span>
              <span className="text-lg font-black tracking-tight text-zinc-950">{brandName}</span>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-zinc-500">
              PMS
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: EASE }}
            className="mt-8"
          >
            <h1 className="text-[1.7rem] font-black leading-tight tracking-tight text-zinc-950">
              {t('signInToAccount')}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-zinc-500">
              {t('enterCredentials')}
            </p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {loginError && (
              <motion.div
                key="login-error"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden"
              >
                <Alert variant="destructive" className="mt-5 rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('authFailed')}</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: EASE }}
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-bold uppercase tracking-wider text-zinc-500">
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
                dir="ltr"
                className={`h-12 rounded-xl border bg-zinc-50/60 px-4 text-sm font-medium transition-all duration-200 placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-zinc-200/60 ${errors.email ? 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-200/60' : 'border-zinc-200'}`}
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
                <Label htmlFor="password" className="text-[12px] font-bold uppercase tracking-wider text-zinc-500">
                  {t('password')}
                </Label>
                <a
                  href={SUPPORT_LINK}
                  className="text-[11px] font-bold text-zinc-500 transition-colors hover:text-zinc-950"
                >
                  {t('contactSupport')}
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-12 rounded-xl border bg-zinc-50/60 px-4 pe-11 text-sm font-medium transition-all duration-200 focus-visible:border-zinc-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-zinc-200/60 ${errors.password ? 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-200/60' : 'border-zinc-200'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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

            <motion.div
              whileHover={reduceMotion || isLoading ? {} : { scale: 1.005 }}
              whileTap={isLoading ? {} : { scale: 0.99 }}
              className="pt-1"
            >
              <Button
                type="submit"
                className="group h-12 w-full rounded-full bg-zinc-950 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] transition-all hover:bg-zinc-800 hover:shadow-[0_18px_36px_-12px_rgba(0,0,0,0.45)] disabled:opacity-70"
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
                    <ArrowRight className="ms-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Demo accounts (dev only) */}
          {showDemoCredentials && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
              className="mt-6"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center">
                  <button
                    type="button"
                    onClick={() => setDemoOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-bold text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:text-zinc-950"
                  >
                    {demoOpen ? 'Hide demo accounts' : 'Try a demo account'}
                    <ChevronDown className={`h-3 w-3 transition-transform ${demoOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {demoOpen && (
                  <motion.div
                    key="demo-list"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
                      }}
                      className="mt-4 grid grid-cols-2 gap-2"
                    >
                      {DEMO_ACCOUNTS.map((acc) => (
                        <motion.button
                          key={acc.email}
                          type="button"
                          variants={{
                            hidden: { opacity: 0, y: 6 },
                            visible: { opacity: 1, y: 0 },
                          }}
                          transition={{ duration: 0.35, ease: EASE }}
                          whileHover={reduceMotion ? {} : { y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => fillDemoCredentials(acc.email)}
                          className="group flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-start transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
                        >
                          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${acc.dot}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-black text-zinc-900">{acc.role}</p>
                            <p
                              className="truncate text-[10px] font-medium text-zinc-500 group-hover:text-zinc-700"
                              dir="ltr"
                            >
                              {acc.email}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                    <p className="mt-2.5 text-center text-[10px] font-medium text-zinc-400" dir="ltr">
                      Password for all: <span className="font-mono font-bold text-zinc-600">password123</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-6 text-center text-[12px] font-medium text-zinc-500"
        >
          {t('loginSupportTitle')} ·{' '}
          <a href={SUPPORT_LINK} className="font-bold text-zinc-900 underline-offset-4 hover:underline">
            {t('contactSupport')}
          </a>
        </motion.p>

        <p className="mt-3 text-center text-[11px] font-medium text-zinc-400">
          {t('copyright', { year: new Date().getFullYear() })}
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
