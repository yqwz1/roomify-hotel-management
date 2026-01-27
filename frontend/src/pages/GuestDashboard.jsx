import { useAuth } from '../context/AuthProvider';

/**
 * GuestDashboard component
 * Placeholder dashboard for users with ROLE_GUEST
 */
const GuestDashboard = () => {
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
                                Guest Dashboard
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Welcome, {user?.username || 'Guest'}!
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
                    <div className="border-l-4 border-purple-600 pl-4 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Guest Access Level
                        </h2>
                        <p className="text-gray-600">
                            You can view and manage your bookings and profile.
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
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {user?.roles?.[0] || 'N/A'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* My Bookings */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            My Bookings (Placeholder)
                        </h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-blue-400 mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <p className="text-gray-700 font-medium">No active bookings</p>
                            <p className="text-sm text-gray-600 mt-1">
                                Browse our rooms to make a reservation
                            </p>
                            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Browse Rooms
                            </button>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Quick Links
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a
                                href="#"
                                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                            >
                                <div className="text-blue-600 font-medium">Browse Rooms</div>
                                <p className="text-sm text-gray-600 mt-1">
                                    View available rooms
                                </p>
                            </a>
                            <a
                                href="#"
                                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                            >
                                <div className="text-blue-600 font-medium">My Profile</div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Update your information
                                </p>
                            </a>
                            <a
                                href="#"
                                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                            >
                                <div className="text-blue-600 font-medium">Help & Support</div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Get assistance
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
