import { createClient } from "npm:@supabase/supabase-js@2";

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
  const allowedOrigin = origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o.replace(/\/$/, '')))
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === Authentication Check ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);
    // === End Authentication Check ===

    // Use service role for database operations on deprecated tables
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting extraction of news results...");

    // Get all successful query results that haven't been extracted yet
    // First, get already processed query_result_ids
    const { data: existingResults, error: existingError } = await supabase
      .from("alert_news_results")
      .select("query_result_id");
    
    if (existingError) {
      console.error("Error checking existing results:", existingError);
    }
    
    const processedIds = new Set((existingResults || []).map(r => r.query_result_id));
    console.log(`Already processed ${processedIds.size} query results`);

    // Get all successful query results
    const { data: queryResults, error: queryError } = await supabase
      .from("alert_query_results")
      .select("id, raw_html, term_id")
      .eq("status", "success");

    if (queryError) {
      throw queryError;
    }

    // Filter to only unprocessed query results
    const unprocessedResults = (queryResults || []).filter(qr => !processedIds.has(qr.id));
    console.log(`Found ${queryResults?.length || 0} total query results, ${unprocessedResults.length} new to process`);

    let extractedCount = 0;

    const parsePublishedAt = (value: string | null) => {
      if (!value) return null;
      const cleaned = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
      const parsed = new Date(cleaned);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.toISOString();
    };

    for (const queryResult of unprocessedResults) {
      const xml = queryResult.raw_html;
      if (!xml) continue;

      console.log(`Processing query result ${queryResult.id}, content length: ${xml.length}`);

      // Parse RSS XML - extract <item> elements
      // Each item has: <title>, <link>, <description>
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let itemMatch;

      while ((itemMatch = itemRegex.exec(xml)) !== null) {
        const itemContent = itemMatch[1];

        // Extract title
        const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/i);
        let title = titleMatch ? titleMatch[1].trim() : null;
        // Clean CDATA
        if (title) {
          title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
          // Remove HTML entities
          title = title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
        }

        // Extract link
        const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/i);
        let link = linkMatch ? linkMatch[1].trim() : null;

        // Extract description/snippet
        const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/i);
        let snippet = descMatch ? descMatch[1].trim() : null;
        // Clean CDATA and HTML tags from snippet
        if (snippet) {
          snippet = snippet.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
          snippet = snippet.replace(/<[^>]*>/g, " ").trim();
          snippet = snippet.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
          snippet = snippet.replace(/\s+/g, " ").trim();
          // Limit snippet length
          if (snippet.length > 500) {
            snippet = snippet.substring(0, 500) + "...";
          }
        }

        // Extract source from title (Google News format: "Title - Source")
        let source = null;
        if (title && title.includes(" - ")) {
          const parts = title.split(" - ");
          source = parts[parts.length - 1];
          title = parts.slice(0, -1).join(" - ");
        }

        // Extract published date
        const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        const dcDateMatch = itemContent.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);
        const publishedMatch = itemContent.match(/<published>([\s\S]*?)<\/published>/i);
        const publishedAt = parsePublishedAt(
          pubDateMatch?.[1] || dcDateMatch?.[1] || publishedMatch?.[1] || null
        );

        if (title || link) {
          const { error: insertError } = await supabase.from("alert_news_results").insert({
            query_result_id: queryResult.id,
            title: title,
            snippet: snippet,
            link_url: link,
            source_raw: source,
            published_at: publishedAt,
          });

          if (!insertError) {
            extractedCount++;
            console.log(`Extracted: ${title?.substring(0, 50)}...`);
          } else {
            console.error("Insert error:", insertError);
          }
        }
      }
    }

    console.log(`Extraction complete. Extracted ${extractedCount} results.`);

    return new Response(
      JSON.stringify({ success: true, extractedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-news-results:", error);
    const origin = req.headers.get('origin');
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
