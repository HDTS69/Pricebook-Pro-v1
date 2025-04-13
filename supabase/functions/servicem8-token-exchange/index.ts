// @deno-types="https://deno.land/x/servest@v1.3.1/types/react/index.d.ts"
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; 
import { corsHeaders } from "../_shared/cors.ts"; 
// --- Import Supabase Admin Client --- 
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// --- Import encoding helpers --- 
import { decode as base64Decode, encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Load ServiceM8 credentials & Supabase keys from environment variables
const SERVICE_M8_APP_ID = Deno.env.get("SERVICEM8_APP_ID");
const SERVICE_M8_APP_SECRET = Deno.env.get("SERVICEM8_APP_SECRET");
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ENCRYPTION_KEY_BASE64 = Deno.env.get('TOKEN_ENCRYPTION_KEY'); // <<< Get encryption key

// Callback URL configuration (ensure PRODUCTION_CALLBACK_URL is set in Supabase env vars for deployed function)
const functionsUrl = Deno.env.get("SUPABASE_FUNCTIONS_URL") || ""; 
const CALLBACK_URL = functionsUrl.includes("localhost")
  ? 'http://localhost:5173/auth/servicem8/callback'
  : Deno.env.get("PRODUCTION_CALLBACK_URL") || 'YOUR_PRODUCTION_CALLBACK_URL'; // TODO: Must be set for prod!

const SERVICE_M8_TOKEN_URL = 'https://go.servicem8.com/oauth/access_token';

// Define table name for storing tokens (adjust if needed)
const TOKEN_TABLE_NAME = 'user_service_m8_tokens'; // <<< TODO: Ensure this table exists

// --- Crypto Constants and Helpers ---
const ALGORITHM = 'AES-GCM';
const IV_LENGTH_BYTES = 12; // Standard for AES-GCM
let cryptoKey: CryptoKey | null = null; // Cache the imported key

async function getCryptoKey(): Promise<CryptoKey> {
  if (cryptoKey) return cryptoKey;
  if (!ENCRYPTION_KEY_BASE64) {
    throw new Error("Missing TOKEN_ENCRYPTION_KEY environment variable.");
  }
  try {
    const keyData = base64Decode(ENCRYPTION_KEY_BASE64);
    cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: ALGORITHM },
      false, // not extractable
      ["encrypt", "decrypt"]
    );
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
  const encodedData = encoder.encode(plainText);

  const encryptedData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv },
    key,
    encodedData
  );

  // Prepend IV to the ciphertext and encode as Base64
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return base64Encode(combined);
}

// Decrypt function (needed later for retrieving/using tokens)
// async function decryptToken(encryptedBase64: string): Promise<string> {
//   const key = await getCryptoKey();
//   const combinedData = base64Decode(encryptedBase64);
//   const iv = combinedData.slice(0, IV_LENGTH_BYTES);
//   const encryptedData = combinedData.slice(IV_LENGTH_BYTES);

//   const decryptedData = await crypto.subtle.decrypt(
//     { name: ALGORITHM, iv: iv },
//     key,
//     encryptedData
//   );

//   const decoder = new TextDecoder();
//   return decoder.decode(decryptedData);
// }

console.log('ServiceM8 Token Exchange function initializing...');
console.log('Callback URL configured:', CALLBACK_URL);

serve(async (req: Request) => {
  console.log(`Handling ${req.method} request from ${req.headers.get('origin')}`);

  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  // Check for required environment variables
  if (!SERVICE_M8_APP_ID || !SERVICE_M8_APP_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ENCRYPTION_KEY_BASE64) {
    console.error("Missing required environment variables (ServiceM8, Supabase keys, or Encryption key).");
    return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
  
   if (!CALLBACK_URL || CALLBACK_URL === 'YOUR_PRODUCTION_CALLBACK_URL') {
    console.error("Production Callback URL is not configured correctly.");
    return new Response(JSON.stringify({ error: 'Server callback URL configuration error.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    // --- Initialize Crypto Key --- 
    // Attempt to import the key early to catch configuration errors
    await getCryptoKey(); 
    console.log("Encryption key imported successfully.");

    // --- Get User from Supabase JWT --- 
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error("Missing or invalid Authorization header.");
        return new Response(JSON.stringify({ error: 'Missing user authentication.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        });
    }
    const supabaseAccessToken = authHeader.substring(7); // Remove 'Bearer '

    // Use the standard client initially just to get user details from the token
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY); // Use service key to bypass RLS for user lookup
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(supabaseAccessToken);

    if (userError || !user) {
        console.error("Failed to get user from token:", userError);
        return new Response(JSON.stringify({ error: 'Invalid user token.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        });
    }
    console.log("Identified user:", user.id);
    // --- End Get User ---

    // Extract authorization code from request body
    let code: string | null = null;
    try {
      const body = await req.json();
      code = body?.code;
    } catch (e) {
       return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    console.log('Received authorization code:', code ? 'Present' : 'Missing');

    if (!code) {
      return new Response(JSON.stringify({ error: 'Authorization code is required in JSON body.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Prepare request body for ServiceM8 token endpoint
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', SERVICE_M8_APP_ID);
    params.append('client_secret', SERVICE_M8_APP_SECRET);
    params.append('code', code);
    params.append('redirect_uri', CALLBACK_URL);

    console.log(`Requesting token from ${SERVICE_M8_TOKEN_URL}...`);

    // Make the POST request to ServiceM8
    const tokenResponse = await fetch(SERVICE_M8_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params,
    });

    const responseBody = await tokenResponse.json();
    console.log('ServiceM8 token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      console.error('ServiceM8 token exchange failed:', responseBody);
      throw new Error(`ServiceM8 token exchange failed: ${tokenResponse.status} ${responseBody?.error || responseBody?.message || 'Unknown error'}`);
    }

    console.log('Token exchange successful. Response:', responseBody);

    const { access_token, refresh_token, expires_in } = responseBody;

    if (!access_token || !refresh_token || expires_in === undefined) {
       console.error('Missing token data in ServiceM8 response:', responseBody);
       throw new Error('Incomplete token data received from ServiceM8.');
    }

    // --- Encrypt and Store Tokens --- 
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    console.log(`Encrypting and storing tokens for user ${user.id} in table ${TOKEN_TABLE_NAME}...`);
    
    // Encrypt the tokens before storing
    const encryptedAccessToken = await encryptToken(access_token);
    const encryptedRefreshToken = await encryptToken(refresh_token);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: dbError } = await supabaseAdmin
      .from(TOKEN_TABLE_NAME)
      .upsert({
        user_id: user.id, 
        access_token: encryptedAccessToken, // Store encrypted token
        refresh_token: encryptedRefreshToken, // Store encrypted token
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }); 

    if (dbError) {
      console.error(`Failed to store tokens for user ${user.id}:`, dbError);
      throw new Error(`Failed to save integration details: ${dbError.message}`);
    }
    console.log(`Tokens stored successfully for user ${user.id}`);
    // --- End Store Tokens ---

    // Return success response (don't send tokens back to client)
    return new Response(JSON.stringify({ success: true, message: 'ServiceM8 connection successful.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error during ServiceM8 token exchange:', error);
    // Check if it's a known crypto key error
    if (error.message.includes("TOKEN_ENCRYPTION_KEY")) {
       return new Response(JSON.stringify({ error: 'Server encryption configuration error.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log('ServiceM8 Token Exchange function ready.'); 