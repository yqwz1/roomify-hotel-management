import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthProvider';
import { LanguageSwitcher } from '../LanguageSwitcher';
import {
  getPageMeta,
  getRoleDisplayLabel,
} from '../navigation/navConfig';

export default function AppTopbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const roles = user?.roles ?? [];
  const homePath = '/';
  const pageMeta = getPageMeta(location.pathname, roles, t);
  const roleLabel = getRoleDisplayLabel(roles, t);
  const brandName = t('brandName');
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
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f3ed]/90 backdrop-blur-xl">
      <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-2xl border border-zinc-200 bg-white p-2.5 text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:text-black md:hidden"
            aria-label={t('openNavigation')}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-900/55">
              <span className="truncate">{pageMeta.sectionLabel}</span>
              <span className="text-zinc-300">•</span>
              <span className="truncate">{roleLabel}</span>
            </div>

            <div className="mt-1 flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black tracking-tight text-zinc-950">
                  {pageMeta.title}
                </h1>
                <p className="truncate text-sm font-medium text-zinc-500">
                  {currentDate}
                </p>
              </div>

              <Link
                to={homePath}
                className="hidden rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:text-black md:inline-flex"
              >
                {brandName}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <div className="hidden items-center gap-3 rounded-full border border-zinc-200 bg-white/90 px-3 py-2 shadow-sm sm:flex">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-black uppercase text-white">
              {user?.username?.[0] || user?.email?.[0] || t('userInitial')}
            </div>
            <div className="min-w-0">
              <p className="max-w-[11rem] truncate text-sm font-semibold text-zinc-950">
                {user?.username || user?.email || t('user')}
              </p>
              <p className="text-xs text-zinc-500">{roleLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:text-black"
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
