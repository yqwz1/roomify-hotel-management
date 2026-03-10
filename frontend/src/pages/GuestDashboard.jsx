import { useAuth } from '../context/AuthProvider';
import { useTranslation } from 'react-i18next';

/**
 * GuestDashboard component
 * Placeholder dashboard for users with ROLE_GUEST
 */
const GuestDashboard = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="h-full bg-zinc-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-extrabold text-black tracking-tight">
                                {t('guestDashboardTitle') || 'Guest Dashboard'}
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                {t('welcomeUser', { username: user?.username || t('guestFallback') }) || `Welcome, ${user?.username || 'Guest'}!`}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2.5 bg-black text-white font-bold rounded-full hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
                        >
                            {t('logout') || 'Logout'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-8">
                    <div className="border-s-4 border-black ps-5 mb-8">
                        <h2 className="text-2xl font-bold text-black mb-2">
                            {t('guestAccessLevel') || 'Guest Access Level'}
                        </h2>
                        <p className="text-gray-600">
                            {t('guestAccessDesc') || 'You can view and manage your bookings and profile.'}
                        </p>
                    </div>

                    {/* User Info Card */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 mb-8">
                        <h3 className="text-lg font-bold text-black mb-4">
                            {t('userInfo') || 'User Information'}
                        </h3>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('usernameLabel') || 'Username'}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('emailLabel') || 'Email'}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('userIdLabel') || 'User ID'}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user?.id}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('roleLabel') || 'Role'}</dt>
                                <dd className="mt-1">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border border-zinc-300 bg-white text-black">
                                        {user?.roles?.[0] || 'N/A'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* My Bookings */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-black mb-4">
                            {t('myBookingsPlaceholder') || 'My Bookings (Placeholder)'}
                        </h3>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 text-center">
                            <svg className="mx-auto h-12 w-12 text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-700 font-medium">{t('noActiveBookings') || 'No active bookings'}</p>
                            <p className="text-sm text-gray-600 mt-1">{t('browseRoomsMsg') || 'Browse our rooms to make a reservation'}</p>
                            <button className="mt-5 px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-zinc-800 transition-all shadow-md">
                                {t('browseRoomsBtn') || 'Browse Rooms'}
                            </button>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold text-black mb-4">
                            {t('quickLinks') || 'Quick Links'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a
                                href="#"
                                className="block p-5 bg-white border border-zinc-200 rounded-3xl hover:border-black hover:shadow-lg transition-all"
                            >
                                <div className="text-black font-bold">{t('browseRoomsBtn') || 'Browse Rooms'}</div>
                                <p className="text-sm text-gray-600 mt-1">
                                    {t('viewAvailableRooms') || 'View available rooms'}
                                </p>
                            </a>
                            <a
                                href="#"
                                className="block p-5 bg-white border border-zinc-200 rounded-3xl hover:border-black hover:shadow-lg transition-all"
                            >
                                <div className="text-black font-bold">{t('myProfile') || 'My Profile'}</div>
                                <p className="text-sm text-gray-600 mt-1">
                                    {t('updateYourInfo') || 'Update your information'}
                                </p>
                            </a>
                            <a
                                href="#"
                                className="block p-5 bg-white border border-zinc-200 rounded-3xl hover:border-black hover:shadow-lg transition-all"
                            >
                                <div className="text-black font-bold">{t('helpSupport') || 'Help & Support'}</div>
                                <p className="text-sm text-gray-600 mt-1">
                                    {t('getAssistance') || 'Get assistance'}
                                </p>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuestDashboard;
