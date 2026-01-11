import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Security: Restrict CORS to allowed origins
const ALLOWED_ORIGINS = [
  'https://bficxnetrsuyzygutztn.lovableproject.com',
  'https://thinkandtalk.lovable.app',
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
    
    // Validate and sanitize term
    let term = body.term;
    if (typeof term !== "string" || term.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Invalid term" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Validate term length
    term = term.trim();
    if (term.length > MAX_TERM_LENGTH) {
      return new Response(JSON.stringify({ error: `Term too long. Maximum is ${MAX_TERM_LENGTH} characters` }), {
        status: 400,
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
