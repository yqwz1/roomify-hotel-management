import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import RoomTypes from './pages/RoomTypes'
import Staff from './pages/Staff'
import Bookings from './pages/Bookings'
import NotFound from './pages/NotFound'
import LoginPage from './pages/LoginPage'
import Unauthorized from './pages/Unauthorized'
import ManagerDashboard from './pages/ManagerDashboard'
import StaffDashboard from './pages/StaffDashboard'
import GuestDashboard from './pages/GuestDashboard'
import PrivateRoute from './components/PrivateRoute'
import ProtectedRoute from './components/ProtectedRoute'

// Day 1 Sprint — new pages (mock data, no API)
import RoomsManagement from './pages/RoomsManagement'
import RoomSearch from './pages/RoomSearch'
import BookRoom from './pages/BookRoom'
import ConfirmationPage from './pages/ConfirmationPage'

// Day 4 Sprint — reservation management pages
import CheckIn from './pages/CheckIn'
import ModifyReservation from './pages/ModifyReservation'
import CancelReservation from './pages/CancelReservation'
import Checkout from './pages/Checkout'
import RoomStatus from './pages/RoomStatus'
import InvoicePreview from './pages/InvoicePreview'

import Layout from './components/Layout';

/**
 * AppContent component - handles routing logic
 */
const AppContent = () => {
  return (
    <div className="h-full bg-gray-50">
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
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER']}>
              <Layout showSidebar={true}><Staff /></Layout>
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

        {/* ── Day 1 Sprint: New Rooms / Booking Routes ── */}
        <Route
          path="/rooms-management"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER']}>
              <Layout showSidebar={true}><RoomsManagement /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_STAFF']}>
              <Layout showSidebar={true}><RoomSearch /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/book"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_STAFF']}>
              <Layout showSidebar={true}><BookRoom /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/confirmation"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_STAFF']}>
              <Layout showSidebar={true}><ConfirmationPage /></Layout>
            </ProtectedRoute>
          }
        />

        {/* ── Day 4 Sprint: Reservation Management Routes ── */}
        <Route
          path="/check-in"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_STAFF']}>
              <Layout showSidebar={true}><CheckIn /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reservations/modify"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_STAFF']}>
              <Layout showSidebar={true}><ModifyReservation /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reservations/cancel"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_STAFF']}>
              <Layout showSidebar={true}><CancelReservation /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Current Sprint: UI Scaffolding & Navigation */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_STAFF']}>
              <Layout showSidebar={true}><Checkout /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/room-status"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_STAFF']}>
              <Layout showSidebar={true}><RoomStatus /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoice-preview"
          element={
            <ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_STAFF']}>
              <Layout showSidebar={true}><InvoicePreview /></Layout>
            </ProtectedRoute>
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
