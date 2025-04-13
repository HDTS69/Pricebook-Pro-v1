import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { OpenAI } from 'https://deno.land/x/openai@v4.52.7/mod.ts'; // Use a specific version

// --- CORS Helper ---
// Simple helper for CORS headers. Adjust origins as needed for production.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin (adjust for production!)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS for preflight
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // --- Retrieve OpenAI API Key ---
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAIApiKey) {
    console.error('Missing OPENAI_API_KEY environment variable.')
    return new Response(
      JSON.stringify({ error: 'Missing OpenAI configuration on the server.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }

  // --- Initialize OpenAI Client ---
  const openai = new OpenAI({ apiKey: openAIApiKey });

  // --- Handle Request Body ---
  let inputText = '';
  try {
    const body = await req.json();
    if (!body || typeof body.text !== 'string' || body.text.trim() === '') {
        throw new Error('Invalid request body: "text" property is required and must be a non-empty string.');
    }
    inputText = body.text.trim();
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return new Response(
        JSON.stringify({ error: error.message || 'Invalid request body.' }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        }
    );
  }


  // --- Call OpenAI API ---
  try {
    console.log(`[AI Enhance Name] Calling OpenAI for text: "${inputText}"`);
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant helping a tradesperson enhance the names of tasks for quotes. \
Given the user's input name, rewrite it to be clearer, more professional, and concise, while retaining the original meaning. \
Fix any obvious typos or grammatical errors. Return ONLY the enhanced name, without any explanation or preamble.`,
        },
        { role: 'user', content: inputText },
      ],
      model: 'gpt-4o-mini', // Or 'gpt-3.5-turbo' for potentially lower cost/latency
      temperature: 0.5, // Adjust for more/less creative output
      max_tokens: 50, // Limit response length
    });

    const enhancedText = chatCompletion.choices[0]?.message?.content?.trim();

    if (!enhancedText) {
      throw new Error('OpenAI response did not contain a valid enhancement.');
    }

    console.log(`[AI Enhance Name] OpenAI Result: "${enhancedText}"`);

    // --- Return Success Response ---
    return new Response(
      JSON.stringify({ result: enhancedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request with AI service.', details: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 