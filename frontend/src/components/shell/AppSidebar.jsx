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

import { Button } from "@/components/ui/button";
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
      {!isDesktop && (
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 [transition-timing-function:var(--ease-premium)] lg:hidden',
            isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          )}
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 z-50 w-[19rem] max-w-[86vw] overflow-hidden border-e border-white/8 bg-brand-ink text-white shadow-[0_24px_80px_-34px_rgba(0,0,0,0.78)] transition-[width,transform,opacity,border-color,box-shadow] duration-300 [transition-timing-function:var(--ease-premium)] lg:static lg:z-0 lg:max-w-none',
          isRtl ? 'left-auto right-0' : 'left-0 right-auto',
          isOpen ? 'translate-x-0 opacity-100' : isRtl ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0',
          isDesktop &&
          (isOpen
            ? 'lg:w-[19rem] lg:translate-x-0 lg:opacity-100'
            : 'lg:w-0 lg:min-w-0 lg:border-e-0 lg:shadow-none lg:pointer-events-none')
        )}
      >
        <div className="flex min-w-0 h-full flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="relative flex min-w-0 items-center justify-center">
              <Link to={homePath} onClick={handleNavigation} className="inline-flex min-w-0 items-center justify-center">
                <img
                  src="/roomify-mark-light.png"
                  alt={brandName}
                  className="h-12 w-auto object-contain select-none sm:h-14"
                  draggable={false}
                />
              </Link>

              <Button variant="unstyled" size="none"
                type="button"
                onClick={onClose}
                className="absolute end-0 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/55 transition hover:bg-white/10 hover:text-white lg:hidden"
                aria-label={t('closeNavigation')}
              >
                <X className="h-5 w-5 shrink-0" />
              </Button>
            </div>

            <div className="mt-5 min-w-0 rounded-md border border-white/8 bg-white/5 p-4">
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                {t('propertyOperations')}
              </p>
              <p className="mt-2 truncate text-sm font-semibold text-white">{roleLabel}</p>
              <p className="mt-1 truncate text-sm text-white/55">
                {user?.email || user?.username || t('user')}
              </p>
            </div>
          </div>

          <nav className="min-w-0 flex-1 overflow-y-auto px-4 py-5">
            {sections.map((section, index) => (
              <div key={`${section.id}-${index}`} className="mb-6 last:mb-0">
                <p className="truncate px-3 text-[11px] font-bold uppercase tracking-[0.24em] text-white/35">
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
                          'motion-press group relative flex min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-all duration-200',
                          isActive
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-white/65 hover:bg-white/8 hover:text-white hover:translate-x-0.5 rtl:hover:-translate-x-0.5'
                        )}
                      >
                        <span
                          className={cn(
                            'motion-active-indicator absolute inset-y-2 start-0 w-1 rounded-full bg-white',
                            isActive ? 'scale-y-100 opacity-80' : 'scale-y-50 opacity-0'
                          )}
                          aria-hidden="true"
                        />
                        <Icon
                          className={cn(
                            'h-4 w-4 flex-shrink-0 transition-colors',
                            isActive ? 'text-white' : 'text-white/55 group-hover:text-white'
                          )}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{item.label}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3 rounded-md border border-white/8 bg-white/5 px-3 py-3">
              <div className="flex min-w-0 h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-black uppercase text-white">
                {user?.username?.[0] || user?.email?.[0] || t('userInitial')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.username || user?.email || t('user')}
                </p>
                <p className="truncate text-xs text-white/55">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
