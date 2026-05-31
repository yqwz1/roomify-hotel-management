import './i18n'
import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import {
  GUEST_BILLING_STATUS_PATH,
  getDocumentTitle,
  ROLE_ADMIN,
  ROLE_GUEST,
  ROLE_MANAGER,
  ROLE_STAFF,
} from './components/navigation/navConfig'

import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Compliance = lazy(() => import('./pages/Compliance'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Demo = lazy(() => import('./pages/Demo'));
const Rooms = lazy(() => import('./pages/Rooms'));
const RoomTypes = lazy(() => import('./pages/RoomTypes'));
const Staff = lazy(() => import('./pages/Staff'));
const Bookings = lazy(() => import('./pages/Bookings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const AiFinanceDashboard = lazy(() => import('./pages/AiFinanceDashboard'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));
const StaffGuestInbox = lazy(() => import('./pages/StaffGuestInbox'));
const StaffServiceRequests = lazy(() => import('./pages/StaffServiceRequests'));
const GuestDashboard = lazy(() => import('./pages/GuestDashboard'));
const GuestBillingStatus = lazy(() => import('./pages/GuestBillingStatus'));
const DemoPaymentGateway = lazy(() => import('./pages/DemoPaymentGateway'));
const PaymentHistory = lazy(() => import('./pages/PaymentHistory'));
const GuestServiceRequests = lazy(() => import('./pages/GuestServiceRequests'));
const RoomsManagement = lazy(() => import('./pages/RoomsManagement'));
const RoomSearch = lazy(() => import('./pages/RoomSearch'));
const RoomDetails = lazy(() => import('./pages/RoomDetails'));
const BookRoom = lazy(() => import('./pages/BookRoom'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const ModifyReservation = lazy(() => import('./pages/ModifyReservation'));
const CancelReservation = lazy(() => import('./pages/CancelReservation'));
const Checkout = lazy(() => import('./pages/Checkout'));
const RoomStatus = lazy(() => import('./pages/RoomStatus'));
const InvoicePreview = lazy(() => import('./pages/InvoicePreview'));
const ReservationDetails = lazy(() => import('./pages/ReservationDetails'));
const ReservationsWorkspace = lazy(() => import('./pages/ReservationsWorkspace'));
const RoomGrid = lazy(() => import('./pages/RoomGrid'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const HotelServices = lazy(() => import('./pages/HotelServices'));
const ExpenseTracker = lazy(() => import('./pages/ExpenseTracker'));

const ADMIN_ONLY_ROLES = [ROLE_ADMIN];
const MANAGER_ONLY_ROLES = [ROLE_MANAGER];
const STAFF_ONLY_ROLES = [ROLE_STAFF];
const GUEST_ONLY_ROLES = [ROLE_GUEST];
const STAFF_AND_MANAGER_ROLES = [ROLE_MANAGER, ROLE_STAFF];
const ADMIN_STAFF_MANAGER_ROLES = [ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF];
const PAYMENT_MANAGER_ROLES = [ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF];

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="roomify-premium-card flex min-w-0 items-center gap-3 rounded-[1.5rem] px-5 py-4 text-sm font-bold text-brand-ink-muted">
        <span className="roomify-processing-dot h-2.5 w-2.5 rounded-full bg-brand-primary" />
        Loading Roomify workspace...
      </div>
    </div>
  );
}

/**
 * AppContent component - handles routing logic
 */
const AppContent = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const roles = user?.roles;
  const showFrontDeskSidebar = Array.isArray(roles)
    && roles.some((role) => STAFF_AND_MANAGER_ROLES.includes(role));

  useEffect(() => {
    document.title = getDocumentTitle(location.pathname, roles ?? [], t);
  }, [location.pathname, roles, t, i18n.resolvedLanguage]);

  const appDirection = i18n.dir(i18n.resolvedLanguage || i18n.language) === 'rtl' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = appDirection;
    document.documentElement.lang = i18n.resolvedLanguage || i18n.language || 'en';
  }, [appDirection, i18n.language, i18n.resolvedLanguage]);

  return (
    <div className="h-full bg-brand-surface-border" dir={appDirection}>
      <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout showSidebar={false}><Home /></Layout>} />
        <Route path="/pricing" element={<Layout showSidebar={false}><Pricing /></Layout>} />
        <Route path="/compliance" element={<Layout showSidebar={false}><Compliance /></Layout>} />
        <Route path="/integrations" element={<Layout showSidebar={false}><Integrations /></Layout>} />
        <Route path="/demo" element={<Layout showSidebar={false}><Demo /></Layout>} />
        <Route path="/bookings" element={<Layout showSidebar={false}><Bookings /></Layout>} />
        <Route
          path="/search"
          element={<Layout showSidebar={showFrontDeskSidebar}><RoomSearch /></Layout>}
        />
        <Route path="/rooms/:roomId" element={<Layout showSidebar={false}><RoomDetails /></Layout>} />
        <Route
          path="/book"
          element={<Layout showSidebar={showFrontDeskSidebar}><BookRoom /></Layout>}
        />
        <Route
          path="/confirmation"
          element={<Layout showSidebar={showFrontDeskSidebar}><ConfirmationPage /></Layout>}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
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
          path="/staff/guest-inbox"
          element={
            <ProtectedRoute allowedRoles={STAFF_AND_MANAGER_ROLES}>
              <Layout showSidebar={true}><StaffGuestInbox /></Layout>
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
        <Route
          path="/guest/payments/:confirmationNumber"
          element={
            <ProtectedRoute allowedRoles={GUEST_ONLY_ROLES}>
              <Layout showSidebar={true}><DemoPaymentGateway /></Layout>
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
            <ProtectedRoute allowedRoles={ADMIN_STAFF_MANAGER_ROLES}>
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
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={PAYMENT_MANAGER_ROLES}>
              <Layout showSidebar={true}><PaymentHistory /></Layout>
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
          path="/room-grid"
          element={
            <ProtectedRoute allowedRoles={STAFF_AND_MANAGER_ROLES}>
              <Layout showSidebar={true}><RoomGrid /></Layout>
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
      </Suspense>
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
