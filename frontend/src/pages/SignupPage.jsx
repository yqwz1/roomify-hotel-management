import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { register } from '../services/authService';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { EASE } from '@/components/motion/Reveal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/;

const SignupPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith('ar');
  const reduceMotion = useReducedMotion();
  const brandName = t('brandName');

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });
  const [signupError, setSignupError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (signupError) setSignupError('');
  };

  const validateForm = () => {
    const nextErrors = { name: '', email: '', password: '' };
    let valid = true;

    if (!formData.name.trim()) {
      nextErrors.name = t('nameRequired', { defaultValue: 'Name is required' });
      valid = false;
    }
    if (!formData.email.trim()) {
      nextErrors.email = t('emailRequired');
      valid = false;
    } else if (!emailRegex.test(formData.email)) {
      nextErrors.email = t('invalidEmail');
      valid = false;
    }
    if (!formData.password) {
      nextErrors.password = t('passwordRequired');
      valid = false;
    } else if (!passwordRegex.test(formData.password)) {
      nextErrors.password = t('signupPasswordHint', {
        defaultValue: 'Use at least 8 characters with upper case, lower case, a number, and a special character.',
      });
      valid = false;
    }

    setErrors(nextErrors);
    return valid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSignupError('');
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate('/login', {
        replace: true,
        state: {
          registeredEmail: formData.email.trim(),
          signupSuccess: true,
        },
      });
    } catch (error) {
      setSignupError(error.message || t('signupFailedDefault', {
        defaultValue: 'Unable to create your account. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-w-0 min-h-screen items-center justify-center overflow-hidden bg-brand-surface px-5 py-16 font-sans sm:px-8 sm:py-20"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="absolute inset-x-0 top-0 z-20 flex min-w-0 items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
        <Link
          to="/"
          className="group inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.2em] text-brand-ink-muted transition-colors hover:text-brand-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5 shrink-0" />
          {t('backToSite', { defaultValue: 'Back to site' })}
        </Link>
        <LanguageSwitcher />
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,rgba(53,101,141,0.14),transparent_55%),radial-gradient(ellipse_at_top,rgba(212,162,76,0.05),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: EASE }}
          className="absolute -bottom-4 left-1/2 h-[min(85vh,960px)] w-[min(170vw,2000px)] -translate-x-1/2 [mask-image:radial-gradient(ellipse_at_center_bottom,black_22%,rgba(0,0,0,0.55)_50%,transparent_78%)] [-webkit-mask-image:radial-gradient(ellipse_at_center_bottom,black_22%,rgba(0,0,0,0.55)_50%,transparent_78%)]"
        >
          <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax meet" className="h-full w-full">
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
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-surface via-brand-surface/60 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative z-10 w-full max-w-[400px]"
      >
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-10"
        >
          <img src="/roomify-mark.png" alt={brandName} className="h-12 w-auto select-none" draggable={false} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          className="font-heading text-[2.45rem] leading-[1.04] tracking-tight text-brand-ink sm:text-[2.75rem]"
        >
          {t('signupHeadline', { defaultValue: 'Create your Roomify account.' })}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.14, ease: EASE }}
          className="mt-3 text-[15.5px] font-medium text-brand-ink-muted"
        >
          {t('signupSubline', { defaultValue: 'Register as a guest to manage stays and services.' })}
        </motion.p>

        <AnimatePresence>
          {signupError && (
            <motion.div
              key="signup-error"
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
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertTitle className="font-black">{t('authFailed')}</AlertTitle>
                <AlertDescription>{signupError}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
          onSubmit={handleSubmit}
          className="mt-10 space-y-7"
          noValidate
        >
          <TextField
            id="signup-name"
            name="name"
            label={t('nameLabel', { defaultValue: 'Name' })}
            value={formData.name}
            error={errors.name}
            focused={focused === 'name'}
            disabled={isLoading}
            onChange={handleChange}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
          />
          <TextField
            id="signup-email"
            name="email"
            type="email"
            label={t('emailAddress')}
            value={formData.email}
            error={errors.email}
            focused={focused === 'email'}
            disabled={isLoading}
            dir="ltr"
            onChange={handleChange}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />

          <div className="relative">
            <Label
              htmlFor="signup-password"
              className={`text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${errors.password
                ? 'text-brand-danger'
                : focused === 'password'
                  ? 'text-brand-primary'
                  : 'text-brand-ink-hint'
                }`}
            >
              {t('password')}
            </Label>
            <div className="relative">
              <Input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                disabled={isLoading}
                className={`h-11 rounded-none border-0 border-b bg-transparent px-0 pe-9 text-[15.5px] font-medium text-brand-ink shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.password
                  ? 'border-b-brand-danger'
                  : 'border-b-[#D8D1BF] focus-visible:border-b-brand-primary'
                  }`}
              />
              <Button variant="unstyled" size="none"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute end-0 top-1/2 -translate-y-1/2 rounded-md p-1 text-brand-ink-hint transition-colors hover:text-brand-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
              </Button>
            </div>
            {errors.password && <FieldError>{errors.password}</FieldError>}
          </div>

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
              <span className="relative flex min-w-0 items-center justify-center">
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin shrink-0" role="status" aria-label={t('loadingLabel')} />
                    {t('creatingAccount', { defaultValue: 'Creating account...' })}
                  </>
                ) : (
                  <>
                    {t('createAccount', { defaultValue: 'Create account' })}
                    <ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 shrink-0" />
                  </>
                )}
              </span>
            </Button>
          </motion.div>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.48 }}
          className="mt-7 text-sm font-medium text-brand-ink-muted"
        >
          {t('alreadyHaveAccount', { defaultValue: 'Already have an account?' })}{' '}
          <Link to="/login" className="font-bold text-brand-primary underline-offset-4 hover:underline">
            {t('signIn')}
          </Link>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-12 text-[11px] font-medium text-brand-ink-hint"
        >
          {t('copyright', { year: new Date().getFullYear() })}
        </motion.p>
      </motion.div>
    </div>
  );
};

const TextField = ({
  id,
  name,
  type = 'text',
  label,
  value,
  error,
  focused,
  disabled,
  dir,
  onChange,
  onFocus,
  onBlur,
}) => (
  <div className="relative">
    <Label
      htmlFor={id}
      className={`absolute -top-2 start-0 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${error
        ? 'text-brand-danger'
        : focused
          ? 'text-brand-primary'
          : 'text-brand-ink-hint'
        }`}
    >
      {label}
    </Label>
    <Input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={disabled}
      dir={dir}
      className={`h-11 rounded-none border-0 border-b bg-transparent px-0 text-[15.5px] font-medium text-brand-ink shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 ${error
        ? 'border-b-brand-danger'
        : 'border-b-[#D8D1BF] focus-visible:border-b-brand-primary'
        }`}
    />
    {error && <FieldError>{error}</FieldError>}
  </div>
);

const FieldError = ({ children }) => (
  <motion.p
    initial={{ opacity: 0, y: -2 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22 }}
    className="mt-1.5 text-xs font-semibold text-brand-danger"
  >
    {children}
  </motion.p>
);

export default SignupPage;
