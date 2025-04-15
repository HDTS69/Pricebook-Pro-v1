/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // Assuming CORS headers are shared

// Follow this pattern to import other modules from the Edge Function 
// import { example } from '../_shared/example.ts'

// NOTE: Ensure Deno and Supabase CLI are configured correctly
// See: https://supabase.com/docs/guides/functions/quickstart

console.log(`Function delete-servicem8-token initializing`);

// Define the expected table structure (adjust if necessary)
interface ServiceM8Connection {
  user_id: string;
  // other fields like encrypted_access_token, refresh_token, expires_at
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Create Supabase admin client
    const supabaseAdmin = createClient(
      // Pass Supabase URL and Service Role Key from environment variables
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      // Optionally specify auth schema, etc., if needed
      // { global: { headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } } }
    );

    // 2. Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;
    console.log(`User ${userId} attempting to delete ServiceM8 connection.`);

    // 3. Delete the connection from the database
    // IMPORTANT: Replace 'servicem8_connections' with your actual table name
    const { error: deleteError } = await supabaseAdmin
      .from('servicem8_connections') // <<< YOUR TABLE NAME HERE
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error(`Database delete error for user ${userId}:`, deleteError);
      // Don't expose detailed DB errors to the client
      throw new Error('Failed to delete connection from database.');
    }

    // 4. Return success response
    console.log(`Successfully deleted ServiceM8 connection for user ${userId}.`);
    return new Response(JSON.stringify({ message: 'Connection deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[delete-servicem8-token] Error:", error.message);
    // Return a generic error response
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error instanceof Error && (error.message === 'Missing Authorization header' || error.message === 'Unauthorized') ? 401 : 500,
      }
    );
  }
});

/* 
Sample invocation:

const { data, error } = await supabase.functions.invoke('delete-servicem8-token', {
  method: 'POST', // Or DELETE if Deno.serve routing is more specific
  headers: { 'Authorization': `Bearer ${supabase.auth.session()?.access_token}` }
})

*/ 