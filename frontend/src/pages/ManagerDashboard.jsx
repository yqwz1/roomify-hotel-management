import { useAuth } from '../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Hotel, CalendarCheck, TrendingUp, Tag, Users, Settings, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StatCard = ({ icon: Icon, label, value, sub }) => (
    <div className={`relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-bold text-zinc-500 mb-1">{label}</p>
                <p className="text-4xl font-extrabold tracking-tight text-black">{value}</p>
                {sub && <p className="text-xs font-medium text-zinc-400 mt-2">{sub}</p>}
            </div>
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-white" />
            </div>
        </div>
        <div className="absolute -bottom-6 -end-6 w-32 h-32 rounded-full border-[12px] border-zinc-50" />
    </div>
);

const QuickLink = ({ icon: Icon, label, description, onClick }) => (
    <button
        onClick={onClick}
        className="group flex items-center justify-between p-5 bg-white border border-zinc-200 rounded-3xl hover:border-black hover:shadow-md transition-all text-start w-full"
    >
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:bg-black transition-colors">
                <Icon className="h-5 w-5 text-zinc-600 group-hover:text-white" />
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </div>
        <ArrowRight className="h-5 w-5 text-zinc-300 group-hover:text-black transition flex-shrink-0" />
    </button>
);

const ManagerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold text-black tracking-tight">{t('managerDashboardTitle') || 'Manager Dashboard'}</h1>
                    <p className="text-sm font-medium text-zinc-500 mt-1">
                        {t('welcomeBackUser', { username: user?.username || t('managerFallback') }) || `Welcome back, ${user?.username || 'Manager'}`}
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                        <span className="text-xs font-bold text-white uppercase">
                            {user?.username?.[0] || 'M'}
                        </span>
                    </div>
                    <span className="text-sm font-bold text-black">
                        {user?.roles?.[0]?.replace('ROLE_', '') || 'MANAGER'}
                    </span>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    icon={Hotel}
                    label={t('totalRooms') || 'Total Rooms'}
                    value="42"
                    sub={t('acrossAllFloors') || 'Across all floors'}
                />
                <StatCard
                    icon={CalendarCheck}
                    label={t('activeBookings') || 'Active Bookings'}
                    value="18"
                    sub={t('currentlyCheckedIn') || 'Currently checked in'}
                />
                <StatCard
                    icon={TrendingUp}
                    label={t('revenueThisMonth') || 'Revenue (This Month)'}
                    value="$12.5K"
                    sub={t('placeholderData') || 'Placeholder data'}
                />
            </div>

            {/* Account info + Quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* User info card */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 sm:p-8">
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">{t('accountInfo') || 'Account Information'}</h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: t('usernameLabel') || 'Username', value: user?.username },
                            { label: t('emailLabel') || 'Email', value: user?.email },
                            { label: t('userIdLabel') || 'User ID', value: user?.id },
                            { label: t('roleLabel') || 'Role', value: user?.roles?.[0] || 'N/A', isRole: true },
                        ].map(({ label, value, isRole }) => (
                            <div key={label}>
                                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</dt>
                                {isRole ? (
                                    <dd className="mt-1">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border border-zinc-300 bg-white text-black">
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
                <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 sm:p-8">
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">{t('quickActions') || 'Quick Actions'}</h2>
                    <div className="space-y-2.5">
                        <QuickLink
                            icon={Tag}
                            label={t('roomTypesLabel') || 'Room Types'}
                            description={t('manageCategoriesPricing') || 'Manage categories and pricing'}
                            onClick={() => navigate('/room-types')}
                        />
                        <QuickLink
                            icon={Users}
                            label={t('staffManagementLabel') || 'Staff Management'}
                            description={t('addManageStaff') || 'Add and manage hotel staff'}
                            onClick={() => navigate('/staff')}
                        />
                        <QuickLink
                            icon={Settings}
                            label={t('roomsManagementLabel') || 'Rooms Management'}
                            description={t('configRoomInventory') || 'Configure room inventory'}
                            onClick={() => navigate('/rooms-management')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
