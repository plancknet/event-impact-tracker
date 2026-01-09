import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { term, language = "en", region = "US" } = await req.json();

    if (typeof term !== "string" || term.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Invalid term" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = typeof language === "string" && language.trim() ? language.trim() : "en";
    const reg = typeof region === "string" && region.trim() ? region.trim() : "US";
    const ceid = `${reg}:${lang}`;

    const params = new URLSearchParams({
      q: term.trim(),
      hl: lang,
      gl: reg,
      ceid,
    });

    const url = `https://news.google.com/rss/search?${params.toString()}`;

    console.log("Fetching Google News RSS:", { term: term.trim(), lang, reg });

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
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
