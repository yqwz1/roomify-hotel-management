import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import RoomTypes from './pages/RoomTypes'
import Bookings from './pages/Bookings'
import NotFound from './pages/NotFound'
import LoginPage from './pages/LoginPage'
import Unauthorized from './pages/Unauthorized'
import ManagerDashboard from './pages/ManagerDashboard'
import StaffDashboard from './pages/StaffDashboard'
import GuestDashboard from './pages/GuestDashboard'
import PrivateRoute from './components/PrivateRoute'
import ProtectedRoute from './components/ProtectedRoute'

import Layout from './components/Layout';

/**
 * AppContent component - handles routing logic
 */
const AppContent = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout showSidebar={false}><Home /></Layout>} />
        <Route path="/bookings" element={<Layout showSidebar={false}><Bookings /></Layout>} />
        <Route path="/login" element={<Layout showSidebar={false}><LoginPage /></Layout>} />
        <Route path="/unauthorized" element={<Layout showSidebar={false}><Unauthorized /></Layout>} />

        {/* Protected Routes */}
        <Route
          path="/room-types"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER']}>
              <Layout showSidebar={true}><RoomTypes /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rooms"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER']}>
              <Layout showSidebar={true}><Rooms /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Routes with Role-Based Access */}
        <Route
          path="/manager/dashboard"
          element={
            <PrivateRoute allowedRoles={['ROLE_MANAGER']}>
              <Layout showSidebar={true}><ManagerDashboard /></Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/dashboard"
          element={
            <PrivateRoute allowedRoles={['ROLE_STAFF']}>
              <Layout showSidebar={true}><StaffDashboard /></Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/guest/dashboard"
          element={
            <PrivateRoute allowedRoles={['ROLE_GUEST']}>
              <Layout showSidebar={true}><GuestDashboard /></Layout>
            </PrivateRoute>
          }
        />

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Layout showSidebar={false}><NotFound /></Layout>} />
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
