import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthProvider';
import { cn } from '../../lib/utils';
import {
  getDefaultRouteForRoles,
  getNavigationSections,
  getRoleDisplayLabel,
  isNavItemActive,
} from '../navigation/navConfig';

export default function AppSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const roles = user?.roles ?? [];
  const sections = getNavigationSections(roles, t);
  const homePath = getDefaultRouteForRoles(roles);
  const roleLabel = getRoleDisplayLabel(roles, t);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-50 w-[19rem] max-w-[86vw] border-e border-white/10 bg-[#191511] text-zinc-100 shadow-2xl transition-transform duration-300 md:static md:z-0 md:max-w-none md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <Link to={homePath} onClick={onClose} className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-200/70">
                  Roomify
                </p>
                <p className="mt-1 truncate text-2xl font-black tracking-tight text-white">
                  Hotel Console
                </p>
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white md:hidden"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-400">
                Property Operations
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{roleLabel}</p>
              <p className="mt-1 truncate text-sm text-zinc-400">
                {user?.email || user?.username || translateWithFallback(t, 'user', 'User')}
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5">
            {sections.map((section) => (
              <div key={section.id} className="mb-6 last:mb-0">
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
                        onClick={onClose}
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
                {user?.username?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.username || user?.email || translateWithFallback(t, 'user', 'User')}
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

function translateWithFallback(t, translationKey, fallbackLabel) {
  const translated = t(translationKey);
  return translated === translationKey ? fallbackLabel : translated;
}
