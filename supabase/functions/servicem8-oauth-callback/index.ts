/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { encryptToken } from '../_shared/encryption.ts'

console.log(`Function servicem8-oauth-callback initializing`);

// IMPORTANT: Set these in Supabase Function Environment Variables
const SERVICE_M8_CLIENT_ID = Deno.env.get('SERVICE_M8_CLIENT_ID') ?? '';
const SERVICE_M8_CLIENT_SECRET = Deno.env.get('SERVICE_M8_CLIENT_SECRET') ?? '';
const SERVICE_M8_REDIRECT_URI = Deno.env.get('SERVICE_M8_REDIRECT_URI') ?? ''; // Should match the one used in SettingsPage
const ENCRYPTION_KEY = Deno.env.get('TOKEN_ENCRYPTION_KEY') ?? ''; // MUST be set for security
const APP_URL = Deno.env.get('APP_URL') ?? ''; // Your frontend app URL (e.g., http://localhost:5173)
const SERVICE_M8_TOKEN_URL = 'https://go.servicem8.com/oauth/access_token';
const TABLE_NAME = 'servicem8_connections'; // YOUR TABLE NAME HERE

if (!SERVICE_M8_CLIENT_ID || !SERVICE_M8_CLIENT_SECRET || !SERVICE_M8_REDIRECT_URI || !ENCRYPTION_KEY || !APP_URL) {
  console.error('FATAL: Missing required environment variables for ServiceM8 OAuth callback.');
  // Throw error to prevent function from running if critical config is missing
  throw new Error("Server configuration error: Missing required environment variables.");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // Used for CSRF and potentially user ID

  console.log(`Callback received. Code: ${code ? 'present' : 'missing'}, State: ${state}`);

  // Simple redirect for errors or missing params, sending error info via query params
  const errorRedirect = (errorMsg: string, errorCode: string = 'callback_error') => {
    const redirectUrl = new URL('/settings', APP_URL); // Redirect back to settings page
    redirectUrl.searchParams.set('error', errorCode);
    redirectUrl.searchParams.set('error_description', errorMsg);
    console.error(`Redirecting with error: ${errorMsg}`);
    return new Response(null, { status: 302, headers: { Location: redirectUrl.toString() } });
  };

  const successRedirect = () => {
    const redirectUrl = new URL('/settings', APP_URL);
    redirectUrl.searchParams.set('s8_connect', 'success'); 
    console.log("Redirecting to success URL:", redirectUrl.toString());
    return new Response(null, { status: 302, headers: { Location: redirectUrl.toString() } });
  };

  if (!code) {
    return errorRedirect('Authorization code not found in callback URL.', 'missing_code');
  }

  if (!state) {
    return errorRedirect('State parameter missing from callback URL.', 'missing_state');
  }

  try {
    // TODO: 
    // 1. Verify state parameter (CSRF protection, potentially extract user ID)
    // 2. Exchange code for tokens (POST to https://go.servicem8.com/oauth/access_token)
    // 3. Encrypt tokens
    // 4. Store connection details (user_id, encrypted tokens, expiry) in DB
    // 5. Redirect user back to settings page with success indicator

    // --- 1. Verify State & Get User ID ---
    // TODO: Implement proper state verification (e.g., check against stored nonce)
    // For now, we ASSUME state directly contains the user ID for simplicity. 
    // This is NOT secure for production without a proper CSRF check.
    const userId = state; 
    if (!userId) { // Basic check
      return errorRedirect('Invalid state parameter provided.', 'invalid_state');
    }
    console.log(`Attempting OAuth exchange for user ID (from state): ${userId}`);

    // --- 2. Exchange Code for Tokens ---
    const tokenFormData = new URLSearchParams();
    tokenFormData.append('grant_type', 'authorization_code');
    tokenFormData.append('code', code);
    tokenFormData.append('redirect_uri', SERVICE_M8_REDIRECT_URI);
    tokenFormData.append('client_id', SERVICE_M8_CLIENT_ID);
    tokenFormData.append('client_secret', SERVICE_M8_CLIENT_SECRET);

    console.log("Exchanging code for tokens...");
    const tokenResponse = await fetch(SERVICE_M8_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenFormData,
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('ServiceM8 token exchange failed:', tokenResponse.status, errorBody);
      throw new Error(`Failed to exchange code: ${errorBody || tokenResponse.statusText}`);
    }

    const tokens = await tokenResponse.json();
    console.log("Tokens received (structure may vary):", tokens); // Log structure for debugging

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error("Missing access_token or refresh_token in ServiceM8 response:", tokens);
      throw new Error('Invalid token response from ServiceM8.');
    }

    // --- 3. Encrypt Tokens ---
    console.log("Encrypting tokens...");
    const encryptedAccessToken = await encryptToken(tokens.access_token, ENCRYPTION_KEY);
    const encryptedRefreshToken = await encryptToken(tokens.refresh_token, ENCRYPTION_KEY);
    // Calculate expiry timestamp (expires_in is in seconds)
    const expiresIn = tokens.expires_in ? parseInt(tokens.expires_in, 10) : 3600; // Default to 1 hour
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    console.log(`Token expires at: ${expiresAt}`);

    // --- 4. Store Connection in DB ---
    console.log(`Storing encrypted connection details for user ${userId}...`);
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!); // Use non-null assertion after initial check
    
    const { error: upsertError } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({
        user_id: userId,
        encrypted_access_token: encryptedAccessToken,
        encrypted_refresh_token: encryptedRefreshToken,
        expires_at: expiresAt,
        // Add any other relevant fields, e.g., updated_at
        updated_at: new Date().toISOString(), 
      }, { onConflict: 'user_id' }); // Upsert based on user_id

    if (upsertError) {
      console.error(`Database upsert error for user ${userId}:`, upsertError);
      throw new Error('Failed to save connection details.');
    }
    console.log(`Successfully saved connection for user ${userId}.`);

    // --- 5. Redirect on Success ---
    return successRedirect();

  } catch (error) {
    console.error("[servicem8-oauth-callback] Error:", error);
    return errorRedirect(error.message || 'An unexpected error occurred during callback processing.');
  }
});

// Note: CORS headers aren't strictly needed for the final redirect responses (status 302),
// but might be useful if the function were to return JSON data directly at some point. 