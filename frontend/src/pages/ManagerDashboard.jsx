import { useAuth } from '../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Hotel, CalendarCheck, TrendingUp, Tag, Users, Settings, ArrowRight } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className={`relative overflow-hidden rounded-xl p-5 text-white ${color}`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium opacity-80 mb-1">{label}</p>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                {sub && <p className="text-xs opacity-65 mt-1.5">{sub}</p>}
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-white" />
            </div>
        </div>
        {/* Subtle decorative circle */}
        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
    </div>
);

const QuickLink = ({ icon: Icon, label, description, onClick }) => (
    <button
        onClick={onClick}
        className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all text-left w-full"
    >
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
                <Icon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition flex-shrink-0" />
    </button>
);

const ManagerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manager Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Welcome back, <span className="font-semibold text-gray-700">{user?.username || 'Manager'}</span>
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white uppercase">
                            {user?.username?.[0] || 'M'}
                        </span>
                    </div>
                    <span className="text-sm font-medium text-blue-700">
                        {user?.roles?.[0]?.replace('ROLE_', '') || 'MANAGER'}
                    </span>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    icon={Hotel}
                    label="Total Rooms"
                    value="42"
                    sub="Across all floors"
                    color="bg-gradient-to-br from-blue-500 to-blue-700"
                />
                <StatCard
                    icon={CalendarCheck}
                    label="Active Bookings"
                    value="18"
                    sub="Currently checked in"
                    color="bg-gradient-to-br from-emerald-500 to-emerald-700"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Revenue (This Month)"
                    value="$12.5K"
                    sub="Placeholder data"
                    color="bg-gradient-to-br from-violet-500 to-violet-700"
                />
            </div>

            {/* Account info + Quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* User info card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Account Information</h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: 'Username', value: user?.username },
                            { label: 'Email', value: user?.email },
                            { label: 'User ID', value: user?.id },
                            { label: 'Role', value: user?.roles?.[0] || 'N/A', isRole: true },
                        ].map(({ label, value, isRole }) => (
                            <div key={label}>
                                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</dt>
                                {isRole ? (
                                    <dd className="mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                            {value}
                                        </span>
                                    </dd>
                                ) : (
                                    <dd className="mt-1 text-sm text-gray-900 font-medium">{value || '—'}</dd>
                                )}
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Quick actions */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Actions</h2>
                    <div className="space-y-2.5">
                        <QuickLink
                            icon={Tag}
                            label="Room Types"
                            description="Manage categories and pricing"
                            onClick={() => navigate('/room-types')}
                        />
                        <QuickLink
                            icon={Users}
                            label="Staff Management"
                            description="Add and manage hotel staff"
                            onClick={() => navigate('/staff')}
                        />
                        <QuickLink
                            icon={Settings}
                            label="Rooms Management"
                            description="Configure room inventory"
                            onClick={() => navigate('/rooms-management')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
