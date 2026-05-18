import './i18n'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './context/AuthProvider'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Compliance from './pages/Compliance'
import Integrations from './pages/Integrations'
import Demo from './pages/Demo'
import Rooms from './pages/Rooms'
import RoomTypes from './pages/RoomTypes'
import Staff from './pages/Staff'
import Bookings from './pages/Bookings'
import NotFound from './pages/NotFound'
import LoginPage from './pages/LoginPage'
import Unauthorized from './pages/Unauthorized'
import ManagerDashboard from './pages/ManagerDashboard'
import AiFinanceDashboard from './pages/AiFinanceDashboard'
import StaffDashboard from './pages/StaffDashboard'
import StaffServiceRequests from './pages/StaffServiceRequests'
import GuestDashboard from './pages/GuestDashboard'
import GuestBillingStatus from './pages/GuestBillingStatus'
import GuestServiceRequests from './pages/GuestServiceRequests'
import ProtectedRoute from './components/ProtectedRoute'
import {
  GUEST_BILLING_STATUS_PATH,
  getDocumentTitle,
  ROLE_ADMIN,
  ROLE_GUEST,
  ROLE_MANAGER,
  ROLE_STAFF,
} from './components/navigation/navConfig'

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
import ReservationDetails from './pages/ReservationDetails'
import ReservationsWorkspace from './pages/ReservationsWorkspace'
import AdminDashboard from './pages/AdminDashboard'
import HotelServices from './pages/HotelServices'
import ExpenseTracker from './pages/ExpenseTracker'

import Layout from './components/Layout';

const ADMIN_ONLY_ROLES = [ROLE_ADMIN];
const MANAGER_ONLY_ROLES = [ROLE_MANAGER];
const STAFF_ONLY_ROLES = [ROLE_STAFF];
const GUEST_ONLY_ROLES = [ROLE_GUEST];
const STAFF_AND_MANAGER_ROLES = [ROLE_MANAGER, ROLE_STAFF];
const AUTHENTICATED_ROLES = [ROLE_MANAGER, ROLE_STAFF, ROLE_GUEST];

/**
 * AppContent component - handles routing logic
 */
const AppContent = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const roles = user?.roles;

  useEffect(() => {
    document.title = getDocumentTitle(location.pathname, roles ?? [], t);
  }, [location.pathname, roles, t, i18n.resolvedLanguage]);

  return (
    <div className="h-full bg-brand-surface-border">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout showSidebar={false}><Home /></Layout>} />
        <Route path="/pricing" element={<Layout showSidebar={false}><Pricing /></Layout>} />
        <Route path="/compliance" element={<Layout showSidebar={false}><Compliance /></Layout>} />
        <Route path="/integrations" element={<Layout showSidebar={false}><Integrations /></Layout>} />
        <Route path="/demo" element={<Layout showSidebar={false}><Demo /></Layout>} />
        <Route path="/bookings" element={<Layout showSidebar={false}><Bookings /></Layout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Layout showSidebar={Boolean(user)}><Unauthorized /></Layout>} />

        {/* Protected Routes */}
        <Route
          path="/room-types"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}>
              <Layout showSidebar={true}><RoomTypes /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}>
              <Layout showSidebar={true}><Staff /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rooms"
          element={
            <ProtectedRoute allowedRoles={MANAGER_ONLY_ROLES}>
              <Layout showSidebar={true}><Rooms /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Protected Dashboard Routes with Role-Based Access */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={MANAGER_ONLY_ROLES}>
              <Layout showSidebar={true}><ManagerDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/ai-finance"
          element={
            <ProtectedRoute allowedRoles={MANAGER_ONLY_ROLES}>
              <Layout showSidebar={true}><AiFinanceDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}>
              <Layout showSidebar={true}><AdminDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={STAFF_ONLY_ROLES}>
              <Layout showSidebar={true}><StaffDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/service-requests"
          element={
            <ProtectedRoute allowedRoles={STAFF_AND_MANAGER_ROLES}>
              <Layout showSidebar={true}><StaffServiceRequests /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/guest/dashboard"
          element={
            <ProtectedRoute allowedRoles={GUEST_ONLY_ROLES}>
              <Layout showSidebar={true}><GuestDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/guest/service-requests"
          element={
            <ProtectedRoute allowedRoles={GUEST_ONLY_ROLES}>
              <Layout showSidebar={true}><GuestServiceRequests /></Layout>
            </ProtectedRoute>
          }
        />

        {/* ── Day 1 Sprint: New Rooms / Booking Routes ── */}
        <Route
          path="/rooms-management"
          element={
            <ProtectedRoute allowedRoles={MANAGER_ONLY_ROLES}>
              <Layout showSidebar={true}><RoomsManagement /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <Layout showSidebar={true}><RoomSearch /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/book"
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <Layout showSidebar={true}><BookRoom /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/confirmation"
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <Layout showSidebar={true}><ConfirmationPage /></Layout>
            </ProtectedRoute>
          }
        />

        {/* ── Day 4 Sprint: Reservation Management Routes ── */}
        <Route
          path="/check-in"
          element={
            <ProtectedRoute allowedRoles={STAFF_AND_MANAGER_ROLES}>
              <Layout showSidebar={true}><CheckIn /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reservations/modify"
          element={
            <ProtectedRoute allowedRoles={STAFF_AND_MANAGER_ROLES}>
              <Layout showSidebar={true}><ModifyReservation /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reservations/cancel"
          element={
            <ProtectedRoute allowedRoles={STAFF_AND_MANAGER_ROLES}>
              <Layout showSidebar={true}><CancelReservation /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Current Sprint: UI Scaffolding & Navigation */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={STAFF_AND_MANAGER_ROLES}>
              <Layout showSidebar={true}><Checkout /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/room-status"
          element={
            <ProtectedRoute allowedRoles={MANAGER_ONLY_ROLES}>
              <Layout showSidebar={true}><RoomStatus /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoice-preview"
          element={
            <ProtectedRoute allowedRoles={STAFF_AND_MANAGER_ROLES}>
              <Layout showSidebar={true}><InvoicePreview /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reservations"
          element={
            <ProtectedRoute allowedRoles={STAFF_AND_MANAGER_ROLES}>
              <Layout showSidebar={true}><ReservationsWorkspace /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reservations/:confirmationNumber"
          element={
            <ProtectedRoute allowedRoles={STAFF_AND_MANAGER_ROLES}>
              <Layout showSidebar={true}><ReservationDetails /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path={GUEST_BILLING_STATUS_PATH}
          element={
            <ProtectedRoute allowedRoles={GUEST_ONLY_ROLES}>
              <Layout showSidebar={true}><GuestBillingStatus /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/services"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}>
              <Layout showSidebar={true}><HotelServices /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/expenses"
          element={
            <ProtectedRoute allowedRoles={MANAGER_ONLY_ROLES}>
              <Layout showSidebar={true}><ExpenseTracker /></Layout>
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
