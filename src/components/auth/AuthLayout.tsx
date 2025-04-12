import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Pricebook Pro
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Track and compare prices across multiple stores
          </p>
        </div>
        {children}
      </div>
    </div>
  );
} 