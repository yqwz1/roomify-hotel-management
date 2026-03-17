import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, CalendarDays, LifeBuoy, LogOut, Mail, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { useTranslation } from 'react-i18next';

const SUPPORT_EMAIL = 'info@roomify.com';
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=Roomify%20Guest%20Support`;

const ActionCard = ({ icon: Icon, title, description, onClick, href }) => {
    const className = 'group flex h-full w-full items-center justify-between rounded-3xl border border-zinc-200 bg-white p-5 text-start transition-all hover:border-black hover:shadow-md';

    if (href) {
        return (
            <a href={href} className={className}>
                <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 transition-colors group-hover:bg-black">
                        <Icon className="h-5 w-5 text-zinc-700 group-hover:text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-black">{title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{description}</p>
                    </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 transition group-hover:text-black">
                    Open
                </span>
            </a>
        );
    }

    return (
        <button type="button" onClick={onClick} className={className}>
            <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 transition-colors group-hover:bg-black">
                    <Icon className="h-5 w-5 text-zinc-700 group-hover:text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-black">{title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{description}</p>
                </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 transition group-hover:text-black">
                Open
            </span>
        </button>
    );
};

const GuestDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const displayName = useMemo(
        () => user?.username || user?.email || t('guestFallback') || 'Guest',
        [user?.username, user?.email, t]
    );

    return (
        <div className="h-full bg-zinc-50 p-6 lg:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                            {t('myDashboard') || 'My Dashboard'}
                        </p>
                        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-black">
                            {t('guestDashboardTitle') || 'Guest Dashboard'}
                        </h1>
                        <p className="mt-2 text-sm font-medium text-zinc-500">
                            {t('welcomeUser', { username: displayName }) || `Welcome, ${displayName}!`}
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

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
                                <UserRound className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-extrabold text-black">{displayName}</h2>
                                <p className="mt-1 text-sm font-medium text-zinc-500">
                                    {t('guestAccessDesc') || 'Use your dashboard to reach booking help, view account details, and contact support quickly.'}
                                </p>
                            </div>
                        </div>

                        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                <dt className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                    {t('usernameLabel') || 'Username'}
                                </dt>
                                <dd className="mt-2 text-sm font-semibold text-black">{user?.username || '—'}</dd>
                            </div>
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
                                        {user?.roles?.[0] || 'ROLE_GUEST'}
                                    </span>
                                </dd>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                <dt className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                    Booking Support
                                </dt>
                                <dd className="mt-2 text-sm font-semibold text-black">{SUPPORT_EMAIL}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                            {t('quickLinks') || 'Quick Links'}
                        </h2>
                        <div className="mt-5 grid gap-3">
                            <ActionCard
                                icon={CalendarDays}
                                title={t('bookings') || 'Bookings'}
                                description="Open the booking assistance page and guest self-service links."
                                onClick={() => navigate('/bookings')}
                            />
                            <ActionCard
                                icon={BedDouble}
                                title={t('browseRoomsBtn') || 'Browse Rooms'}
                                description="Return to the public hotel pages and current offers."
                                onClick={() => navigate('/')}
                            />
                            <ActionCard
                                icon={Mail}
                                title={t('helpSupport') || 'Help & Support'}
                                description="Contact the hotel team with your confirmation number and stay dates."
                                href={SUPPORT_LINK}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <LifeBuoy className="h-5 w-5 text-zinc-700" />
                        <h2 className="text-lg font-extrabold text-black">Reservation Help</h2>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {[
                            'Keep your confirmation number ready before contacting the hotel.',
                            'Use the Bookings page for the fastest path to guest support and account actions.',
                            'If you need itinerary changes, contact the hotel directly so staff can review availability.',
                        ].map((item) => (
                            <div key={item} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-600">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestDashboard;
