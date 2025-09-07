import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';

// Layouts
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ForcePasswordChangePage } from './pages/auth/ForcePasswordChangePage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { InvitationResponsePage } from './pages/auth/InvitationResponsePage';

// Dashboard Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EventTypesPage } from './pages/event-types/EventTypesPage';
import { BookingsPage } from './pages/bookings/BookingsPage';
import { AvailabilityPage } from './pages/availability/AvailabilityPage';
import { ContactsPage } from './pages/contacts/ContactsPage';
import { WorkflowsPage } from './pages/workflows/WorkflowsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { IntegrationsPage } from './pages/integrations/IntegrationsPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { TeamManagementPage } from './pages/team/TeamManagementPage';

// Public Pages
import { PublicOrganizerPage } from './pages/public/PublicOrganizerPage';
import { PublicBookingPage } from './pages/public/PublicBookingPage';
import { BookingManagementPage } from './pages/public/BookingManagementPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check for force password change
  if (user?.account_status === 'password_expired' || user?.account_status === 'password_expired_grace_period') {
    return <Navigate to="/force-password-change" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Navigate to="/login" replace />} />
              
              {/* Auth Routes */}
              <Route path="login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              <Route path="register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />
              <Route path="forgot-password" element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              } />
              <Route path="reset-password" element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              } />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="invitation" element={<InvitationResponsePage />} />
              
              {/* Public Booking Pages */}
              <Route path=":organizerSlug" element={<PublicOrganizerPage />} />
              <Route path=":organizerSlug/:eventTypeSlug" element={<PublicBookingPage />} />
              <Route path="booking/:accessToken/manage" element={<BookingManagementPage />} />
            </Route>

            {/* Force Password Change (Special Route) */}
            <Route path="/force-password-change" element={<ForcePasswordChangePage />} />

            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="event-types/*" element={<EventTypesPage />} />
              <Route path="bookings/*" element={<BookingsPage />} />
              <Route path="availability/*" element={<AvailabilityPage />} />
              <Route path="contacts/*" element={<ContactsPage />} />
              <Route path="workflows/*" element={<WorkflowsPage />} />
              <Route path="notifications/*" element={<NotificationsPage />} />
              <Route path="integrations/*" element={<IntegrationsPage />} />
              <Route path="analytics/*" element={<AnalyticsPage />} />
              <Route path="settings/*" element={<SettingsPage />} />
              <Route path="team/*" element={<TeamManagementPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* Global Components */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;