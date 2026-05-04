import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { Menu, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { getDefaultRouteForRoles } from './navigation/navConfig';
import { Button } from '@/components/ui/button';

export default function Header({ onMenuToggle }) {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const brandName = t('brandName');
  const dashboardPath = getDefaultRouteForRoles(user?.roles ?? []);
  const dashboardLabel = hasRole('ROLE_GUEST') ? t('myDashboard') : t('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = hasRole('ROLE_MANAGER')
    ? t('roleManager')
    : hasRole('ROLE_STAFF')
      ? t('roleStaff')
      : hasRole('ROLE_GUEST')
        ? t('roleGuest')
        : null;

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">

        {/* Left: hamburger + brand */}
        <div className="flex items-center gap-3">
          {/* Hamburger – only visible on mobile when authenticated */}
          {isAuthenticated && onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
              aria-label={t('openNavigation')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <Link to="/" className="text-black">
            <span className="text-2xl font-black tracking-tighter">
              {brandName}
            </span>
          </Link>
        </div>

        {/* Center: Nav links – desktop only */}
        <nav className="hidden lg:flex items-center gap-8">
          <NavLink to="/" className={({ isActive }) => `text-sm font-medium transition ${isActive ? 'text-rose-900' : 'text-zinc-500 hover:text-black'}`}>
            {t('homeNav')}
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => `text-sm font-medium transition ${isActive ? 'text-rose-900' : 'text-zinc-500 hover:text-black'}`}>
            {t('bookings')}
          </NavLink>
          {isAuthenticated && (
            <NavLink to={dashboardPath} className={({ isActive }) => `text-sm font-medium transition ${isActive ? 'text-rose-900' : 'text-zinc-500 hover:text-black'}`}>
              {dashboardLabel}
            </NavLink>
          )}
          {isAuthenticated && hasRole('ROLE_MANAGER') && (
            <NavLink to="/rooms-management" className={({ isActive }) => `text-sm font-medium transition ${isActive ? 'text-rose-900' : 'text-zinc-500 hover:text-black'}`}>
              {t('roomsManagement')}
            </NavLink>
          )}
        </nav>

        {/* Right: auth actions */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {!isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Button asChild className="px-6 py-2 text-sm bg-black text-white rounded-full hover:bg-zinc-800 transition font-bold">
                <Link to="/login">
                  {t('signIn')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* User chip – desktop */}
              <div className="hidden xl:flex items-center gap-2 px-4 py-1.5 bg-white border border-zinc-200 rounded-full">
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-white uppercase">
                    {user?.username?.[0] || user?.email?.[0] || t('userInitial')}
                  </span>
                </div>
                <span className="text-sm font-medium text-black max-w-[120px] truncate">
                {user?.username || t('user')}
              </span>
                {roleLabel && (
                  <span className="text-xs text-zinc-400 border-s border-zinc-200 ps-2">{roleLabel}</span>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-black rounded-full transition font-medium border border-transparent hover:border-zinc-200"
                title={t('logout')}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">{t('logout')}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
