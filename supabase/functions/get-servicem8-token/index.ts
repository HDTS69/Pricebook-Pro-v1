// @deno-types="https://deno.land/x/servest@v1.3.1/types/react/index.d.ts"
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decode as base64Decode, encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// --- Environment Variables ---
const SERVICE_M8_APP_ID = Deno.env.get("SERVICEM8_APP_ID");
const SERVICE_M8_APP_SECRET = Deno.env.get("SERVICEM8_APP_SECRET");
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ENCRYPTION_KEY_BASE64 = Deno.env.get('TOKEN_ENCRYPTION_KEY');

const SERVICE_M8_TOKEN_URL = 'https://go.servicem8.com/oauth/access_token';
const TOKEN_TABLE_NAME = 'user_service_m8_tokens';

// --- Crypto Constants and Helpers (Copied from token-exchange) ---
const ALGORITHM = 'AES-GCM';
const IV_LENGTH_BYTES = 12;
let cryptoKey: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey> {
  if (cryptoKey) return cryptoKey;
  if (!ENCRYPTION_KEY_BASE64) {
    throw new Error("Missing TOKEN_ENCRYPTION_KEY environment variable.");
  }
  try {
    const keyData = base64Decode(ENCRYPTION_KEY_BASE64);
    cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: ALGORITHM }, false, ["encrypt", "decrypt"]);
    return cryptoKey;
  } catch (err) {
    console.error("Error importing encryption key:", err);
    throw new Error("Invalid TOKEN_ENCRYPTION_KEY format or value.");
  }
}

async function encryptToken(plainText: string): Promise<string> {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const encoder = new TextEncoder();
  const encryptedData = await crypto.subtle.encrypt({ name: ALGORITHM, iv: iv }, key, encoder.encode(plainText));
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  return base64Encode(combined);
}

// --- Decrypt function - Needed Here! ---
async function decryptToken(encryptedBase64: string): Promise<string> {
  try {
    const key = await getCryptoKey();
    const combinedData = base64Decode(encryptedBase64);
    if (combinedData.length <= IV_LENGTH_BYTES) {
        throw new Error("Invalid encrypted data length.");
    }
    const iv = combinedData.slice(0, IV_LENGTH_BYTES);
    const encryptedData = combinedData.slice(IV_LENGTH_BYTES);

    const decryptedData = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
     console.error("Decryption failed:", error);
     // Rethrow or handle specific decryption errors
     throw new Error("Failed to decrypt token.");
  }
}

console.log('Get ServiceM8 Token function initializing...');

serve(async (req: Request) => {
  console.log(`Handling ${req.method} request to get-servicem8-token from ${req.headers.get('origin')}`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Check required environment variables
  if (!SERVICE_M8_APP_ID || !SERVICE_M8_APP_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ENCRYPTION_KEY_BASE64) {
    console.error("Missing required environment variables.");
    return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }

  try {
    // --- Initialize Crypto Key --- 
    await getCryptoKey();

    // --- Get User from Supabase JWT --- 
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing user authentication.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }
    const supabaseAccessToken = authHeader.substring(7);
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(supabaseAccessToken);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user token.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }
    console.log("Identified user:", user.id);

    // --- Fetch Stored Tokens --- 
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: tokenData, error: dbFetchError } = await supabaseAdmin
      .from(TOKEN_TABLE_NAME)
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single(); // Expect only one row per user

    if (dbFetchError) {
      if (dbFetchError.code === 'PGRST116') { // code for "Resource Not Found"
         console.log(`No ServiceM8 tokens found for user ${user.id}`);
         return new Response(JSON.stringify({ error: 'ServiceM8 not connected for this user.' }), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
      }
      console.error(`Failed to fetch tokens for user ${user.id}:`, dbFetchError);
      throw new Error(`Database error fetching tokens: ${dbFetchError.message}`);
    }

    if (!tokenData || !tokenData.access_token || !tokenData.refresh_token || !tokenData.expires_at) {
      console.error(`Incomplete token data found for user ${user.id}:`, tokenData);
      throw new Error('Incomplete token data found in database.');
    }

    // --- Check Expiration --- 
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    // Check if expired (give a 60-second buffer before actual expiry)
    const isExpired = now.getTime() > expiresAt.getTime() - 60000;

    let validAccessToken = '';

    if (isExpired) {
      console.log(`Token for user ${user.id} is expired. Refreshing...`);
      // --- Refresh Token Logic --- 
      let decryptedRefreshToken = '';
      try {
        decryptedRefreshToken = await decryptToken(tokenData.refresh_token);
      } catch (decryptErr) {
         console.error(`Failed to decrypt refresh token for user ${user.id}:`, decryptErr);
         throw new Error("Failed to process stored refresh token.");
      }
      
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', decryptedRefreshToken);
      params.append('client_id', SERVICE_M8_APP_ID);
      params.append('client_secret', SERVICE_M8_APP_SECRET);

      const refreshResponse = await fetch(SERVICE_M8_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params,
      });

      const refreshBody = await refreshResponse.json();

      if (!refreshResponse.ok) {
        console.error(`ServiceM8 token refresh failed for user ${user.id}:`, refreshBody);
        // TODO: Consider deleting stored tokens if refresh fails permanently (e.g., invalid grant)?
        throw new Error(`ServiceM8 token refresh failed: ${refreshResponse.status} ${refreshBody?.error || refreshBody?.message || 'Unknown error'}`);
      }

      const { access_token: newAccessToken, refresh_token: newRefreshToken, expires_in: newExpiresIn } = refreshBody;
      if (!newAccessToken || newExpiresIn === undefined) {
        throw new Error('Incomplete data received from ServiceM8 token refresh.');
      }
      
      validAccessToken = newAccessToken; // Use the new token for this request
      const newExpiresAt = new Date(Date.now() + newExpiresIn * 1000).toISOString();
      
      // Encrypt new tokens
      const encryptedNewAccessToken = await encryptToken(newAccessToken);
      // ServiceM8 might not return a new refresh token; reuse old one if not provided
      const encryptedNewRefreshToken = newRefreshToken 
        ? await encryptToken(newRefreshToken)
        : tokenData.refresh_token; 
        
      // Update database with new tokens
      const { error: updateError } = await supabaseAdmin
        .from(TOKEN_TABLE_NAME)
        .update({
          access_token: encryptedNewAccessToken,
          refresh_token: encryptedNewRefreshToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`Failed to update refreshed tokens for user ${user.id}:`, updateError);
        // Non-fatal? Log error but continue with the new access token for this request.
      } else {
         console.log(`Successfully refreshed and updated tokens for user ${user.id}`);
      }
    } else {
      console.log(`Token for user ${user.id} is valid. Decrypting...`);
      // --- Decrypt Existing Token --- 
      try {
         validAccessToken = await decryptToken(tokenData.access_token);
      } catch (decryptErr) {
          console.error(`Failed to decrypt access token for user ${user.id}:`, decryptErr);
          throw new Error("Failed to process stored access token.");
      }
    }

    // --- Return Decrypted Access Token --- 
    return new Response(JSON.stringify({ accessToken: validAccessToken }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in get-servicem8-token function:', error);
    // Distinguish configuration errors from runtime errors if possible
    const status = (error.message.includes("configuration error") || error.message.includes("TOKEN_ENCRYPTION_KEY")) ? 500 : 400;
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});

console.log('Get ServiceM8 Token function ready.'); 