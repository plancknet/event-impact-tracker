import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, mainArea, count = 5 } = await req.json();

    console.log("Generating search terms for:", mainArea);

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
    return new Response(
      JSON.stringify({ error: message, terms: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
