import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthProvider';
import { cn } from '../../lib/utils';
import {
  getNavigationSections,
  getRoleDisplayLabel,
  isNavItemActive,
} from '../navigation/navConfig';

export default function AppSidebar({ isOpen, isDesktop = false, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const brandName = t('brandName');
  const isRtl = i18n.dir() === 'rtl';

  const roles = user?.roles ?? [];
  const sections = getNavigationSections(roles, t);
  const homePath = '/';
  const roleLabel = getRoleDisplayLabel(roles, t);

  const handleNavigation = () => {
    if (!isDesktop) {
      onClose();
    }
  };

  return (
    <>
      {!isDesktop && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 z-50 w-[19rem] max-w-[86vw] overflow-hidden border-e border-white/10 bg-zinc-950 text-zinc-100 shadow-2xl transition-[width,transform,opacity,border-color] duration-300 lg:static lg:z-0 lg:max-w-none',
          isRtl ? 'left-auto right-0' : 'left-0 right-auto',
          isOpen ? 'translate-x-0 opacity-100' : isRtl ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0',
          isDesktop &&
            (isOpen
              ? 'lg:w-[19rem] lg:translate-x-0 lg:opacity-100'
              : 'lg:w-0 lg:min-w-0 lg:border-e-0 lg:shadow-none lg:pointer-events-none')
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <Link to={homePath} onClick={handleNavigation} className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">
                  {brandName}
                </p>
                <p className="mt-1 truncate text-2xl font-black tracking-tight text-white">
                  {t('hotelConsole')}
                </p>
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white lg:hidden"
                aria-label={t('closeNavigation')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                {t('propertyOperations')}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{roleLabel}</p>
              <p className="mt-1 truncate text-sm text-zinc-400">
                {user?.email || user?.username || t('user')}
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5">
            {sections.map((section, index) => (
              <div key={`${section.id}-${index}`} className="mb-6 last:mb-0">
                <p className="px-3 text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  {section.label}
                </p>

                <div className="mt-2 space-y-1.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isNavItemActive(location.pathname, item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleNavigation}
                        className={cn(
                          'group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200',
                          isActive
                            ? 'bg-white text-zinc-950 shadow-lg shadow-black/20'
                            : 'text-zinc-300 hover:bg-white/8 hover:text-white'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border transition-colors',
                            isActive
                              ? 'border-zinc-200 bg-zinc-100 text-zinc-950'
                              : 'border-white/10 bg-white/5 text-zinc-400 group-hover:border-white/20 group-hover:text-white'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.label}</p>
                          <p
                            className={cn(
                              'truncate text-xs',
                              isActive ? 'text-zinc-500' : 'text-zinc-500 group-hover:text-zinc-400'
                            )}
                          >
                            {section.label}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 px-5 py-4">
            <div className="flex items-center gap-3 rounded-3xl bg-white/5 px-3 py-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black uppercase text-zinc-950">
                {user?.username?.[0] || user?.email?.[0] || t('userInitial')}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.username || user?.email || t('user')}
                </p>
                <p className="truncate text-xs text-zinc-400">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
