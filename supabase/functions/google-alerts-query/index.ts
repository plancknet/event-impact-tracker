import { createClient } from "npm:@supabase/supabase-js@2";

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
const MAX_TERM_LENGTH = 200;
const MAX_TERM_ID_LENGTH = 100;
const MAX_LANGUAGE_LENGTH = 10;

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate and sanitize inputs
    let termId = body.termId;
    let term = body.term;
    let language = body.language;
    
    if (typeof termId !== 'string' || termId.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "termId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    termId = termId.trim().slice(0, MAX_TERM_ID_LENGTH);
    
    if (typeof term !== 'string' || term.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "term is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    term = term.trim().slice(0, MAX_TERM_LENGTH);

    console.log(`Querying Google News for term: ${term}`);

    // Validate and sanitize language
    const languageKey = typeof language === "string" && language.trim() 
      ? language.trim().slice(0, MAX_LANGUAGE_LENGTH) 
      : "pt-BR";
      
    const languageMap: Record<string, { hl: string; gl: string; ceid: string; accept: string }> = {
      "pt-BR": { hl: "pt-BR", gl: "BR", ceid: "BR:pt", accept: "pt-BR,pt;q=0.8,en-US;q=0.5" },
      "en-US": { hl: "en-US", gl: "US", ceid: "US:en", accept: "en-US,en;q=0.7" },
      "en-GB": { hl: "en-GB", gl: "GB", ceid: "GB:en", accept: "en-GB,en;q=0.7" },
      "es-ES": { hl: "es-ES", gl: "ES", ceid: "ES:es", accept: "es-ES,es;q=0.7" },
      "fr-FR": { hl: "fr-FR", gl: "FR", ceid: "FR:fr", accept: "fr-FR,fr;q=0.7" },
      "de-DE": { hl: "de-DE", gl: "DE", ceid: "DE:de", accept: "de-DE,de;q=0.7" },
      "it-IT": { hl: "it-IT", gl: "IT", ceid: "IT:it", accept: "it-IT,it;q=0.7" },
    };
    const langConfig = languageMap[languageKey] || languageMap["pt-BR"];

    const encodedTerm = encodeURIComponent(term);
    const newsUrl = `https://news.google.com/rss/search?q=${encodedTerm}&hl=${langConfig.hl}&gl=${langConfig.gl}&ceid=${langConfig.ceid}`;

    console.log(`Fetching URL: ${newsUrl}`);

    let rawHtml = "";
    let status = "error";

    try {
      const response = await fetch(newsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
          "Accept-Language": langConfig.accept,
        },
      });

      rawHtml = await response.text();
      status = response.ok ? "success" : "error";
      console.log(`Response status: ${response.status}, Content length: ${rawHtml.length}`);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      rawHtml = `Error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`;
      status = "error";
    }

    // Save result to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await supabase.from("alert_query_results").insert({
      term_id: termId,
      raw_html: rawHtml,
      status: status,
      content_language: languageKey,
      queried_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully saved query result for term: ${term}, status: ${status}`);

    return new Response(
      JSON.stringify({ success: true, status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in google-alerts-query:", error);
    const origin = req.headers.get('origin');
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
