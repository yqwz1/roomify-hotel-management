import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Hotel, ShieldCheck, Zap, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { t } = useTranslation();

    const tx = (key, fallback, options) => {
        const value = t(key, options);
        return value === key ? fallback : value;
    };

    const [formData, setFormData] = useState({
        email: 'admin@roomify.com',
        password: 'password123'
    });

    const [errors, setErrors] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const [view, setView] = useState('login'); // 'login' or 'signup'
    const [isSwitching, setIsSwitching] = useState(false);

    const handleSwitchView = (newView) => {
        setIsSwitching(true);
        // Fake delay to build user trust (Design over performance)
        setTimeout(() => {
            setView(newView);
            setIsSwitching(false);
            setErrors({ email: '', password: '' });
            setLoginError('');
        }, 800);
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (loginError) setLoginError('');
    };

    const validateForm = () => {
        const newErrors = { email: '', password: '' };
        let isValid = true;
        if (!formData.email) { newErrors.email = tx('emailRequired', 'Email is required'); isValid = false; }
        else if (!emailRegex.test(formData.email)) { newErrors.email = tx('invalidEmail', 'Please enter a valid email address'); isValid = false; }
        if (!formData.password) { newErrors.password = tx('passwordRequired', 'Password is required'); isValid = false; }
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        if (!validateForm()) return;

        try {
            setIsLoading(true);
            const user = await login(formData.email, formData.password);
            const from = location.state?.from?.pathname;
            if (from) { navigate(from, { replace: true }); return; }

            const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : '';
            switch (primaryRole) {
                case 'ROLE_MANAGER': navigate('/manager/dashboard', { replace: true }); break;
                case 'ROLE_STAFF': navigate('/staff/dashboard', { replace: true }); break;
                case 'ROLE_GUEST': navigate('/guest/dashboard', { replace: true }); break;
                default: navigate('/', { replace: true });
            }
        } catch (error) {
            setLoginError(error.message || tx('loginFailedDefault', 'Login failed. Please check your credentials.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex font-sans">
            {/* ── Left: Brand Panel (desktop only) ── */}
            <div className="hidden lg:flex lg:w-[45%] bg-black flex-col justify-between p-12">
                {/* Top: Logo */}
                <div className="flex items-center">
                    <span className="text-white font-black font-heading text-3xl tracking-tighter">Roomify</span>
                </div>

                {/* Middle: Headline */}
                <div>
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-6">
                        {tx('hotelManagementSystem', 'Hotel Management System')}
                    </p>
                    <h1 className="text-5xl font-extrabold text-white leading-tight mb-8 tracking-tight">
                        {tx('manageYourProperty', 'Manage your property')}<br />
                        <span className="text-zinc-400">{tx('withConfidence', 'with confidence.')}</span>
                    </h1>
                    <p className="text-zinc-500 text-lg font-medium leading-relaxed max-w-sm">
                        {tx('loginDescription', 'A professional PMS designed for hotels of every size — from boutique stays to full-service resorts.')}
                    </p>
                </div>

                {/* Bottom: Feature chips */}
                <div className="space-y-4">
                    {[
                        { icon: ShieldCheck, text: tx('featureSecureAccess', 'Role-based secure access') },
                        { icon: Zap, text: tx('featureRealTimeUpdates', 'Real-time room status updates') },
                        { icon: Users, text: tx('featureStaffGuest', 'Staff & guest management') },
                    ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-zinc-300 text-sm font-medium">{text}</span>
                        </div>
                    ))}
                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest pt-4">
                        {tx('copyright', `© ${new Date().getFullYear()} Roomify PMS. All rights reserved.`, { year: new Date().getFullYear() })}
                    </p>
                </div>
            </div>

            {/* ── Right: Login / Signup Form Panel ── */}
            <div className="flex-1 flex items-center justify-center bg-zinc-50 px-5 py-12 sm:px-8">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center mb-10">
                        <span className="text-black font-black font-heading text-3xl tracking-tighter">Roomify</span>
                    </div>

                    {isSwitching ? (
                        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
                            <Loader2 className="h-10 w-10 text-black animate-spin mb-4" />
                            <p className="text-zinc-500 font-medium animate-pulse">
                                {tx('processing', 'Processing...')}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {view === 'login' ? (
                                <>
                                    <div className="mb-10 text-center">
                                        <h2 className="text-3xl font-extrabold font-heading text-black tracking-tight mb-2" role="heading" aria-level="1">
                                            {tx('signInToAccount', 'Sign in to your account')}
                                        </h2>
                                        <p className="text-zinc-500 text-sm font-medium">
                                            {tx('enterCredentials', 'Enter your email and password to continue')}
                                        </p>
                                    </div>

                                    {loginError && (
                                        <Alert variant="destructive" className="mb-5 rounded-2xl">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>{tx('authFailed', 'Authentication Failed')}</AlertTitle>
                                            <AlertDescription>{loginError}</AlertDescription>
                                        </Alert>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-black font-bold text-sm tracking-wide">
                                                {tx('emailAddress', 'Email Address')}
                                            </Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={isLoading}
                                                className={`h-12 text-sm rounded-xl px-4 border ${errors.email ? 'border-red-500 focus-visible:ring-red-300' : 'border-zinc-200 focus-visible:ring-black/20'}`}
                                            />
                                            {errors.email && (
                                                <p className="text-xs font-bold text-red-500 mt-1 ps-2">{errors.email}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label htmlFor="password" className="text-black font-bold text-sm tracking-wide">
                                                    {tx('password', 'Password')}
                                                </Label>
                                                <button type="button" className="text-sm font-bold text-zinc-500 hover:text-black transition-colors">
                                                    {tx('forgotPassword', 'Forgot password?')}
                                                </button>
                                            </div>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                placeholder=""
                                                value={formData.password}
                                                onChange={handleChange}
                                                disabled={isLoading}
                                                className={`h-12 text-sm rounded-xl px-4 border ${errors.password ? 'border-red-500 focus-visible:ring-red-300' : 'border-zinc-200 focus-visible:ring-black/20'}`}
                                            />
                                            {errors.password && (
                                                <p className="text-xs font-bold text-red-500 mt-1 ps-2">{errors.password}</p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-12 bg-[#18181b] hover:bg-black text-white text-sm font-bold rounded-xl transition-all hover:shadow-md mt-6"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="me-2 h-5 w-5 animate-spin" role="status" aria-label="loading" />
                                                    {tx('signingIn', 'Signing in...')}
                                                </>
                                            ) : (
                                                tx('signIn', 'Sign In')
                                            )}
                                        </Button>
                                    </form>

                                    <div className="mt-8 text-center">
                                        <p className="text-sm text-zinc-500 font-medium">
                                            {tx('dontHaveAccount', "Don't have an account?")}{' '}
                                            <button
                                                type="button"
                                                onClick={() => handleSwitchView('signup')}
                                                className="text-black font-bold hover:underline underline-offset-4"
                                            >
                                                {tx('signUpLink', 'Sign up')}
                                            </button>
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="mb-10 text-center">
                                        <h2 className="text-3xl font-extrabold font-heading text-black tracking-tight mb-2" role="heading" aria-level="1">
                                            {t('createAccountTitle') || 'Create your account'}
                                        </h2>
                                        <p className="text-zinc-500 text-sm font-medium">
                                            {t('createAccountDesc') || 'Complete the following form to create the account'}
                                        </p>
                                    </div>

                                    <form onSubmit={(e) => { e.preventDefault(); /* Visually only */ }} className="space-y-5" noValidate>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-name" className="text-black font-bold text-sm tracking-wide">
                                                {t('fullName') || 'Full Name'}
                                            </Label>
                                            <Input
                                                id="signup-name"
                                                type="text"
                                                placeholder={t('fullNamePlaceholder') || 'Ahmed Mohammed'}
                                                className="h-12 text-sm rounded-xl px-4 border border-zinc-200 focus-visible:ring-black/20"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="signup-email" className="text-black font-bold text-sm tracking-wide">
                                                {t('emailAddress') || 'Email Address'}
                                            </Label>
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="name@example.com"
                                                className="h-12 text-sm rounded-xl px-4 border border-zinc-200 focus-visible:ring-black/20"
                                            />
                                            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                                                {t('emailHint') || 'We will contact you via this email. Make sure to enter it correctly.'}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password" className="text-black font-bold text-sm tracking-wide">
                                                {t('password') || 'Password'}
                                            </Label>
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                placeholder=""
                                                className="h-12 text-sm rounded-xl px-4 border border-zinc-200 focus-visible:ring-black/20"
                                            />
                                            <p className="text-zinc-500 text-xs mt-1">
                                                {t('passwordHint') || 'Must be at least 8 characters.'}
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            className="w-full h-12 bg-[#18181b] hover:bg-black text-white text-sm font-bold rounded-xl transition-all hover:shadow-md mt-6"
                                        >
                                            {t('createAccountBtn') || 'Create account'}
                                        </Button>
                                    </form>

                                    <div className="mt-8 text-center">
                                        <p className="text-sm text-zinc-500 font-medium">
                                            {t('alreadyHaveAccount') || 'Have an account?'}{' '}
                                            <button
                                                type="button"
                                                onClick={() => handleSwitchView('login')}
                                                className="text-black font-bold hover:underline underline-offset-4"
                                            >
                                                {t('signInLink') || 'Sign in'}
                                            </button>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
