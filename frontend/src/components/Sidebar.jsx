import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { X, LayoutDashboard, Tag, Users, Settings, Search, CalendarDays, Key, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

const ICON_MAP = {
  '/manager/dashboard': LayoutDashboard,
  '/room-types': Tag,
  '/staff': Users,
  '/rooms-management': Settings,
  '/search': Search,
  '/bookings': CalendarDays,
  '/staff/dashboard': LayoutDashboard,
  '/check-in': Key,
  '/guest/dashboard': LayoutDashboard,
  '/checkout': CalendarDays,
  '/room-status': Sparkles,
  '/invoice-preview': CalendarDays,
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { hasRole, user } = useAuth()
  const { t } = useTranslation()
  const brandName = t('brandName')

  const menuItems = []

  if (hasRole('ROLE_MANAGER')) {
    menuItems.push(
      { path: '/manager/dashboard', label: t('dashboard') },
      { path: '/room-types', label: t('roomTypes') },
      { path: '/staff', label: t('staffMenu') },
      { path: '/rooms-management', label: t('roomsManagement') },
      { path: '/search', label: t('roomSearch') },
      { path: '/check-in', label: t('checkInOut') },
      { path: '/reservations/modify', label: t('modifyReservationTitle') },
      { path: '/reservations/cancel', label: t('cancelReservationTitle') },
      { path: '/checkout', label: t('checkoutTitle') },
      { path: '/room-status', label: t('roomStatus') },
      { path: '/invoice-preview', label: t('invoicePreview') },
    )
  } else if (hasRole('ROLE_STAFF')) {
    menuItems.push(
      { path: '/staff/dashboard', label: t('dashboard') },
      { path: '/search', label: t('roomSearch') },
      { path: '/check-in', label: t('checkInOut') },
      { path: '/reservations/modify', label: t('modifyReservationTitle') },
      { path: '/reservations/cancel', label: t('cancelReservationTitle') },
      { path: '/checkout', label: t('checkoutTitle') },
      { path: '/invoice-preview', label: t('invoicePreview') },
    )
  } else if (hasRole('ROLE_GUEST')) {
    menuItems.push(
      { path: '/guest/dashboard', label: t('myDashboard') },
      { path: '/bookings', label: t('bookings') },
    )
  }

  const roleLabel = hasRole('ROLE_MANAGER') ? t('roleManager') : hasRole('ROLE_STAFF') ? t('roleStaff') : t('roleGuest')

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 start-0 z-40 h-full w-64 bg-brand-ink flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-brand-surface-border">
          <div className="flex items-center">
            <span className="text-2xl font-black text-white tracking-tighter">{brandName}</span>
          </div>
          {/* Close button – mobile only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden p-2 rounded-full text-brand-ink-hint hover:text-white hover:bg-brand-primary-deep transition"
            aria-label={t('closeMenu')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = ICON_MAP[item.path] || LayoutDashboard
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold transition-all duration-200
                  ${isActive
                    ? 'bg-white text-brand-danger shadow-sm'
                    : 'text-brand-ink-hint hover:bg-brand-ink hover:text-white'
                  }
                `}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand-danger' : 'text-brand-ink-muted'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer – user info */}
        <div className="px-6 py-5 border-t border-brand-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary-deep border border-brand-surface-border flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white uppercase">
                {user?.username?.[0] || user?.email?.[0] || t('userInitial')}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.username || user?.email || t('user')}</p>
              <p className="text-xs font-medium text-brand-ink-muted">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
