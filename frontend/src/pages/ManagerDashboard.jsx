import { useAuth } from '../context/AuthProvider';

/**
 * ManagerDashboard component
 * Placeholder dashboard for users with ROLE_MANAGER
 */
const ManagerDashboard = () => {
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
                                Manager Dashboard
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Welcome back, {user?.username || 'Manager'}!
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
                    <div className="border-l-4 border-blue-600 pl-4 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Manager Access Level
                        </h2>
                        <p className="text-gray-600">
                            You have full administrative access to the Roomify system.
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
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {user?.roles?.[0] || 'N/A'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                            <h4 className="text-sm font-medium opacity-90 mb-2">Total Rooms</h4>
                            <p className="text-3xl font-bold">42</p>
                            <p className="text-sm opacity-75 mt-2">Placeholder data</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                            <h4 className="text-sm font-medium opacity-90 mb-2">Active Bookings</h4>
                            <p className="text-3xl font-bold">18</p>
                            <p className="text-sm opacity-75 mt-2">Placeholder data</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                            <h4 className="text-sm font-medium opacity-90 mb-2">Revenue (This Month)</h4>
                            <p className="text-3xl font-bold">$12.5K</p>
                            <p className="text-sm opacity-75 mt-2">Placeholder data</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManagerDashboard;
