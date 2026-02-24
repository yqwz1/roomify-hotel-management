import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { X, LayoutDashboard, Tag, Users, Hotel, Settings, Search, CalendarDays, User, Key, Sparkles } from 'lucide-react'

const ICON_MAP = {
  '/manager/dashboard': LayoutDashboard,
  '/room-types': Tag,
  '/staff': Users,
  '/rooms': Hotel,
  '/rooms-management': Settings,
  '/search': Search,
  '/bookings': CalendarDays,
  '/guests': User,
  '/settings': Settings,
  '/staff/dashboard': LayoutDashboard,
  '/book': CalendarDays,
  '/check-in': Key,
  '/housekeeping': Sparkles,
  '/guest/dashboard': LayoutDashboard,
  '/my-bookings': CalendarDays,
  '/profile': User,
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { hasRole, user } = useAuth()

  const menuItems = []

  if (hasRole('ROLE_MANAGER')) {
    menuItems.push(
      { path: '/manager/dashboard', label: 'Dashboard' },
      { path: '/room-types', label: 'Room Types' },
      { path: '/staff', label: 'Staff' },
      { path: '/rooms', label: 'Manage Rooms' },
      { path: '/rooms-management', label: 'Rooms Management' },
      { path: '/search', label: 'Room Search' },
      { path: '/bookings', label: 'All Bookings' },
      { path: '/guests', label: 'Guest List' },
      { path: '/settings', label: 'Settings' },
    )
  } else if (hasRole('ROLE_STAFF')) {
    menuItems.push(
      { path: '/staff/dashboard', label: 'Dashboard' },
      { path: '/search', label: 'Room Search' },
      { path: '/book', label: 'Book Room' },
      { path: '/bookings', label: 'Bookings' },
      { path: '/check-in', label: 'Check-In/Out' },
      { path: '/housekeeping', label: 'Housekeeping' },
    )
  } else if (hasRole('ROLE_GUEST')) {
    menuItems.push(
      { path: '/guest/dashboard', label: 'My Dashboard' },
      { path: '/my-bookings', label: 'My Bookings' },
      { path: '/profile', label: 'My Profile' },
    )
  }

  const roleLabel = hasRole('ROLE_MANAGER') ? 'Manager' : hasRole('ROLE_STAFF') ? 'Staff' : 'Guest'

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
          fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 flex flex-col shadow-xl
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500">
              <Hotel className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Roomify</span>
          </div>
          {/* Close button – mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
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
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer – user info */}
        <div className="px-4 py-4 border-t border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-300 uppercase">
                {user?.username?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.username || user?.email || 'User'}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}