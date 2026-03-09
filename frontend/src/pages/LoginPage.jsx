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

    const [formData, setFormData] = useState({
        email: 'admin@roomify.com',
        password: 'password123'
    });

    const [errors, setErrors] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

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
        if (!formData.email) { newErrors.email = t('emailRequired') || 'Email is required'; isValid = false; }
        else if (!emailRegex.test(formData.email)) { newErrors.email = t('invalidEmail') || 'Please enter a valid email address'; isValid = false; }
        if (!formData.password) { newErrors.password = t('passwordRequired') || 'Password is required'; isValid = false; }
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
            setLoginError(error.message || t('loginFailedDefault') || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ── Left: Brand Panel (desktop only) ── */}
            <div className="hidden lg:flex lg:w-[45%] bg-slate-900 flex-col justify-between p-10">
                {/* Top: Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
                        <Hotel className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">Roomify</span>
                </div>

                {/* Middle: Headline */}
                <div>
                    <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">
                        {t('hotelManagementSystem') || 'Hotel Management System'}
                    </p>
                    <h1 className="text-4xl font-bold text-white leading-snug mb-6">
                        {t('manageYourProperty') || 'Manage your property'}<br />
                        <span className="text-blue-400">{t('withConfidence') || 'with confidence.'}</span>
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed max-w-sm">
                        {t('loginDescription') || 'A professional PMS designed for hotels of every size — from boutique stays to full-service resorts.'}
                    </p>
                </div>

                {/* Bottom: Feature chips */}
                <div className="space-y-3">
                    {[
                        { icon: ShieldCheck, text: t('featureSecureAccess') || 'Role-based secure access' },
                        { icon: Zap, text: t('featureRealTimeUpdates') || 'Real-time room status updates' },
                        { icon: Users, text: t('featureStaffGuest') || 'Staff & guest management' },
                    ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <Icon className="h-3.5 w-3.5 text-blue-400" />
                            </div>
                            <span className="text-slate-300 text-sm">{text}</span>
                        </div>
                    ))}
                    <p className="text-slate-600 text-xs pt-2">
                        {t('copyright', { year: new Date().getFullYear() }) || `© ${new Date().getFullYear()} Roomify PMS. All rights reserved.`}
                    </p>
                </div>
            </div>

            {/* ── Right: Login Form Panel ── */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 px-5 py-12 sm:px-8">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                            <Hotel className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-gray-900 font-bold text-xl">Roomify</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900" role="heading" aria-level="1">
                            {t('signInToAccount') || 'Sign in to your account'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {t('enterCredentials') || 'Enter your credentials to access the system'}
                        </p>
                    </div>

                    {loginError && (
                        <Alert variant="destructive" className="mb-5">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t('authFailed') || 'Authentication Failed'}</AlertTitle>
                            <AlertDescription>{loginError}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                                {t('emailAddress') || 'Email Address'}
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                className={`h-10 text-sm ${errors.email ? 'border-red-500 focus-visible:ring-red-300' : ''}`}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                                {t('password') || 'Password'}
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                                className={`h-10 text-sm ${errors.password ? 'border-red-500 focus-visible:ring-red-300' : ''}`}
                            />
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="me-2 h-4 w-4 animate-spin" role="status" aria-label="Loading" />
                                    {t('signingIn') || 'Signing in...'}
                                </>
                            ) : (
                                t('signIn') || 'Sign In'
                            )}
                        </Button>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 mb-1">{t('demoCredentials') || 'Demo Credentials'}</p>
                        <p className="text-xs text-blue-600">{t('managerLabel') || 'Manager:'} <span className="font-mono">admin@roomify.com</span></p>
                        <p className="text-xs text-blue-600">{t('password') || 'Password'}: <span className="font-mono">password123</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
