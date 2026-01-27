import { useAuth } from '../context/AuthProvider';

/**
 * StaffDashboard component
 * Placeholder dashboard for users with ROLE_STAFF
 */
const StaffDashboard = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Staff Dashboard
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Welcome back, {user?.username || 'Staff Member'}!
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="border-l-4 border-green-600 pl-4 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Staff Access Level
                        </h2>
                        <p className="text-gray-600">
                            You have staff access to manage bookings and rooms.
                        </p>
                    </div>

                    {/* User Info Card */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            User Information
                        </h3>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Username</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                                <dd className="mt-1 text-sm text-gray-900">{user?.id}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Role</dt>
                                <dd className="mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {user?.roles?.[0] || 'N/A'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Today's Tasks */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Today&apos;s Tasks (Placeholder)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-900 mb-2">Pending Check-ins</h4>
                                <p className="text-2xl font-bold text-blue-600">5</p>
                                <p className="text-sm text-blue-700 mt-1">Guests arriving today</p>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <h4 className="font-medium text-orange-900 mb-2">Pending Check-outs</h4>
                                <p className="text-2xl font-bold text-orange-600">3</p>
                                <p className="text-sm text-orange-700 mt-1">Guests departing today</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h4 className="font-medium text-purple-900 mb-2">Room Maintenance</h4>
                                <p className="text-2xl font-bold text-purple-600">2</p>
                                <p className="text-sm text-purple-700 mt-1">Rooms requiring attention</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h4 className="font-medium text-green-900 mb-2">New Reservations</h4>
                                <p className="text-2xl font-bold text-green-600">7</p>
                                <p className="text-sm text-green-700 mt-1">Bookings this week</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StaffDashboard;
