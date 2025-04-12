import React from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignUpForm } from '@/components/auth/SignUpForm';

export function SignUpPage() {
  return (
    <AuthLayout>
      <SignUpForm />
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/auth/signin" className="font-medium text-primary hover:text-primary/80">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
} 