import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthProvider'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import Bookings from './pages/Bookings'
import NotFound from './pages/NotFound'
import LoginPage from './pages/LoginPage'
import Unauthorized from './pages/Unauthorized'
import ManagerDashboard from './pages/ManagerDashboard'
import StaffDashboard from './pages/StaffDashboard'
import GuestDashboard from './pages/GuestDashboard'
import PrivateRoute from './components/PrivateRoute'
import ProtectedRoute from './components/ProtectedRoute'

/**
 * Navigation component - shows/hides links based on authentication status
 */
const Navigation = () => {
  const { isAuthenticated, user, logout, hasRole } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">
            Roomify
          </Link>
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Home
                </Link>
                <Link to="/bookings" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                  Bookings
                </Link>
                <Link
                  to="/login"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                {/* Show Rooms link ONLY if user is a Manager */}
                {hasRole('ROLE_MANAGER') && (
                  <Link to="/rooms" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                    Rooms
                  </Link>
                )}

                <span className="text-gray-700 text-sm">
                  Welcome, <span className="font-semibold">{user?.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

/**
 * AppContent component - handles routing logic
 */
const AppContent = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes */}
        <Route
          path="/rooms"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER']}>
              <Rooms />
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Routes with Role-Based Access */}
        <Route
          path="/manager/dashboard"
          element={
            <PrivateRoute allowedRoles={['ROLE_MANAGER']}>
              <ManagerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/dashboard"
          element={
            <PrivateRoute allowedRoles={['ROLE_STAFF']}>
              <StaffDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/guest/dashboard"
          element={
            <PrivateRoute allowedRoles={['ROLE_GUEST']}>
              <GuestDashboard />
            </PrivateRoute>
          }
        />

        {/* Fallback for unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

/**
 * Main App component
 * Wraps the entire app with AuthProvider for global authentication state
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
