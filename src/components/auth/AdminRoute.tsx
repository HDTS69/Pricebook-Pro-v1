import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Check if user exists and has administrator role
  const isAdmin = user?.user_metadata?.role === 'Administrator';

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

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
              Your account role is set to <span className="font-semibold">{user.user_metadata?.role || 'Not set'}</span>,
              but only accounts with the <span className="font-semibold">Administrator</span> role can access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Go back to Settings and use the "Fix Admin Role" button in the User Management section.
            </p>
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