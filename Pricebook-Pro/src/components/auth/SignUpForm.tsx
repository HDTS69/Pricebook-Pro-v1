import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export function SignUpForm() {
  const navigate = useNavigate();
  const { clearError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Redirect to sign in page after successful registration
      navigate('/auth/signin', {
        state: { message: 'Please check your email to verify your account.' },
      });
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          required
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          required
        />
        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
          required
        />
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>

      <div className="text-sm text-center text-muted-foreground">
        Already have an account?{' '}
        <Link to="/auth/signin" className="text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
} 