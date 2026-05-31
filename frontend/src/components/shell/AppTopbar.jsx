import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthProvider';
import { LanguageSwitcher } from '../LanguageSwitcher';
import NotificationCenter from './NotificationCenter';
import {
  getPrimaryRole,
  getPageMeta,
  getRoleDisplayLabel,
  ROLE_ADMIN,
} from '../navigation/navConfig';

import { Button } from "@/components/ui/button";
export default function AppTopbar({ isSidebarOpen, onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const roles = user?.roles ?? [];
  const primaryRole = getPrimaryRole(roles);
  const homePath = '/';
  const pageMeta = getPageMeta(location.pathname, roles, t);
  const roleLabel = getRoleDisplayLabel(roles, t);
  const showNotificationCenter = primaryRole !== ROLE_ADMIN;
  const currentDate = new Intl.DateTimeFormat(i18n.language?.startsWith('ar') ? 'ar-SA' : 'en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-brand-surface/78 shadow-[0_16px_44px_-34px_rgba(6,22,34,0.55)] backdrop-blur-xl">
      <div className="flex min-w-0 min-h-20 flex-wrap items-start gap-3 px-4 py-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:items-center sm:px-6 sm:pt-3 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button variant="unstyled" size="none"
            type="button"
            onClick={onMenuToggle}
            className="rounded-2xl border border-brand-surface-border bg-white/90 p-3 text-brand-ink-muted shadow-sm transition hover:border-brand-primary/40 hover:bg-white hover:text-brand-primary-deep"
            aria-label={isSidebarOpen ? t('closeNavigation') : t('openNavigation')}
            aria-pressed={isSidebarOpen}
          >
            <Menu className="h-5 w-5 shrink-0" />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-brand-lagoon">
              <span className="min-w-0 truncate">{pageMeta.sectionLabel}</span>
              <span className="shrink-0 text-brand-ink-hint break-words">&middot;</span>
              <span className="min-w-0 truncate">{roleLabel}</span>
            </div>

            <div className="mt-1 flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <h1 className="truncate font-heading text-xl font-black tracking-tight text-brand-ink sm:text-2xl">
                  {pageMeta.title}
                </h1>
                <p className="truncate text-sm font-medium text-brand-ink-muted">
                  {currentDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
          {showNotificationCenter ? <NotificationCenter /> : null}
          <div className="sm:hidden">
            <LanguageSwitcher />
          </div>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <Link
            to={homePath}
            className="inline-flex min-w-0 shrink-0 rounded-full border border-brand-surface-border bg-white px-3 py-2 text-sm font-bold text-brand-ink shadow-sm transition hover:border-brand-primary/40 hover:text-brand-primary-deep max-[380px]:hidden"
          >
            {t('homeNav')}
          </Link>
          <Link
            to="/settings"
            className="inline-flex min-w-0 shrink-0 items-center gap-2 rounded-full border border-brand-surface-border bg-white px-3 py-2 text-sm font-bold text-brand-ink shadow-sm transition hover:border-brand-primary/40 hover:text-brand-primary-deep"
            title={t('settingsTitle', { defaultValue: 'Settings' })}
          >
            <Settings2 className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">{t('settingsTitle', { defaultValue: 'Settings' })}</span>
          </Link>

          <div className="hidden items-center gap-3 rounded-full border border-brand-surface-border bg-white/80 px-3 py-2 shadow-sm backdrop-blur xl:flex">
            <div className="flex min-w-0 h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-black uppercase text-white shadow-[0_12px_30px_-18px_rgba(18,179,168,0.95)]">
              {user?.username?.[0] || user?.email?.[0] || t('userInitial')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="max-w-[11rem] truncate text-sm font-semibold text-brand-ink">
                {user?.username || user?.email || t('user')}
              </p>
              <p className="text-xs text-brand-ink-muted break-words">{roleLabel}</p>
            </div>
          </div>

          <Button variant="unstyled" size="none"
            type="button"
            onClick={handleLogout}
            className="inline-flex min-w-0 shrink-0 items-center gap-2 rounded-full border border-brand-surface-border bg-white px-3 py-2 text-sm font-semibold text-brand-ink shadow-sm transition hover:border-brand-primary/30 hover:text-brand-primary-deep"
            title={t('logout')}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{t('logout')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
