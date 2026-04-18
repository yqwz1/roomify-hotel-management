import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarDays,
    Home,
    LifeBuoy,
    LogIn,
    Mail,
    Search,
    ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { useTranslation } from 'react-i18next';

const SUPPORT_EMAIL = 'info@roomify.com';
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=Roomify%20Booking%20Support`;

const ActionCard = ({ icon: Icon, title, description, onClick, href, openLabel }) => {
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
                    {openLabel}
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
                {openLabel}
            </span>
        </button>
    );
};

export default function Bookings() {
    const navigate = useNavigate();
    const { isAuthenticated, hasRole } = useAuth();
    const { t, i18n } = useTranslation();

    const roleView = useMemo(() => {
        if (hasRole('ROLE_MANAGER') || hasRole('ROLE_STAFF')) return 'staff';
        if (hasRole('ROLE_GUEST')) return 'guest';
        return 'public';
    }, [hasRole]);

    const intro = roleView === 'staff'
        ? t('bookingsPage.introStaff')
        : roleView === 'guest'
            ? t('bookingsPage.introGuest')
            : t('bookingsPage.introPublic');

    const openLabel = t('openLabel');
    const supportTips = t('bookingsPage.supportTips', { returnObjects: true });
    const showSupportTips =
        !i18n.language?.startsWith('ar') &&
        Array.isArray(supportTips) &&
        supportTips.length > 0;

    return (
        <div className="h-full bg-zinc-50 p-6 lg:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        {t('bookings')}
                    </p>
                    <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-black">
                        {t('bookings')}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm font-medium text-zinc-500">{intro}</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="h-5 w-5 text-zinc-700" />
                            <h2 className="text-lg font-extrabold text-black">{t('bookingsPage.actionsTitle')}</h2>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {roleView === 'staff' ? (
                                <>
                                    <ActionCard
                                        icon={Search}
                                        title={t('checkInTitle')}
                                        description={t('bookingsPage.actionDescriptions.checkIn')}
                                        openLabel={openLabel}
                                        onClick={() => navigate('/check-in')}
                                    />
                                    <ActionCard
                                        icon={CalendarDays}
                                        title={t('modifyReservationTitle')}
                                        description={t('bookingsPage.actionDescriptions.modify')}
                                        openLabel={openLabel}
                                        onClick={() => navigate('/reservations/modify')}
                                    />
                                    <ActionCard
                                        icon={ShieldCheck}
                                        title={t('checkoutTitle')}
                                        description={t('bookingsPage.actionDescriptions.checkout')}
                                        openLabel={openLabel}
                                        onClick={() => navigate('/checkout')}
                                    />
                                    <ActionCard
                                        icon={Home}
                                        title={t('roomSearch')}
                                        description={t('bookingsPage.actionDescriptions.search')}
                                        openLabel={openLabel}
                                        onClick={() => navigate('/search')}
                                    />
                                </>
                            ) : roleView === 'guest' ? (
                                <>
                                    <ActionCard
                                        icon={CalendarDays}
                                        title={t('myDashboard')}
                                        description={t('bookingsPage.actionDescriptions.dashboard')}
                                        openLabel={openLabel}
                                        onClick={() => navigate('/guest/dashboard')}
                                    />
                                    <ActionCard
                                        icon={Home}
                                        title={t('browseRoomsBtn')}
                                        description={t('bookingsPage.actionDescriptions.browse')}
                                        openLabel={openLabel}
                                        onClick={() => navigate('/search')}
                                    />
                                    <ActionCard
                                        icon={Mail}
                                        title={t('bookingsPage.contactFrontDeskTitle')}
                                        description={t('bookingsPage.actionDescriptions.contactFrontDesk')}
                                        openLabel={openLabel}
                                        href={SUPPORT_LINK}
                                    />
                                </>
                            ) : (
                                <>
                                    <ActionCard
                                        icon={LogIn}
                                        title={t('signIn')}
                                        description={t('bookingsPage.actionDescriptions.signIn')}
                                        openLabel={openLabel}
                                        onClick={() => navigate('/login')}
                                    />
                                    <ActionCard
                                        icon={Home}
                                        title={t('browseRoomsBtn')}
                                        description={t('bookingsPage.actionDescriptions.browse')}
                                        openLabel={openLabel}
                                        onClick={() => navigate('/')}
                                    />
                                    <ActionCard
                                        icon={LifeBuoy}
                                        title={t('helpSupport')}
                                        description={t('bookingsPage.actionDescriptions.support')}
                                        openLabel={openLabel}
                                        href={SUPPORT_LINK}
                                    />
                                    <ActionCard
                                        icon={CalendarDays}
                                        title={t('guestDashboardTitle')}
                                        description={isAuthenticated ? t('bookingsPage.actionDescriptions.guestDashboardAuth') : t('bookingsPage.actionDescriptions.guestDashboardPublic')}
                                        openLabel={openLabel}
                                        onClick={() => navigate(isAuthenticated ? '/guest/dashboard' : '/login')}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {showSupportTips ? (
                        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-zinc-700" />
                                <h2 className="text-lg font-extrabold text-black">{t('bookingsPage.supportTitle')}</h2>
                            </div>
                            <div className="mt-5 space-y-3">
                                {supportTips.map((item) => (
                                    <div key={item} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-600">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
