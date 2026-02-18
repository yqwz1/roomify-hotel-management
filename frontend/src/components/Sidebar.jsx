import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

export default function Sidebar() {
  const location = useLocation()
  const { hasRole } = useAuth()

  // Base items visible to all authenticated users (or maybe just dashboard?)
  // Actually, dashboard links are role-specific usually.

  const menuItems = [];

  if (hasRole('ROLE_MANAGER')) {
    menuItems.push(
      { path: '/manager/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/room-types', label: 'Room Types', icon: '🏷️' },
      { path: '/staff', label: 'Staff', icon: '👥' },
      { path: '/rooms', label: 'Manage Rooms', icon: '🏨' },
      { path: '/bookings', label: 'All Bookings', icon: '📅' },
      { path: '/guests', label: 'Guest List', icon: '👤' },
      { path: '/settings', label: 'Settings', icon: '⚙️' }
    );
  } else if (hasRole('ROLE_STAFF')) {
    menuItems.push(
      { path: '/staff/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/bookings', label: 'Bookings', icon: '📅' },
      { path: '/check-in', label: 'Check-In/Out', icon: '🔑' },
      { path: '/housekeeping', label: 'Housekeeping', icon: '🧹' }
    );
  } else if (hasRole('ROLE_GUEST')) {
    menuItems.push(
      { path: '/guest/dashboard', label: 'My Dashboard', icon: '🏠' },
      { path: '/my-bookings', label: 'My Bookings', icon: '📅' },
      { path: '/profile', label: 'My Profile', icon: '👤' }
    );
  }

  return (
    <aside className="w-64 bg-white shadow-lg h-screen sticky top-0 flex-shrink-0">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-6">Menu</h2>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}