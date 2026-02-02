import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

/**
 * LoginPage component
 * Professional login form with validation, loading states, and error handling
 */
const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({
        email: '',
        password: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /**
     * Handle input changes
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field-specific error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Clear login error when user types
        if (loginError) {
            setLoginError('');
        }
    };

    /**
     * Validate form fields
     * @returns {boolean} True if form is valid
     */
    const validateForm = () => {
        const newErrors = {
            email: '',
            password: ''
        };

        let isValid = true;

        // Validate email
        if (!formData.email) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Validate password
        if (!formData.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');

        // Validate form
        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);

            // Call login function from AuthProvider
            const user = await login(formData.email, formData.password);

            // Redirect based on user role
            const primaryRole = user.roles[0];

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
                    navigate('/guest/dashboard', { replace: true });
            }
        } catch (error) {
            setLoginError(error.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle forgot password link click
     */
    const handleForgotPassword = (e) => {
        e.preventDefault();
        console.log('Forgot Password clicked - This is a placeholder feature');
        alert('Forgot Password feature coming soon!');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Card Container */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Welcome to Roomify
                        </h1>
                        <p className="text-gray-600">
                            Sign in to access your account
                        </p>
                    </div>

                    {/* Login Error Message */}
                    {loginError && (
                        <div className="mb-6">
                            <ErrorMessage
                                message={loginError}
                                onDismiss={() => setLoginError('')}
                            />
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} noValidate className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none`}
                                placeholder="you@example.com"
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none`}
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex items-center justify-end">
                            <a
                                href="#"
                                onClick={handleForgotPassword}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                Forgot Password?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials Helper */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Demo Credentials:</p>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p>• Manager: admin@test.com</p>
                            <p>• Staff: staff@test.com</p>
                            <p>• Guest: user@test.com</p>
                            <p className="text-gray-500 mt-1">Password: any value</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
