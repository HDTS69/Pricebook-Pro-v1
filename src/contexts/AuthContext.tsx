import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, syncUserProfile } from '@/lib/supabase';
import { User, AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  authenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    authenticated: false
  });

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const { session } = data;
        
        if (session) {
          setState(prev => ({
            ...prev,
            user: session.user,
            authenticated: true,
            loading: false
          }));
        } else {
          setState(prev => ({
            ...prev,
            loading: false
          }));
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error as AuthError
        }));
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          authenticated: !!session,
          loading: false
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      setState(prev => ({
        ...prev,
        error: error as AuthError
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.log('Attempting to sign up with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      console.log('Supabase signUp response:', { data, error });
      
      if (error) throw error;
      
      // If signup was successful and we have a user, sync with profiles table
      if (data?.user) {
        try {
          // Sync user metadata with profiles table
          await syncUserProfile(data.user.id, metadata || {});
        } catch (syncError) {
          console.error('Error syncing user profile:', syncError);
          // We don't throw here to prevent blocking signup completion
        }
      }
    } catch (error) {
      console.error('Error signing up:', error);
      console.log('Error details:', {
        message: (error as any)?.message,
        code: (error as any)?.code,
        status: (error as any)?.status,
      });
      
      // Custom error handling for email already in use
      const authError = error as AuthError;
      if (
        authError?.message?.includes('User already registered') || 
        authError?.message?.includes('already exists') ||
        authError?.message?.includes('already in use') ||
        authError?.message?.includes('already taken') ||
        authError?.code === '23505' // PostgreSQL unique violation error
      ) {
        console.log('Detected existing user error');
        const customError = {
          ...authError,
          message: 'An account with this email already exists. Please sign in instead.'
        } as AuthError;
        
        setState(prev => ({
          ...prev,
          error: customError,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: authError,
        }));
      }
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      setState(prev => ({
        ...prev,
        error: error as AuthError,
        loading: false
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 