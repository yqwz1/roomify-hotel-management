import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export default function Header() {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <span>🏨</span> Roomify
          </Link>

          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Home
            </Link>

            {/* Public Links */}
            {!isAuthenticated && (
              <>
                <Link to="/bookings" className="text-gray-700 hover:text-blue-600 transition font-medium">
                  Bookings
                </Link>
              </>
            )}

            {/* Manager Links */}
            {isAuthenticated && hasRole('ROLE_MANAGER') && (
              <Link to="/rooms" className="text-gray-700 hover:text-blue-600 transition font-medium">
                Rooms
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition font-medium">
                  Login
                </Link>
                <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">
                  Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700 hidden sm:block">
                  Welcome, <span className="font-semibold">{user?.username || 'User'}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}