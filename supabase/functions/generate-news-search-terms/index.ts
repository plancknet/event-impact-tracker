import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Security: Restrict CORS to allowed origins
const ALLOWED_ORIGINS = [
  'https://bficxnetrsuyzygutztn.lovableproject.com',
  'https://thinkandtalk.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace(/\/$/, ''))) 
    ? origin 
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Input validation constants
const MAX_PROMPT_LENGTH = 2000;
const MAX_MAIN_AREA_LENGTH = 200;
const MAX_COUNT = 20;
const MIN_COUNT = 1;

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === Authentication Check ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', terms: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', terms: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);
    // === End Authentication Check ===

    const body = await req.json();
    
    // Validate and sanitize inputs
    let prompt = body.prompt;
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Prompt is required", terms: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    prompt = prompt.trim().slice(0, MAX_PROMPT_LENGTH);
    
    let mainArea = body.mainArea;
    if (typeof mainArea === 'string') {
      mainArea = mainArea.trim().slice(0, MAX_MAIN_AREA_LENGTH);
    } else {
      mainArea = '';
    }
    
    let count = body.count;
    if (typeof count !== 'number' || isNaN(count)) {
      count = 5;
    }
    count = Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.floor(count)));

    console.log("Generating search terms for:", mainArea || 'general');

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates news search queries. Return only a JSON array of search term strings, nothing else.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable API error:", errorText);
      throw new Error(`Lovable API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("AI response:", content);

    // Parse the AI response - expect JSON array
    let terms: string[] = [];

    const tryParseJsonArray = (raw: string): string[] | null => {
      const cleaned = raw
        .replace(/```json\s*/gi, "")
        .replace(/```/g, "")
        .trim();

      // 1) Direct parse
      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // ignore
      }

      // 2) Extract first [...] block
      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");
      if (start >= 0 && end > start) {
        const slice = cleaned.slice(start, end + 1).replace(/,\s*]/g, "]");
        try {
          const parsed = JSON.parse(slice);
          if (Array.isArray(parsed)) return parsed.map(String);
        } catch {
          // ignore
        }
      }

      return null;
    };

    const parsedTerms = tryParseJsonArray(content);
    if (parsedTerms) {
      terms = parsedTerms;
    } else {
      // Fallback: extract terms from bullet/text output
      terms = content
        .split(/\r?\n/)
        .map((line: string) => line.replace(/^[-*\d.)\]]+\s*/, "").trim())
        .filter((line: string) => {
          const lower = line.toLowerCase();
          return Boolean(line) && lower !== "[" && lower !== "]" && lower !== "```" && lower !== "```json" && !lower.startsWith("```");
        });
    }

    terms = terms
      .map((t) => t.replace(/^"|"$/g, "").replace(/,$/g, "").trim())
      .filter(Boolean)
      .slice(0, count);

    console.log("Generated terms:", terms);

    return new Response(
      JSON.stringify({ terms }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating search terms:", message);
    const origin = req.headers.get('origin');
    return new Response(
      JSON.stringify({ error: message, terms: [] }),
      { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
