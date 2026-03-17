import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Home, LifeBuoy, LogIn, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { useTranslation } from 'react-i18next';

const SUPPORT_EMAIL = 'info@roomify.com';
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=Roomify%20Booking%20Support`;

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

export default function Bookings() {
    const navigate = useNavigate();
    const { isAuthenticated, hasRole } = useAuth();
    const { t } = useTranslation();

    const roleView = useMemo(() => {
        if (hasRole('ROLE_MANAGER') || hasRole('ROLE_STAFF')) return 'staff';
        if (hasRole('ROLE_GUEST')) return 'guest';
        return 'public';
    }, [hasRole]);

    const intro = roleView === 'staff'
        ? 'Use the operational reservation tools below for check-in, checkout, and reservation updates.'
        : roleView === 'guest'
            ? 'Use this page to reach guest booking help, your dashboard, and hotel support.'
            : 'Sign in for hotel tools or contact the hotel with your confirmation number for booking assistance.';

    return (
        <div className="h-full bg-zinc-50 p-6 lg:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        {t('bookings') || 'Bookings'}
                    </p>
                    <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-black">
                        {t('bookings') || 'Bookings'}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm font-medium text-zinc-500">{intro}</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="h-5 w-5 text-zinc-700" />
                            <h2 className="text-lg font-extrabold text-black">Booking Actions</h2>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {roleView === 'staff' ? (
                                <>
                                    <ActionCard
                                        icon={Search}
                                        title={t('checkInTitle') || 'Check-In'}
                                        description="Look up a reservation and handle guest arrivals."
                                        onClick={() => navigate('/check-in')}
                                    />
                                    <ActionCard
                                        icon={CalendarDays}
                                        title={t('modifyReservationTitle') || 'Modify Reservation'}
                                        description="Update room assignments and reservation dates."
                                        onClick={() => navigate('/reservations/modify')}
                                    />
                                    <ActionCard
                                        icon={ShieldCheck}
                                        title={t('checkoutTitle') || 'Checkout'}
                                        description="Review bills and complete departures."
                                        onClick={() => navigate('/checkout')}
                                    />
                                    <ActionCard
                                        icon={Home}
                                        title={t('roomSearch') || 'Room Search'}
                                        description="Find available rooms for new reservations."
                                        onClick={() => navigate('/search')}
                                    />
                                </>
                            ) : roleView === 'guest' ? (
                                <>
                                    <ActionCard
                                        icon={CalendarDays}
                                        title={t('myDashboard') || 'My Dashboard'}
                                        description="Open your guest dashboard and booking assistance tools."
                                        onClick={() => navigate('/guest/dashboard')}
                                    />
                                    <ActionCard
                                        icon={Home}
                                        title={t('browseRoomsBtn') || 'Browse Rooms'}
                                        description="Return to the public hotel pages and offers."
                                        onClick={() => navigate('/')}
                                    />
                                    <ActionCard
                                        icon={LifeBuoy}
                                        title={t('helpSupport') || 'Help & Support'}
                                        description="Email the hotel team with your confirmation number."
                                        href={SUPPORT_LINK}
                                    />
                                    <ActionCard
                                        icon={LogIn}
                                        title={t('signIn') || 'Sign In'}
                                        description="Switch accounts or return to the login screen."
                                        onClick={() => navigate('/login')}
                                    />
                                </>
                            ) : (
                                <>
                                    <ActionCard
                                        icon={LogIn}
                                        title={t('signIn') || 'Sign In'}
                                        description="Access the hotel dashboard and reservation tools."
                                        onClick={() => navigate('/login')}
                                    />
                                    <ActionCard
                                        icon={Home}
                                        title={t('browseRoomsBtn') || 'Browse Rooms'}
                                        description="Return to the public Roomify landing page."
                                        onClick={() => navigate('/')}
                                    />
                                    <ActionCard
                                        icon={LifeBuoy}
                                        title={t('helpSupport') || 'Help & Support'}
                                        description="Contact the hotel team directly about an existing reservation."
                                        href={SUPPORT_LINK}
                                    />
                                    <ActionCard
                                        icon={CalendarDays}
                                        title="Guest Dashboard"
                                        description={isAuthenticated ? 'Open your current guest dashboard.' : 'Guest dashboard becomes available after sign-in.'}
                                        onClick={() => navigate(isAuthenticated ? '/guest/dashboard' : '/login')}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-zinc-700" />
                            <h2 className="text-lg font-extrabold text-black">Before You Contact Support</h2>
                        </div>
                        <div className="mt-5 space-y-3">
                            {[
                                'Keep your confirmation number available when requesting changes.',
                                'Include the guest name and stay dates so the hotel can locate the reservation quickly.',
                                'Use signed-in hotel tools for operational actions; guest requests still require hotel assistance.',
                            ].map((item) => (
                                <div key={item} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-600">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
