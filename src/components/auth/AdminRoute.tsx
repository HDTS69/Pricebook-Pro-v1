import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileRole, setProfileRole] = useState<string | null>(null);

  // Check role directly from profiles table as a fallback
  useEffect(() => {
    async function checkProfileRole() {
      if (!user || profileChecked) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile role:', error);
        } else if (data) {
          setProfileRole(data.role);
        }
      } catch (error) {
        console.error('Error in profile check:', error);
      } finally {
        setProfileChecked(true);
      }
    }
    
    checkProfileRole();
  }, [user, profileChecked]);

  // Handle manual session refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
      setProfileChecked(false); // Reset profile check to try again
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading || isRefreshing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">{isRefreshing ? 'Refreshing...' : 'Loading...'}</span>
      </div>
    );
  }

  // Check if user exists
  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Check if user has administrator role from user metadata or profile query
  const userMetadataRole = user?.user_metadata?.role;
  const isAdmin = userMetadataRole === 'Administrator' || profileRole === 'Administrator';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-[450px]">
          <CardHeader className="bg-destructive/10">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
              <CardTitle>Administrator Access Required</CardTitle>
            </div>
            <CardDescription>
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4">
              Your account role is set to <span className="font-semibold">{userMetadataRole || profileRole || 'Not set'}</span>,
              but only accounts with the <span className="font-semibold">Administrator</span> role can access this page.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Go back to Settings and use the "Fix Admin Role" button in the User Management section.
            </p>
            
            <div className="flex justify-center">
              <Button onClick={handleRefresh} variant="outline" className="mr-2" disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Session
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4">
            <Button onClick={() => navigate('/settings')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
} 