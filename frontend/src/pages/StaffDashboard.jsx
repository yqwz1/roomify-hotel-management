import { useAuth } from '../context/AuthProvider';
import { useTranslation } from 'react-i18next';

/**
 * StaffDashboard component
 * Placeholder dashboard for users with ROLE_STAFF
 */
const StaffDashboard = () => {
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
                                {t('staffDashboardTitle') || 'Staff Dashboard'}
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                {t('welcomeBackUser', { username: user?.username || t('staffMemberFallback') }) || `Welcome back, ${user?.username || 'Staff Member'}!`}
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
                <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 p-6 sm:p-8">
                    <div className="border-s-4 border-black ps-5 mb-8">
                        <h2 className="text-2xl font-bold text-black mb-2">
                            {t('staffAccessLevel') || 'Staff Access Level'}
                        </h2>
                        <p className="text-gray-600">
                            {t('staffAccessDesc') || 'You have staff access to manage bookings and rooms.'}
                        </p>
                    </div>

                    {/* User Info Card */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 sm:p-8 mb-8">
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

                    {/* Today's Tasks */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-black">
                            {t('todaysTasks') || 'Today\'s Tasks (Placeholder)'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border border-zinc-200 shadow-sm rounded-3xl p-6 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-black mb-1">{t('pendingCheckIns') || 'Pending Check-ins'}</h4>
                                <p className="text-4xl font-extrabold text-black">5</p>
                                <p className="text-sm font-medium text-zinc-500 mt-2">{t('guestsArrivingToday') || 'Guests arriving today'}</p>
                            </div>
                            <div className="bg-white border border-zinc-200 shadow-sm rounded-3xl p-6 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-black mb-1">{t('pendingCheckOuts') || 'Pending Check-outs'}</h4>
                                <p className="text-4xl font-extrabold text-black">3</p>
                                <p className="text-sm font-medium text-zinc-500 mt-2">{t('guestsDepartingToday') || 'Guests departing today'}</p>
                            </div>
                            <div className="bg-white border border-zinc-200 shadow-sm rounded-3xl p-6 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-black mb-1">{t('roomMaintenance') || 'Room Maintenance'}</h4>
                                <p className="text-4xl font-extrabold text-black">2</p>
                                <p className="text-sm font-medium text-zinc-500 mt-2">{t('roomsRequiringAttention') || 'Rooms requiring attention'}</p>
                            </div>
                            <div className="bg-white border border-zinc-200 shadow-sm rounded-3xl p-6 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-black mb-1">{t('newReservations') || 'New Reservations'}</h4>
                                <p className="text-4xl font-extrabold text-black">7</p>
                                <p className="text-sm font-medium text-zinc-500 mt-2">{t('bookingsThisWeek') || 'Bookings this week'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StaffDashboard;
