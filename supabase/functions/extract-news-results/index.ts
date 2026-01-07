import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
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

        if (title || link) {
          const { error: insertError } = await supabase.from("alert_news_results").insert({
            query_result_id: queryResult.id,
            title: title,
            snippet: snippet,
            link_url: link,
            source_raw: source,
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
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
