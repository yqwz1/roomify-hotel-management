import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Mail, ShieldCheck, Users, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SUPPORT_EMAIL = 'info@roomify.com';
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=Roomify%20Access%20Support`;

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
        password: 'password123',
    });
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleChange = (e) => {
        const { name, value } = e.target;
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
            nextErrors.email = tx('emailRequired', 'Email is required');
            valid = false;
        } else if (!emailRegex.test(formData.email)) {
            nextErrors.email = tx('invalidEmail', 'Please enter a valid email address');
            valid = false;
        }

        if (!formData.password) {
            nextErrors.password = tx('passwordRequired', 'Password is required');
            valid = false;
        }

        setErrors(nextErrors);
        return valid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            setLoginError(error.message || tx('loginFailedDefault', 'Login failed. Please check your credentials.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full font-sans">
            <div className="hidden bg-black p-12 lg:flex lg:w-[45%] lg:flex-col lg:justify-between">
                <div className="flex items-center">
                    <span className="font-heading text-3xl font-black tracking-tighter text-white">Roomify</span>
                </div>

                <div>
                    <p className="mb-6 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        {tx('hotelManagementSystem', 'Hotel Management System')}
                    </p>
                    <h1 className="mb-8 text-5xl font-extrabold leading-tight tracking-tight text-white">
                        {tx('manageYourProperty', 'Manage your property')}
                        <br />
                        <span className="text-zinc-400">{tx('withConfidence', 'with confidence.')}</span>
                    </h1>
                    <p className="max-w-sm text-lg font-medium leading-relaxed text-zinc-500">
                        {tx('loginDescription', 'A professional PMS designed for hotels of every size from boutique stays to full-service resorts.')}
                    </p>
                </div>

                <div className="space-y-4">
                    {[
                        { icon: ShieldCheck, text: tx('featureSecureAccess', 'Role-based secure access') },
                        { icon: Zap, text: tx('featureRealTimeUpdates', 'Real-time room status updates') },
                        { icon: Users, text: tx('featureStaffGuest', 'Staff and guest management') },
                    ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-4">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800">
                                <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-zinc-300">{text}</span>
                        </div>
                    ))}
                    <p className="pt-4 text-xs font-bold uppercase tracking-widest text-zinc-600">
                        {tx('copyright', `© ${new Date().getFullYear()} Roomify PMS. All rights reserved.`, { year: new Date().getFullYear() })}
                    </p>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center bg-zinc-50 px-5 py-12 sm:px-8">
                <div className="w-full max-w-sm">
                    <div className="mb-10 flex items-center justify-center lg:hidden">
                        <span className="font-heading text-3xl font-black tracking-tighter text-black">Roomify</span>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-10 text-center">
                            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-black" role="heading" aria-level="1">
                                {tx('signInToAccount', 'Sign in to your account')}
                            </h2>
                            <p className="text-sm font-medium text-zinc-500">
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
                                <Label htmlFor="email" className="text-sm font-bold tracking-wide text-black">
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
                                    className={`h-12 rounded-xl border px-4 text-sm ${errors.email ? 'border-red-500 focus-visible:ring-red-300' : 'border-zinc-200 focus-visible:ring-black/20'}`}
                                />
                                {errors.email && (
                                    <p className="mt-1 ps-2 text-xs font-bold text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-bold tracking-wide text-black">
                                        {tx('password', 'Password')}
                                    </Label>
                                    <a
                                        href={SUPPORT_LINK}
                                        className="text-sm font-bold text-zinc-500 transition-colors hover:text-black"
                                    >
                                        {tx('forgotPassword', 'Need help signing in?')}
                                    </a>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className={`h-12 rounded-xl border px-4 text-sm ${errors.password ? 'border-red-500 focus-visible:ring-red-300' : 'border-zinc-200 focus-visible:ring-black/20'}`}
                                />
                                {errors.password && (
                                    <p className="mt-1 ps-2 text-xs font-bold text-red-500">{errors.password}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="mt-6 h-12 w-full rounded-xl bg-zinc-900 text-sm font-bold text-white transition-all hover:bg-black hover:shadow-md"
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

                        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                                    <Mail className="h-5 w-5 text-zinc-700" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-black">Access Requests</p>
                                    <p className="text-xs font-medium text-zinc-500">Accounts are created by hotel staff. Online signup is not available.</p>
                                </div>
                            </div>
                            <a
                                href={SUPPORT_LINK}
                                className="inline-flex w-full items-center justify-center rounded-full border border-zinc-200 px-4 py-3 text-sm font-bold text-black transition hover:border-black hover:bg-zinc-50"
                            >
                                Contact Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
