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
        <div className="h-full flex">
            {/* ── Left: Brand Panel (desktop only) ── */}
            <div className="hidden lg:flex lg:w-[45%] bg-black flex-col justify-between p-12">
                {/* Top: Logo */}
                <div className="flex items-center">
                    <span className="text-white font-black text-3xl tracking-tighter">Roomify</span>
                </div>

                {/* Middle: Headline */}
                <div>
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-6">
                        {t('hotelManagementSystem') || 'Hotel Management System'}
                    </p>
                    <h1 className="text-5xl font-extrabold text-white leading-tight mb-8 tracking-tight">
                        {t('manageYourProperty') || 'Manage your property'}<br />
                        <span className="text-zinc-400">{t('withConfidence') || 'with confidence.'}</span>
                    </h1>
                    <p className="text-zinc-500 text-lg font-medium leading-relaxed max-w-sm">
                        {t('loginDescription') || 'A professional PMS designed for hotels of every size — from boutique stays to full-service resorts.'}
                    </p>
                </div>

                {/* Bottom: Feature chips */}
                <div className="space-y-4">
                    {[
                        { icon: ShieldCheck, text: t('featureSecureAccess') || 'Role-based secure access' },
                        { icon: Zap, text: t('featureRealTimeUpdates') || 'Real-time room status updates' },
                        { icon: Users, text: t('featureStaffGuest') || 'Staff & guest management' },
                    ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-zinc-300 text-sm font-medium">{text}</span>
                        </div>
                    ))}
                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest pt-4">
                        {t('copyright', { year: new Date().getFullYear() }) || `© ${new Date().getFullYear()} Roomify PMS. All rights reserved.`}
                    </p>
                </div>
            </div>

            {/* ── Right: Login Form Panel ── */}
            <div className="flex-1 flex items-center justify-center bg-zinc-50 px-5 py-12 sm:px-8">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center mb-10">
                        <span className="text-black font-black text-3xl tracking-tighter">Roomify</span>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold text-black tracking-tight" role="heading" aria-level="1">
                            {t('signInToAccount') || 'Sign in to your account'}
                        </h2>
                        <p className="text-zinc-500 text-sm font-medium mt-2">
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

                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-black font-bold text-sm tracking-wide">
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
                                className={`h-12 text-sm rounded-full px-5 border ${errors.email ? 'border-red-500 focus-visible:ring-red-300' : 'border-zinc-300 focus-visible:ring-black'}`}
                            />
                            {errors.email && (
                                <p className="text-xs font-bold text-red-500 mt-1 pl-4">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-black font-bold text-sm tracking-wide">
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
                                className={`h-12 text-sm rounded-full px-5 border ${errors.password ? 'border-red-500 focus-visible:ring-red-300' : 'border-zinc-300 focus-visible:ring-black'}`}
                            />
                            {errors.password && (
                                <p className="text-xs font-bold text-red-500 mt-1 pl-4">{errors.password}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-black hover:bg-zinc-800 text-white text-sm font-extrabold rounded-full shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-zinc-400 mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="me-2 h-5 w-5 animate-spin" role="status" aria-label="Loading" />
                                    {t('signingIn') || 'Signing in...'}
                                </>
                            ) : (
                                t('signIn') || 'Sign In'
                            )}
                        </Button>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-8 p-5 bg-zinc-50 border border-zinc-200 rounded-3xl text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">{t('demoCredentials') || 'Demo Credentials'}</p>
                        <div className="flex flex-col gap-1 items-center">
                            <p className="text-sm font-medium text-zinc-600">{t('managerLabel') || 'Manager:'} <span className="font-mono text-black font-bold px-2 py-0.5 bg-zinc-200 rounded-full text-xs ml-1">admin@roomify.com</span></p>
                            <p className="text-sm font-medium text-zinc-600">{t('password') || 'Password'}: <span className="font-mono text-black font-bold px-2 py-0.5 bg-zinc-200 rounded-full text-xs ml-1">password123</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
