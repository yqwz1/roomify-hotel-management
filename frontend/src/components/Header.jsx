import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { Menu, LogOut, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { getDefaultRouteForRoles } from './navigation/navConfig';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';

/**
 * DesktopLink — pill nav link with animated underline on hover/active.
 * `route` is used for matching; `to` is the actual navigation target (may include hash).
 */
function DesktopLink({ to, route, hash, label, currentPath, currentHash }) {
  const isRouteActive = currentPath === route;
  const isHashMatch = hash ? currentHash === hash : !currentHash;
  const isActive = isRouteActive && isHashMatch;

  return (
    <Link
      to={to}
      className={`group relative text-sm font-semibold transition-colors ${
        isActive ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-950'
      }`}
    >
      {label}
      <span
        className={`absolute -bottom-1.5 left-0 h-[2px] bg-zinc-950 transition-all duration-300 ${
          isActive ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
        aria-hidden="true"
      />
    </Link>
  );
}

export default function Header({ onMenuToggle }) {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const { t } = useTranslation();
  const brandName = t('brandName');
  const dashboardPath = getDefaultRouteForRoles(user?.roles ?? []);
  const dashboardLabel = hasRole('ROLE_GUEST') ? t('myDashboard') : t('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Subtle shadow once the user scrolls past the hero
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const closeMobile = () => setMobileOpen(false);

  // Public route links shown on the marketing surface
  const publicLinks = [
    { to: '/', route: '/', hash: '', label: t('homeNav') },
    { to: '/pricing', route: '/pricing', hash: '', label: t('navPricing', { defaultValue: 'Pricing' }) },
    { to: '/compliance', route: '/compliance', hash: '', label: t('navCompliance', { defaultValue: 'Compliance' }) },
    { to: '/integrations', route: '/integrations', hash: '', label: t('navIntegrations', { defaultValue: 'Integrations' }) },
    { to: '/demo', route: '/demo', hash: '', label: t('navDemo', { defaultValue: 'Request a demo' }) },
  ];

  const authedLinks = [
    ...(isAuthenticated ? [{ to: dashboardPath, route: dashboardPath, hash: '', label: dashboardLabel }] : []),
    ...(isAuthenticated && hasRole('ROLE_MANAGER')
      ? [{ to: '/rooms-management', route: '/rooms-management', hash: '', label: t('roomsManagement') }]
      : []),
  ];

  const allLinks = [...publicLinks, ...authedLinks];

  const roleLabel = hasRole('ROLE_MANAGER')
    ? t('roleManager')
    : hasRole('ROLE_STAFF')
      ? t('roleStaff')
      : hasRole('ROLE_GUEST')
        ? t('roleGuest')
        : null;

  return (
    <header
      className={`sticky top-0 z-30 flex-shrink-0 border-b transition-all duration-300 ${
        scrolled
          ? 'border-zinc-200 bg-white/85 shadow-[0_2px_20px_-12px_rgba(0,0,0,0.18)] backdrop-blur-md'
          : 'border-transparent bg-white/70 backdrop-blur'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">

        {/* Left: hamburger + brand */}
        <div className="flex items-center gap-3">
          {/* Authenticated-shell hamburger (sidebar toggle) — preserved */}
          {isAuthenticated && onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
              aria-label={t('openNavigation')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Public Sheet drawer — visible on small screens for everyone (no AppShell sidebar) */}
          {!onMenuToggle && (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="lg:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition"
                  aria-label={t('openNavigation')}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[88%] max-w-sm flex-col bg-[#f7f3ed] p-0">
                <SheetHeader className="border-b border-zinc-200 px-6 py-5">
                  <SheetTitle className="text-left rtl:text-right text-xl font-black tracking-tighter text-zinc-950">
                    {brandName}
                  </SheetTitle>
                  <SheetDescription className="text-left rtl:text-right text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {t('hotelManagementSystem')}
                  </SheetDescription>
                </SheetHeader>

                <nav
                  className="flex flex-1 flex-col gap-1 px-3 py-5 overflow-y-auto"
                  aria-label={t('openNavigation')}
                >
                  <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
                    {t('navExploreSection', { defaultValue: 'Explore' })}
                  </p>
                  {allLinks.map(({ to, route, hash: linkHash, label }) => {
                    const active = pathname === route && (linkHash ? hash === linkHash : !hash);
                    return (
                      <SheetClose asChild key={`${route}${linkHash}`}>
                        <NavLink
                          to={to}
                          end={route === '/' && !linkHash}
                          onClick={closeMobile}
                          className={() =>
                            `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                              active
                                ? 'bg-zinc-950 text-white'
                                : 'text-zinc-700 hover:bg-white hover:text-zinc-950'
                            }`
                          }
                        >
                          <span>{label}</span>
                          <ArrowRight className="h-4 w-4 opacity-60 rtl:rotate-180" />
                        </NavLink>
                      </SheetClose>
                    );
                  })}
                </nav>

                <div className="border-t border-zinc-200 bg-white/60 px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      {t('language', { defaultValue: 'Language' })}
                    </span>
                    <LanguageSwitcher />
                  </div>

                  {!isAuthenticated ? (
                    <SheetClose asChild>
                      <Button
                        asChild
                        className="h-11 w-full rounded-full bg-zinc-950 text-sm font-bold text-white shadow-sm hover:bg-zinc-800"
                      >
                        <Link to="/login" onClick={closeMobile}>{t('signIn')}</Link>
                      </Button>
                    </SheetClose>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-[11px] font-bold uppercase text-white">
                          {user?.username?.[0] || user?.email?.[0] || t('userInitial')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-zinc-950">
                            {user?.username || t('user')}
                          </p>
                          {roleLabel && (
                            <p className="text-[11px] font-medium text-zinc-500">{roleLabel}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          closeMobile();
                          handleLogout();
                        }}
                        className="h-10 w-full justify-center gap-2 rounded-full border border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('logout')}
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}

          <Link to="/" className="group flex items-center gap-2 text-zinc-950">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-950 text-[11px] font-black text-white shadow-sm transition-transform group-hover:-rotate-3">
              R
            </span>
            <span className="text-xl font-black tracking-tighter">{brandName}</span>
          </Link>
        </div>

        {/* Center: Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {allLinks.map(({ to, route, hash: linkHash, label }) => (
            <DesktopLink
              key={`${route}${linkHash}`}
              to={to}
              route={route}
              hash={linkHash}
              label={label}
              currentPath={pathname}
              currentHash={hash}
            />
          ))}
        </nav>

        {/* Right: auth actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {!isAuthenticated ? (
            <Button
              asChild
              className="h-9 rounded-full bg-zinc-950 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 hover:shadow-md"
            >
              <Link to="/login">{t('signIn')}</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              {/* User chip – desktop */}
              <div className="hidden xl:flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950">
                  <span className="text-[10px] font-bold uppercase text-white">
                    {user?.username?.[0] || user?.email?.[0] || t('userInitial')}
                  </span>
                </div>
                <span className="max-w-[120px] truncate text-sm font-semibold text-zinc-950">
                  {user?.username || t('user')}
                </span>
                {roleLabel && (
                  <span className="border-s border-zinc-200 ps-2 text-[11px] font-medium text-zinc-500">
                    {roleLabel}
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950"
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
