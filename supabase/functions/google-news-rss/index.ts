import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Security: Restrict CORS to allowed origins
const ALLOWED_ORIGINS = [
  'https://bficxnetrsuyzygutztn.lovableproject.com',
  'https://thinkandtalk.lovable.app',
  'https://thinkandtalk.site',
  'https://www.thinkandtalk.site',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin ?? ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// Input validation constants
const MAX_TERM_LENGTH = 200;
const MAX_LANGUAGE_LENGTH = 10;
const MAX_REGION_LENGTH = 10;

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const allowGuest = body?.allowGuest === true;

    // === Authentication Check ===
    let userId = "guest";
    if (!allowGuest) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', xml: '' }),
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
          JSON.stringify({ error: 'Unauthorized', xml: '' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = claimsData.claims.sub;
    }

    console.log("Authenticated user:", userId);
    // === End Authentication Check ===
    
    // Validate and sanitize term
    let term = typeof body.term === "string" ? body.term : "";
    term = term.replace(/\s+/g, " ").trim();
    if (term.length > MAX_TERM_LENGTH) {
      term = term.slice(0, MAX_TERM_LENGTH).trim();
    }
    if (!term) {
      return new Response(JSON.stringify({ error: "Invalid term", xml: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and sanitize language
    let language = body.language;
    if (typeof language !== "string" || language.trim().length === 0) {
      language = "en";
    } else {
      language = language.trim().slice(0, MAX_LANGUAGE_LENGTH);
      // Only allow alphanumeric and dash
      if (!/^[a-zA-Z-]+$/.test(language)) {
        language = "en";
      }
    }

    // Validate and sanitize region
    let region = body.region;
    if (typeof region !== "string" || region.trim().length === 0) {
      region = "US";
    } else {
      region = region.trim().slice(0, MAX_REGION_LENGTH).toUpperCase();
      // Only allow alphanumeric
      if (!/^[A-Z]+$/.test(region)) {
        region = "US";
      }
    }

    const ceid = `${region}:${language}`;

    const params = new URLSearchParams({
      q: term,
      hl: language,
      gl: region,
      ceid,
    });

    const url = `https://news.google.com/rss/search?${params.toString()}`;

    console.log("Fetching Google News RSS:", { term, lang: language, reg: region });

    const resp = await fetch(url, {
      headers: {
        // A mild UA helps reduce 403s from some upstreams.
        "User-Agent": "Mozilla/5.0 (compatible; LovableBot/1.0; +https://lovable.dev)",
        "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("Google News RSS upstream error:", resp.status, text?.slice(0, 200));
      return new Response(JSON.stringify({ error: `Upstream error (${resp.status})` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const xml = await resp.text();

    return new Response(JSON.stringify({ xml }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("google-news-rss error:", message);
    const origin = req.headers.get('origin');
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
    });
  }
});
