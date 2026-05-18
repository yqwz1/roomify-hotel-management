import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { canAccessPathForRoles, getDefaultRouteForRoles } from '../components/navigation/navConfig';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EASE } from '@/components/motion/Reveal';

const SUPPORT_EMAIL = 'info@roomify.com';
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=Roomify%20Access%20Support`;
const showDemoCredentials = import.meta.env?.MODE === 'development';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@roomify.com' },
  { role: 'Manager', email: 'manager@roomify.com' },
  { role: 'Staff', email: 'staff@roomify.com' },
  { role: 'Guest', email: 'demo.guest@roomify.dev' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const brandName = t('brandName');
  const reduceMotion = useReducedMotion();
  const isAr = i18n.language?.startsWith('ar');

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [focused, setFocused] = useState(null);

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
      const userRoles = user.roles ?? [];
      const canReturnToFrom =
        Boolean(from) &&
        from !== '/login' &&
        from !== '/unauthorized' &&
        canAccessPathForRoles(from, userRoles);

      if (canReturnToFrom) {
        navigate(from, { replace: true });
        return;
      }
      // Route by the user's HIGHEST-priority role (admin > manager > staff > guest)
      // so a multi-role admin lands on /admin/dashboard, not /manager/dashboard,
      // regardless of the order the backend returns roles in.
      navigate(getDefaultRouteForRoles(userRoles), { replace: true });
    } catch (error) {
      setLoginError(
        isAr ? t('loginFailedDefault') : (error.message || t('loginFailedDefault'))
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

  const headline = isAr ? 'أهلاً بعودتك.' : 'Welcome back.';
  const subline = isAr ? 'سجّل دخولك لإدارة فندقك.' : 'Sign in to manage your hotel.';

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-surface px-5 py-16 sm:px-8 sm:py-20 font-sans"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Minimal top bar — back link + language. No nav, no marketing chrome. */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.2em] text-brand-ink-muted transition-colors hover:text-brand-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
          {isAr ? 'العودة' : 'Back to site'}
        </Link>
        <LanguageSwitcher />
      </div>
      {/* ── Brand sunrise — concentric arcs from the logo, blown up to page scale ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Soft warm wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,rgba(53,101,141,0.14),transparent_55%),radial-gradient(ellipse_at_top,rgba(212,162,76,0.05),transparent_60%)]" />

        {/* Giant sunrise — CSS mask fades the arcs into the page */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: EASE }}
          className="absolute -bottom-4 left-1/2 h-[min(85vh,960px)] w-[min(170vw,2000px)] -translate-x-1/2 [mask-image:radial-gradient(ellipse_at_center_bottom,black_22%,rgba(0,0,0,0.55)_50%,transparent_78%)] [-webkit-mask-image:radial-gradient(ellipse_at_center_bottom,black_22%,rgba(0,0,0,0.55)_50%,transparent_78%)]"
        >
          <svg
            viewBox="0 0 1200 700"
            preserveAspectRatio="xMidYMax meet"
            className="h-full w-full"
          >
            <g fill="none" stroke="#264B6B" strokeWidth="2.4" opacity="0.32">
              <circle cx="600" cy="700" r="640" />
              <circle cx="600" cy="700" r="560" />
              <circle cx="600" cy="700" r="480" />
              <circle cx="600" cy="700" r="400" />
              <circle cx="600" cy="700" r="320" />
              <circle cx="600" cy="700" r="240" />
              <circle cx="600" cy="700" r="160" />
              <circle cx="600" cy="700" r="80" />
            </g>
            <circle cx="600" cy="700" r="10" fill="#264B6B" opacity="0.35" />
          </svg>
        </motion.div>

        {/* Cream fade at the very bottom so arcs dissolve into the surface */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-surface via-brand-surface/60 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {/* Brand mark — solo, sized as the page's only brand moment */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-10"
        >
          <img
            src="/roomify-mark.png"
            alt={brandName}
            className="h-12 w-auto select-none"
            draggable={false}
          />
        </motion.div>

        {/* Editorial headline */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          className="font-heading text-[2.6rem] leading-[1.04] tracking-tight text-brand-ink sm:text-[2.85rem]"
        >
          {headline}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.14, ease: EASE }}
          className="mt-3 text-[15.5px] font-medium text-brand-ink-muted"
        >
          {subline}
        </motion.p>

        {/* Error */}
        <AnimatePresence>
          {loginError && (
            <motion.div
              key="login-error"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden"
            >
              <Alert
                variant="destructive"
                className="mt-7 rounded-xl border-brand-danger/20 bg-brand-danger/[0.04] text-brand-danger"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-black">{t('authFailed')}</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form — underline inputs (editorial) */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
          onSubmit={handleSubmit}
          className="mt-10 space-y-7"
          noValidate
        >
          {/* Email */}
          <div className="relative">
            <Label
              htmlFor="email"
              className={`absolute -top-2 start-0 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${errors.email
                  ? 'text-brand-danger'
                  : focused === 'email'
                    ? 'text-brand-primary'
                    : 'text-brand-ink-hint'
                }`}
            >
              {t('emailAddress')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t('loginEmailPlaceholder')}
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              disabled={isLoading}
              dir="ltr"
              className={`h-11 rounded-none border-0 border-b bg-transparent px-0 text-[15.5px] font-medium text-brand-ink shadow-none transition-colors placeholder:text-brand-ink-hint/60 focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.email
                  ? 'border-b-brand-danger'
                  : 'border-b-[#D8D1BF] focus-visible:border-b-brand-primary'
                }`}
            />
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="mt-1.5 text-xs font-semibold text-brand-danger"
              >
                {errors.email}
              </motion.p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <div className="flex items-baseline justify-between">
              <Label
                htmlFor="password"
                className={`text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${errors.password
                    ? 'text-brand-danger'
                    : focused === 'password'
                      ? 'text-brand-primary'
                      : 'text-brand-ink-hint'
                  }`}
              >
                {t('password')}
              </Label>
              <a
                href={SUPPORT_LINK}
                className="text-[11px] font-semibold text-brand-ink-muted underline-offset-4 transition-colors hover:text-brand-primary hover:underline"
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
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                disabled={isLoading}
                className={`h-11 rounded-none border-0 border-b bg-transparent px-0 pe-9 text-[15.5px] font-medium text-brand-ink shadow-none transition-colors placeholder:text-brand-ink-hint/60 focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.password
                    ? 'border-b-brand-danger'
                    : 'border-b-[#D8D1BF] focus-visible:border-b-brand-primary'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute end-0 top-1/2 -translate-y-1/2 rounded-md p-1 text-brand-ink-hint transition-colors hover:text-brand-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="mt-1.5 text-xs font-semibold text-brand-danger"
              >
                {errors.password}
              </motion.p>
            )}
          </div>

          {/* Submit */}
          <motion.div
            whileHover={reduceMotion || isLoading ? {} : { y: -1 }}
            whileTap={isLoading ? {} : { scale: 0.99 }}
            className="pt-3"
          >
            <Button
              type="submit"
              disabled={isLoading}
              className="group relative h-12 w-full overflow-hidden rounded-full bg-brand-ink text-[14px] font-bold tracking-tight text-white shadow-[0_18px_38px_-14px_rgba(26,43,58,0.55)] transition-all hover:bg-brand-primary-deep hover:shadow-[0_22px_44px_-14px_rgba(38,75,107,0.6)] disabled:opacity-70"
            >
              <span className="relative flex items-center justify-center">
                {isLoading ? (
                  <>
                    <Loader2
                      className="me-2 h-4 w-4 animate-spin"
                      role="status"
                      aria-label={t('loadingLabel')}
                    />
                    {t('signingIn')}
                  </>
                ) : (
                  <>
                    {t('signIn')}
                    <ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </>
                )}
              </span>
            </Button>
          </motion.div>
        </motion.form>

        {/* Demo accounts (dev only) */}
        {showDemoCredentials && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
            className="mt-8"
          >
            <button
              type="button"
              onClick={() => setDemoOpen((v) => !v)}
              className="group inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-ink-hint transition-colors hover:text-brand-primary"
            >
              {demoOpen
                ? isAr ? 'إخفاء حسابات التجربة' : 'Hide demo accounts'
                : isAr ? 'حسابات تجريبية' : 'Demo accounts'}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${demoOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {demoOpen && (
                <motion.div
                  key="demo-list"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => fillDemoCredentials(acc.email)}
                        className="group flex items-center justify-between rounded-lg border border-brand-surface-border bg-white/60 px-3 py-2 text-start transition-all hover:border-brand-primary/30 hover:bg-white"
                      >
                        <span className="text-[11px] font-black text-brand-ink">{acc.role}</span>
                        <ArrowRight className="h-3 w-3 text-brand-ink-hint transition-all group-hover:translate-x-0.5 group-hover:text-brand-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] font-medium text-brand-ink-hint" dir="ltr">
                    Password · <span className="font-mono font-bold text-brand-ink-muted">password123</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-14 text-[11px] font-medium text-brand-ink-hint"
        >
          {t('copyright', { year: new Date().getFullYear() })}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
