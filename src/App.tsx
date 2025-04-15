import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { SignIn } from '@/components/auth/SignIn';
import { SignUp } from '@/components/auth/SignUp';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { QuotesPage } from '@/pages/quotes/QuotesPage';
import { CreateQuotePage } from '@/pages/quotes/CreateQuotePage';
import { QuoteDetailsPage } from '@/pages/quotes/QuoteDetailsPage';
import { JobsPage } from '@/pages/quotes/JobsPage';
import { CreateJobPage } from '@/pages/quotes/CreateJobPage';
import { JobDetailsPage } from '@/pages/quotes/JobDetailsPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { CreateCustomerPage } from '@/pages/customers/CreateCustomerPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { UserManagementPage } from '@/pages/settings/UserManagementPage';
import { PricebookPage } from '@/pages/PricebookPage';
import { Toaster } from '@/components/ui/toaster';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { QuoteProvider } from '@/contexts/QuoteContext';
import { JobsProvider } from '@/contexts/JobContext';

// Create a separate redirect component for quotes
function QuoteRedirect() {
  const location = useLocation();
  const quoteId = location.pathname.split('/').pop();
  return <Navigate to={`/pricebook?quoteId=${quoteId}`} replace />;
}

// Create a separate redirect component for jobs
function JobRedirect() {
  const location = useLocation();
  const jobId = location.pathname.split('/').pop();
  return <Navigate to={`/pricebook?jobId=${jobId}`} replace />;
}

export function App() {
  return (
    <CustomerProvider>
      <QuoteProvider>
        <JobsProvider>
          <BrowserRouter>
            <ThemeProvider>
              <AuthProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/auth/signin" element={<SignIn />} />
                  <Route path="/auth/signup" element={<SignUp />} />

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pricebook"
                    element={
                      <ProtectedRoute>
                        <PricebookPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pricebook/edit/:quoteId"
                    element={
                      <ProtectedRoute>
                        <PricebookPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Quote routes (legacy) */}
                  <Route
                    path="/quotes"
                    element={
                      <ProtectedRoute>
                        <QuotesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quotes/new"
                    element={
                      <ProtectedRoute>
                        <CreateQuotePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quotes/:id"
                    element={
                      <ProtectedRoute>
                        <QuoteRedirect />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quotes/:id/details"
                    element={
                      <ProtectedRoute>
                        <QuoteDetailsPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Job routes (new) */}
                  <Route
                    path="/jobs"
                    element={
                      <ProtectedRoute>
                        <JobsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/jobs/new"
                    element={
                      <ProtectedRoute>
                        <CreateJobPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/jobs/:id"
                    element={
                      <ProtectedRoute>
                        <JobRedirect />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/jobs/:id/details"
                    element={
                      <ProtectedRoute>
                        <JobDetailsPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/customers"
                    element={
                      <ProtectedRoute>
                        <CustomersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customers/new"
                    element={
                      <ProtectedRoute>
                        <CreateCustomerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/user-management"
                    element={
                      <AdminRoute>
                        <UserManagementPage />
                      </AdminRoute>
                    }
                  />

                  {/* Redirects */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                <Toaster />
              </AuthProvider>
            </ThemeProvider>
          </BrowserRouter>
        </JobsProvider>
      </QuoteProvider>
    </CustomerProvider>
  );
} 