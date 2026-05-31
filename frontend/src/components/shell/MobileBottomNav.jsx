import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  LayoutDashboard,
  Menu,
  Receipt,
  Search,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthProvider';
import { cn } from '../../lib/utils';
import {
  GUEST_BILLING_STATUS_PATH,
  getPrimaryRole,
  isNavItemActive,
  ROLE_ADMIN,
  ROLE_GUEST,
  ROLE_MANAGER,
  ROLE_STAFF,
} from '../navigation/navConfig';

import { Button } from "@/components/ui/button";
const MOBILE_NAV_ITEMS = {
  [ROLE_ADMIN]: [
    { path: '/admin/dashboard', labelKey: 'adminDashboardTitle', fallback: 'Dashboard', icon: LayoutDashboard },
    { path: '/staff', labelKey: 'staffMenu', fallback: 'Staff', icon: CalendarDays },
    { path: '/room-types', labelKey: 'roomTypes', fallback: 'Room Types', icon: Receipt },
  ],
  [ROLE_MANAGER]: [
    { path: '/manager/dashboard', labelKey: 'managerDashboardTitle', fallback: 'Dashboard', icon: LayoutDashboard },
    { path: '/reservations', labelKey: 'navReservations', fallback: 'Reservations', icon: CalendarDays },
    { path: '/manager/expenses', labelKey: 'expenseTrackerTitle', fallback: 'Expenses', icon: Receipt },
    { path: '/manager/ai-finance', labelKey: 'aiFinanceTitle', fallback: 'AI Finance', icon: Sparkles },
  ],
  [ROLE_STAFF]: [
    { path: '/staff/dashboard', labelKey: 'staffDashboardTitle', fallback: 'Dashboard', icon: LayoutDashboard },
    { path: '/reservations', labelKey: 'navReservations', fallback: 'Reservations', icon: CalendarDays },
    { path: '/search', labelKey: 'roomSearch', fallback: 'Search', icon: Search },
    { path: '/staff/service-requests', labelKey: 'navServiceRequests', fallback: 'Requests', icon: Receipt },
  ],
  [ROLE_GUEST]: [
    { path: '/guest/dashboard', labelKey: 'guestDashboardTitle', fallback: 'Dashboard', icon: LayoutDashboard },
    { path: '/search', labelKey: 'navBrowseRooms', fallback: 'Rooms', icon: Search },
    { path: '/guest/service-requests', labelKey: 'navRequestService', fallback: 'Service', icon: CalendarDays },
    { path: GUEST_BILLING_STATUS_PATH, labelKey: 'navBillingStatus', fallback: 'Billing', icon: Receipt },
  ],
};

export default function MobileBottomNav({ onOpenMenu }) {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const primaryRole = getPrimaryRole(user?.roles ?? []);
  const items = MOBILE_NAV_ITEMS[primaryRole] ?? [];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-brand-surface/80 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-22px_54px_-36px_rgba(6,22,34,0.6)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid min-w-0 max-w-3xl grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-1 rounded-[1.4rem] border border-white/70 bg-white/72 p-1 shadow-sm">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(location.pathname, item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-center transition duration-200 active:scale-[0.98]',
                isActive
                  ? 'roomify-luxe-gradient text-white shadow-sm'
                  : 'text-brand-ink-muted hover:bg-white hover:text-brand-ink'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="w-full truncate text-[11px] font-bold">
                {t(item.labelKey, { defaultValue: item.fallback })}
              </span>
            </Link>
          );
        })}

        <Button variant="unstyled" size="none"
          type="button"
          onClick={onOpenMenu}
          className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-center text-brand-ink-muted transition duration-200 hover:bg-white hover:text-brand-ink active:scale-[0.98]"
          aria-label={t('openNavigation')}
        >
          <Menu className="h-4 w-4 flex-shrink-0" />
          <span className="w-full truncate text-[11px] font-bold">
            {t('menu', { defaultValue: 'Menu' })}
          </span>
        </Button>
      </div>
    </nav>
  );
}
