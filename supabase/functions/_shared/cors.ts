// supabase/functions/_shared/cors.ts

// Standard CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Restrict this in production!
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Add other methods if needed
}; 