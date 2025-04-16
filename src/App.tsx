import React, { useState, useEffect } from 'react';
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
import { SimpleToastProvider } from '@/components/ui/simple-toast';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { QuoteProvider } from '@/contexts/QuoteContext';
import { JobsProvider } from '@/contexts/JobContext';
import { CompanySettingsProvider as SupabaseCompanySettingsProvider } from '@/contexts/SupabaseCompanySettingsContext';
import { CompanySettingsProvider as LocalCompanySettingsProvider } from '@/contexts/CompanySettingsContext';

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

// Error boundary for CompanySettingsProvider
class SettingsErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("CompanySettings provider error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Use the local storage provider as fallback
      return <LocalCompanySettingsProvider>{this.props.children}</LocalCompanySettingsProvider>;
    }

    return this.props.children;
  }
}

// FallbackCompanySettingsProvider that tries Supabase first, falls back to local
function FallbackCompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const [useLocal, setUseLocal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase settings are available
    const checkSupabase = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        
        if (!supabaseUrl) {
          console.warn("Supabase URL not found, using localStorage for settings");
          setUseLocal(true);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking Supabase availability:", error);
        setUseLocal(true);
        setIsLoading(false);
      }
    };
    
    checkSupabase();
  }, []);
  
  if (isLoading) {
    return <div>Loading settings provider...</div>;
  }
  
  return useLocal ? (
    <LocalCompanySettingsProvider>{children}</LocalCompanySettingsProvider>
  ) : (
    <SettingsErrorBoundary>
      <SupabaseCompanySettingsProvider>{children}</SupabaseCompanySettingsProvider>
    </SettingsErrorBoundary>
  );
}

export function App() {
  return (
    <SimpleToastProvider>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <FallbackCompanySettingsProvider>
              <CustomerProvider>
                <QuoteProvider>
                  <JobsProvider>
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
                  </JobsProvider>
                </QuoteProvider>
              </CustomerProvider>
            </FallbackCompanySettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </SimpleToastProvider>
  );
} 