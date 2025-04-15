/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { decryptToken, encryptToken } from '../_shared/encryption.ts'

console.log(`Function get-servicem8-token initializing`);

// --- Environment Variables ---
const ENCRYPTION_KEY = Deno.env.get('TOKEN_ENCRYPTION_KEY') ?? '';
const SERVICE_M8_CLIENT_ID = Deno.env.get('SERVICE_M8_CLIENT_ID') ?? '';     // Needed for refresh
const SERVICE_M8_CLIENT_SECRET = Deno.env.get('SERVICE_M8_CLIENT_SECRET') ?? ''; // Needed for refresh
const SERVICE_M8_TOKEN_URL = 'https://go.servicem8.com/oauth/access_token'; // For refresh
const TABLE_NAME = 'servicem8_connections'; // <<< YOUR TABLE NAME HERE
const EXPIRY_BUFFER_SECONDS = 60; // Refresh token if it expires within this many seconds

if (!ENCRYPTION_KEY || !SERVICE_M8_CLIENT_ID || !SERVICE_M8_CLIENT_SECRET) { // Check all needed vars
  console.error('FATAL: Missing required environment variables (KEY, S8_ID, S8_SECRET).');
  throw new Error("Server configuration error: Missing required environment variables.");
}

interface StoredConnection {
  user_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  expires_at: string | null; // ISO timestamp string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let userId: string | null = null; // Keep track of user ID for logging

  try {
    // 1. Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 2. Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !user) {
        console.error("Auth error:", userError);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    userId = user.id; // Store user ID
    console.log(`User ${userId} requesting ServiceM8 token.`);

    // 3. Fetch stored connection details from DB
    const { data: connection, error: fetchError } = await supabaseAdmin
      .from<StoredConnection>(TABLE_NAME)
      .select('encrypted_access_token, encrypted_refresh_token, expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error(`DB fetch error for user ${userId}:`, fetchError);
      throw new Error('Failed to fetch connection details.');
    }

    if (!connection) {
      console.log(`No ServiceM8 connection found for user ${userId}.`);
      return new Response(JSON.stringify({ error: 'No ServiceM8 connection found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Token Refresh Logic --- 
    let currentAccessToken = connection.encrypted_access_token;
    let currentRefreshToken = connection.encrypted_refresh_token;
    let needsUpdate = false;

    // 4. Check if access token is expired or close to expiring
    const now = Date.now();
    const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
    const isExpired = now >= (expiresAt - (EXPIRY_BUFFER_SECONDS * 1000));

    if (isExpired) {
      console.log(`Token for user ${userId} requires refresh (Expired or nearing expiry).`);
      try {
        // 5. Decrypt refresh token and get new tokens
        const decryptedRefreshToken = await decryptToken(currentRefreshToken, ENCRYPTION_KEY);

        const refreshFormData = new URLSearchParams();
        refreshFormData.append('grant_type', 'refresh_token');
        refreshFormData.append('refresh_token', decryptedRefreshToken);
        refreshFormData.append('client_id', SERVICE_M8_CLIENT_ID);
        refreshFormData.append('client_secret', SERVICE_M8_CLIENT_SECRET);

        console.log(`Attempting token refresh for user ${userId}...`);
        const refreshResponse = await fetch(SERVICE_M8_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: refreshFormData,
        });

        const refreshData = await refreshResponse.json();
        if (!refreshResponse.ok) {
          console.error(`ServiceM8 token refresh failed for user ${userId}: ${refreshResponse.status}`, refreshData);
          // If refresh fails (e.g., invalid grant), maybe delete the connection?
          // For now, just throw an error, preventing token retrieval.
          throw new Error(`Token refresh failed: ${refreshData?.error_description || refreshData?.error || refreshResponse.statusText}`);
        }

        console.log(`Token refresh successful for user ${userId}.`);
        if (!refreshData.access_token || !refreshData.expires_in) {
            throw new Error("Incomplete token data received from refresh response.");
        }

        // 6. Encrypt new tokens
        const newEncryptedAccessToken = await encryptToken(refreshData.access_token, ENCRYPTION_KEY);
        // Use new refresh token if provided, otherwise re-encrypt old one (ServiceM8 might not always return one)
        const newEncryptedRefreshToken = refreshData.refresh_token 
            ? await encryptToken(refreshData.refresh_token, ENCRYPTION_KEY) 
            : await encryptToken(decryptedRefreshToken, ENCRYPTION_KEY); // Re-encrypt the one we used
        const newExpiresAt = new Date(Date.now() + parseInt(refreshData.expires_in, 10) * 1000).toISOString();

        // Prepare for update
        currentAccessToken = newEncryptedAccessToken;
        currentRefreshToken = newEncryptedRefreshToken;
        needsUpdate = true;

        // 7. Update DB immediately
        console.log(`Updating stored tokens for user ${userId}...`);
        const { error: updateError } = await supabaseAdmin
          .from(TABLE_NAME)
          .update({
            encrypted_access_token: currentAccessToken,
            encrypted_refresh_token: currentRefreshToken,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error(`DB update error after refresh for user ${userId}:`, updateError);
          // Log error but continue, as we have the new token in memory for this request
          // The DB will be outdated until the next successful refresh.
          needsUpdate = false; // Prevent trying to use potentially outdated token below if update failed
        }

      } catch (refreshError) {
          console.error(`Token refresh process failed for user ${userId}:`, refreshError);
          // If refresh fails, we cannot return a valid token.
          // Maybe delete the connection if refresh token is invalid?
          // For now, return a specific error status.
          return new Response(JSON.stringify({ error: `Token refresh failed: ${refreshError.message}` }), {
              status: 500, // Or maybe 401 if it's an invalid grant?
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
    } else {
        console.log(`Token for user ${userId} is still valid.`);
    }

    // 8. Decrypt the valid access token (original or refreshed)
    console.log(`Decrypting final access token for user ${userId}...`);
    const decryptedAccessToken = await decryptToken(currentAccessToken, ENCRYPTION_KEY);

    // 9. Return the decrypted access token
    console.log(`Returning valid token for user ${userId}.`);
    return new Response(
      JSON.stringify({ accessToken: decryptedAccessToken }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error(`[get-servicem8-token] User ${userId || 'UNKNOWN'} Error:`, error.message);
    const isAuthError = error instanceof Error && (error.message === 'Missing Authorization header' || error.message === 'Unauthorized');
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: isAuthError ? 401 : 500,
      }
    );
  }
}); 