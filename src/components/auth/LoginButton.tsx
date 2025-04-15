import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

export function LoginButton() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      if (error) {
        // If login fails, try with magic link
        console.log('Password login failed, trying magic link:', error);
        const { error: magicLinkError } = await supabase.auth.signInWithOtp({
          email: 'test@example.com',
        });

        if (magicLinkError) {
          throw magicLinkError;
        } else {
          toast({
            title: 'Magic Link Sent',
            description: 'Check your email for a login link'
          });
        }
      } else if (data.session) {
        setIsAuthenticated(true);
        toast({
          title: 'Logged In',
          description: 'You are now logged in'
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: error.message || 'Failed to login'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      toast({
        title: 'Logged Out',
        description: 'You have been logged out'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Logout Error',
        description: error.message || 'Failed to logout'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={isAuthenticated ? handleLogout : handleLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isAuthenticated ? (
        <LogOut className="h-4 w-4 mr-2" />
      ) : (
        <LogIn className="h-4 w-4 mr-2" />
      )}
      {isAuthenticated ? 'Logout' : 'Login'}
    </Button>
  );
} 