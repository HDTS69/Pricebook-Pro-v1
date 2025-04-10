import React from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignInForm } from '@/components/auth/SignInForm';

export function SignInPage() {
  return (
    <AuthLayout>
      <SignInForm />
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/auth/signup" className="font-medium text-primary hover:text-primary/80">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
} 