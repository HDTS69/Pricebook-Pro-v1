import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Alert } from "@/components/ui/Alert";
import { Terminal, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase'; // Use the path found in the search

export function ServiceM8CallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Processing authorization...');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');
    const errorParam = queryParams.get('error');
    const errorDescription = queryParams.get('error_description');

    const exchangeCodeForToken = async (authCode: string) => {
      setStatusMessage('Exchanging code for token...');
      setIsLoading(true);
      setError(null);

      try {
        // Call the Supabase Edge Function
        // Ensure you pass the user's auth token if your edge function needs it for RLS or identifying the user
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          throw new Error('User session not found. Please log in again.');
        }
        const accessToken = sessionData.session.access_token;

        const { data, error: functionsError } = await supabase.functions.invoke(
          'servicem8-token-exchange', 
          { 
            body: { code: authCode },
            headers: { 'Authorization': `Bearer ${accessToken}`}
           }
        );

        if (functionsError) {
          console.error('Supabase function invocation error:', functionsError);
          throw new Error(functionsError.message || 'Failed to call token exchange function.');
        }

        // Check the response from the function
        if (data?.error) {
          console.error('Token exchange function returned error:', data.error);
          throw new Error(data.error || 'Token exchange failed on server.');
        }
        
        if (!data?.success) {
           console.error('Token exchange function did not return success:', data);
           throw new Error('Token exchange process failed on server.');
        }

        setStatusMessage('ServiceM8 connection successful!');
        setIsLoading(false);

        // Redirect back to settings page after a short delay
        setTimeout(() => {
          navigate('/settings'); // Adjust path if needed
        }, 2000); // 2 second delay

      } catch (exchangeError: any) {
        console.error("Token exchange error:", exchangeError);
        setError(exchangeError.message || 'An unknown error occurred during token exchange.');
        setStatusMessage('Failed to connect ServiceM8 account.');
        setIsLoading(false);
      }
    };

    if (errorParam) {
      setError(errorDescription || errorParam);
      setStatusMessage('Authorization failed.');
      setIsLoading(false);
    } else if (code) {
      setAuthCode(code);
      // Automatically trigger the token exchange
      exchangeCodeForToken(code);
    } else {
      setError('Missing authorization code or error from ServiceM8.');
      setStatusMessage('Invalid callback state.');
      setIsLoading(false);
    }
    // Clean up URL - remove code/error params after processing
    // navigate(location.pathname, { replace: true }); // Optional: Keep URL clean

  }, [location, navigate]); 

  return (
    <DashboardLayout>
      <div className="p-6 flex justify-center items-start">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Connecting to ServiceM8...</CardTitle>
            <CardDescription>
              {statusMessage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center space-x-2 py-4">
                 <Loader2 className="h-6 w-6 animate-spin" />
                 <p>Processing...</p>
              </div>
            )}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <h5 className="font-medium leading-none tracking-tight">Connection Failed</h5>
                <div className="text-sm [&_p]:leading-relaxed">{error}</div>
              </Alert>
            )}
            {!isLoading && !error && authCode && (
              <Alert variant="success" className="mt-4">
                 <CheckCircle className="h-4 w-4" />
                 <h5 className="font-medium leading-none tracking-tight">Success!</h5>
                 <div className="text-sm [&_p]:leading-relaxed">
                   Your ServiceM8 account is connected. Redirecting...
                 </div>
              </Alert>
            )}
             {!isLoading && !error && !authCode && (
               <Alert variant="warning" className="mt-4">
                 <Terminal className="h-4 w-4" />
                 <h5 className="font-medium leading-none tracking-tight">Waiting</h5>
                 <div className="text-sm [&_p]:leading-relaxed">
                   Waiting for authorization details...
                 </div>
               </Alert>
             )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 