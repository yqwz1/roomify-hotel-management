import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, ClipboardCheck, FileText, LogOut, Search, UserRound, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { useTranslation } from 'react-i18next';

const ActionCard = ({ icon: Icon, title, description, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center justify-between rounded-3xl border border-zinc-200 bg-white p-5 text-start transition-all hover:border-black hover:shadow-md"
    >
        <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 transition-colors group-hover:bg-black">
                <Icon className="h-5 w-5 text-zinc-700 group-hover:text-white" />
            </div>
            <div>
                <p className="text-sm font-bold text-black">{title}</p>
                <p className="mt-1 text-xs text-zinc-500">{description}</p>
            </div>
        </div>
        <ArrowRight className="h-5 w-5 flex-shrink-0 text-zinc-300 transition group-hover:text-black" />
    </button>
);

const StaffDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="h-full bg-zinc-50 p-6 lg:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                            {t('dashboard') || 'Dashboard'}
                        </p>
                        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-black">
                            {t('staffDashboardTitle') || 'Staff Dashboard'}
                        </h1>
                        <p className="mt-2 text-sm font-medium text-zinc-500">
                            {t('welcomeBackUser', { username: user?.username || t('staffMemberFallback') }) || `Welcome back, ${user?.username || 'Staff Member'}`}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                    >
                        <span className="inline-flex items-center gap-2">
                            <LogOut className="h-4 w-4" />
                            {t('logout') || 'Logout'}
                        </span>
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
                                <UserRound className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-black">{user?.username || 'Staff Member'}</h2>
                                <p className="mt-1 text-sm font-medium text-zinc-500">
                                    {t('staffAccessDesc') || 'Use the operational tools below to search rooms, check guests in and out, and manage reservation changes.'}
                                </p>
                            </div>
                        </div>

                        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                <dt className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                    {t('emailLabel') || 'Email'}
                                </dt>
                                <dd className="mt-2 text-sm font-semibold text-black">{user?.email || '—'}</dd>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                <dt className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                    {t('roleLabel') || 'Role'}
                                </dt>
                                <dd className="mt-2">
                                    <span className="inline-flex rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-bold text-black">
                                        {user?.roles?.[0] || 'ROLE_STAFF'}
                                    </span>
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Front Desk Workflow</h3>
                            <div className="mt-4 space-y-3">
                                {[
                                    'Search room availability before creating a reservation.',
                                    'Use Check-In and Checkout tools for guest arrivals and departures.',
                                    'Review reservation changes and invoices from the dedicated service pages.',
                                ].map((item) => (
                                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-zinc-600">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                            Operational Actions
                        </h2>
                        <div className="mt-5 grid gap-3">
                            <ActionCard
                                icon={Search}
                                title={t('roomSearch') || 'Room Search'}
                                description="Find available rooms and start new bookings."
                                onClick={() => navigate('/search')}
                            />
                            <ActionCard
                                icon={ClipboardCheck}
                                title={t('checkInTitle') || 'Check-In'}
                                description="Look up reservations and complete guest arrivals."
                                onClick={() => navigate('/check-in')}
                            />
                            <ActionCard
                                icon={CalendarClock}
                                title={t('modifyReservationTitle') || 'Modify Reservation'}
                                description="Adjust reservation dates and room assignments."
                                onClick={() => navigate('/reservations/modify')}
                            />
                            <ActionCard
                                icon={FileText}
                                title={t('invoicePreview') || 'Invoice Preview'}
                                description="Generate, review, and download reservation invoices."
                                onClick={() => navigate('/invoice-preview')}
                            />
                            <ActionCard
                                icon={Wallet}
                                title={t('checkoutTitle') || 'Checkout'}
                                description="Review balances and complete guest departures."
                                onClick={() => navigate('/checkout')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
