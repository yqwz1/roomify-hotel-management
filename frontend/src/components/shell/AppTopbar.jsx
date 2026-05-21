import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthProvider';
import { LanguageSwitcher } from '../LanguageSwitcher';
import NotificationCenter from './NotificationCenter';
import {
  getPageMeta,
  getRoleDisplayLabel,
} from '../navigation/navConfig';

export default function AppTopbar({ isSidebarOpen, onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const roles = user?.roles ?? [];
  const homePath = '/';
  const pageMeta = getPageMeta(location.pathname, roles, t);
  const roleLabel = getRoleDisplayLabel(roles, t);
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
    <header className="sticky top-0 z-20 border-b border-brand-surface-border bg-brand-surface/90 backdrop-blur-xl">
      <div className="flex min-h-20 flex-wrap items-start gap-3 px-4 py-3 sm:items-center sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-2xl border border-brand-surface-border bg-white p-2.5 text-brand-ink-muted shadow-sm transition hover:border-brand-primary/30 hover:text-brand-primary-deep"
            aria-label={isSidebarOpen ? t('closeNavigation') : t('openNavigation')}
            aria-pressed={isSidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-brand-ink-muted">
              <span className="truncate">{pageMeta.sectionLabel}</span>
              <span className="text-brand-ink-hint">&middot;</span>
              <span className="truncate">{roleLabel}</span>
            </div>

            <div className="mt-1 flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-tight text-brand-ink sm:text-2xl">
                  {pageMeta.title}
                </h1>
                <p className="truncate text-sm font-medium text-brand-ink-muted">
                  {currentDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
          <NotificationCenter />
          <LanguageSwitcher />
          <Link
            to={homePath}
            className="inline-flex shrink-0 rounded-full border border-brand-surface-border bg-white px-3 py-2 text-sm font-bold text-brand-ink shadow-sm transition hover:border-brand-primary/30 hover:text-brand-primary-deep"
          >
            {t('homeNav')}
          </Link>

          <div className="hidden items-center gap-3 rounded-full border border-brand-surface-border bg-white/90 px-3 py-2 shadow-sm xl:flex">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-black uppercase text-white">
              {user?.username?.[0] || user?.email?.[0] || t('userInitial')}
            </div>
            <div className="min-w-0">
              <p className="max-w-[11rem] truncate text-sm font-semibold text-brand-ink">
                {user?.username || user?.email || t('user')}
              </p>
              <p className="text-xs text-brand-ink-muted">{roleLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-brand-surface-border bg-white px-3 py-2 text-sm font-semibold text-brand-ink shadow-sm transition hover:border-brand-primary/30 hover:text-brand-primary-deep"
            title={t('logout')}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
