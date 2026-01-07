import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get all successful query results
    const { data: queryResults, error: queryError } = await supabase
      .from("alert_query_results")
      .select("id, raw_html, term_id")
      .eq("status", "success");

    if (queryError) {
      throw queryError;
    }

    console.log(`Found ${queryResults?.length || 0} query results to process`);

    // Delete existing extracted results to avoid duplicates
    const { error: deleteError } = await supabase
      .from("alert_news_results")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      console.error("Error deleting existing results:", deleteError);
    }

    let extractedCount = 0;

    for (const queryResult of queryResults || []) {
      const html = queryResult.raw_html;
      if (!html) continue;

      // Extract results using regex patterns for Google Alerts HTML
      // Pattern 1: Look for result blocks with class="result"
      const resultPattern = /<div[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      const titleLinkPattern = /<a[^>]*class="[^"]*result_title_link[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

      // Try to extract from JSON response (Google Alerts returns JSON in some cases)
      try {
        // Look for JSON array in the response
        const jsonMatch = html.match(/\[\[.*?\]\]/s);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          // Parse the nested array structure
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (Array.isArray(item) && item.length > 1) {
                // Extract title and URL from the nested structure
                const extractFromArray = (arr: any[]): { title?: string; url?: string; snippet?: string } => {
                  const result: { title?: string; url?: string; snippet?: string } = {};
                  for (const elem of arr) {
                    if (typeof elem === "string") {
                      if (elem.startsWith("http")) {
                        result.url = elem;
                      } else if (elem.length > 10 && elem.length < 200) {
                        if (!result.title) result.title = elem;
                        else if (!result.snippet) result.snippet = elem;
                      }
                    } else if (Array.isArray(elem)) {
                      const nested = extractFromArray(elem);
                      if (!result.url && nested.url) result.url = nested.url;
                      if (!result.title && nested.title) result.title = nested.title;
                      if (!result.snippet && nested.snippet) result.snippet = nested.snippet;
                    }
                  }
                  return result;
                };

                const extracted = extractFromArray(item);
                if (extracted.title || extracted.url) {
                  const { error: insertError } = await supabase.from("alert_news_results").insert({
                    query_result_id: queryResult.id,
                    title: extracted.title || null,
                    snippet: extracted.snippet || null,
                    link_url: extracted.url || null,
                    source_raw: JSON.stringify(item).substring(0, 500),
                  });

                  if (!insertError) {
                    extractedCount++;
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.log("Not a JSON response, trying HTML parsing");
      }

      // Fallback: Try HTML parsing
      let match;
      while ((match = titleLinkPattern.exec(html)) !== null) {
        const url = match[1];
        const titleHtml = match[2];
        const title = titleHtml.replace(/<[^>]*>/g, "").trim();

        if (url && title) {
          const { error: insertError } = await supabase.from("alert_news_results").insert({
            query_result_id: queryResult.id,
            title: title,
            snippet: null,
            link_url: url.startsWith("/url?") ? decodeURIComponent(url.split("q=")[1]?.split("&")[0] || url) : url,
            source_raw: match[0].substring(0, 500),
          });

          if (!insertError) {
            extractedCount++;
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
