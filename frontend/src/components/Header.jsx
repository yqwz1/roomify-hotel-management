import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { Menu, Hotel, LogOut, ChevronDown } from 'lucide-react';

export default function Header({ onMenuToggle }) {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = hasRole('ROLE_MANAGER')
    ? 'Manager'
    : hasRole('ROLE_STAFF')
      ? 'Staff'
      : hasRole('ROLE_GUEST')
        ? 'Guest'
        : null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">

        {/* Left: hamburger + brand */}
        <div className="flex items-center gap-3">
          {/* Hamburger – only visible on mobile when authenticated */}
          {isAuthenticated && (
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2 text-gray-900">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600">
              <Hotel className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900 hidden sm:block">
              Roomify
            </span>
          </Link>
        </div>

        {/* Center: Nav links – desktop only */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">
            Home
          </Link>
          {!isAuthenticated && (
            <Link to="/bookings" className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">
              Bookings
            </Link>
          )}
          {isAuthenticated && hasRole('ROLE_MANAGER') && (
            <Link to="/rooms" className="text-sm text-gray-600 hover:text-blue-600 transition font-medium">
              Rooms
            </Link>
          )}
        </nav>

        {/* Right: auth actions */}
        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium"
              >
                Login
              </Link>
              <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                Sign Up
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* User chip – desktop */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-white uppercase">
                    {user?.username?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-800 max-w-[120px] truncate">
                  {user?.username || 'User'}
                </span>
                {roleLabel && (
                  <span className="text-xs text-gray-400 border-l border-gray-200 pl-2">{roleLabel}</span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}