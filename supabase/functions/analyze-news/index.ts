import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const AI_MODEL = 'google/gemini-2.5-flash';

const ANALYSIS_PROMPT = `You are a financial news analyst specializing in market impact assessment. Analyze the following news article and extract structured information for event-driven financial modeling.

**News Article:**
- Title: {title}
- URL: {url}
- Snippet: {snippet}
- Full Content: {content}

**Instructions:**
Analyze this news and return a JSON object with the following structure. Be precise and objective in your assessments.

**Required JSON Response:**
{
  "summary": "A concise 2-3 sentence summary of the key points and financial implications",
  "categories": ["category1", "category2"],
  "region": "Primary geographic region affected (e.g., US, EU, LATAM, Asia, Global)",
  "impact_asset_class": "Primary asset class affected (e.g., crypto, equities, fixed_income, commodities, forex)",
  "impact_direction": "bullish, bearish, or neutral",
  "confidence_score": 0.0 to 1.0,
  "model_variables": {
    "M": 0.0 to 1.0,
    "s": 0.0 to 1.0,
    "r": 0.0 to 1.0,
    "u": 0.0 to 1.0,
    "p_e": 0.0 to 1.0,
    "a": 0.0 to 1.0,
    "e": 0.0 to 1.0,
    "g": 0.0 to 1.0,
    "v": 0.0 to 1.0,
    "A_n": 0.0 to 1.0,
    "b": 0.0 to 1.0,
    "f_m": 0.0 to 1.0,
    "f_n": 0.0 to 1.0
  }
}

**Variable Definitions for model_variables:**
- M: Magnitude of the event (0=minor, 1=major global event)
- s: Surprise factor (0=fully expected, 1=completely unexpected)
- r: Relevance to crypto/BTC (0=unrelated, 1=directly about crypto)
- u: Uncertainty created (0=clarifying, 1=highly uncertain)
- p_e: Probability the event materializes fully (0=unlikely, 1=certain)
- a: Attention/media coverage expected (0=low coverage, 1=viral/major coverage)
- e: Economic impact magnitude (0=negligible, 1=severe)
- g: Geopolitical significance (0=local, 1=global implications)
- v: Market volatility expectation (0=stable, 1=high volatility expected)
- A_n: Novelty/uniqueness of the event (0=routine, 1=unprecedented)
- b: Behavioral/sentiment impact (0=neutral sentiment, 1=strong emotional reaction)
- f_m: Macro-financial relevance (0=micro, 1=systemic macro)
- f_n: Narrative strength (0=weak narrative, 1=strong compelling narrative)

**Categories to choose from:** macro, geopolitics, crypto, regulation, monetary_policy, inflation, employment, trade, tech, corporate, commodities, fx, emerging_markets, central_banks, fiscal_policy

Return ONLY the JSON object, no additional text.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newsItems } = await req.json();

    if (!newsItems || !Array.isArray(newsItems) || newsItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No news items provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results: Array<{ newsId: string; success: boolean; error?: string; analysisId?: string }> = [];

    for (const item of newsItems) {
      const { newsId, fullContentId, title, snippet, linkUrl, contentFull } = item;

      console.log(`Analyzing news: ${newsId} - ${title?.substring(0, 50)}...`);

      try {
        // Build the prompt with the news content
        const prompt = ANALYSIS_PROMPT
          .replace('{title}', title || 'N/A')
          .replace('{url}', linkUrl || 'N/A')
          .replace('{snippet}', snippet || 'N/A')
          .replace('{content}', (contentFull || '').substring(0, 15000)); // Limit content size

        // Call the Lovable AI Gateway
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI API error for ${newsId}:`, aiResponse.status, errorText);
          
          if (aiResponse.status === 429) {
            results.push({ newsId, success: false, error: 'Rate limit exceeded. Please try again later.' });
            continue;
          }
          if (aiResponse.status === 402) {
            results.push({ newsId, success: false, error: 'Payment required. Please add credits to your workspace.' });
            continue;
          }
          
          results.push({ newsId, success: false, error: `AI API error: ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        const rawContent = aiData.choices?.[0]?.message?.content;

        if (!rawContent) {
          console.error(`No content in AI response for ${newsId}`);
          results.push({ newsId, success: false, error: 'No content in AI response' });
          continue;
        }

        console.log(`Raw AI response for ${newsId}:`, rawContent.substring(0, 500));

        // Parse the JSON response
        let parsedAnalysis;
        try {
          // Remove markdown code blocks if present
          let jsonContent = rawContent.trim();
          if (jsonContent.startsWith('```json')) {
            jsonContent = jsonContent.slice(7);
          } else if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.slice(3);
          }
          if (jsonContent.endsWith('```')) {
            jsonContent = jsonContent.slice(0, -3);
          }
          jsonContent = jsonContent.trim();

          parsedAnalysis = JSON.parse(jsonContent);
        } catch (parseError) {
          console.error(`Failed to parse AI response for ${newsId}:`, parseError);
          results.push({ newsId, success: false, error: 'Failed to parse AI response as JSON' });
          continue;
        }

        // Insert into database
        const { data: insertData, error: insertError } = await supabase
          .from('news_ai_analysis')
          .insert({
            news_id: newsId,
            full_content_id: fullContentId,
            ai_model: AI_MODEL,
            summary: parsedAnalysis.summary || null,
            categories: Array.isArray(parsedAnalysis.categories) 
              ? parsedAnalysis.categories.join(', ') 
              : parsedAnalysis.categories || null,
            region: parsedAnalysis.region || null,
            impact_asset_class: parsedAnalysis.impact_asset_class || null,
            impact_direction: parsedAnalysis.impact_direction || null,
            confidence_score: parsedAnalysis.confidence_score || null,
            selected_for_model: true,
            model_variables_json: parsedAnalysis.model_variables 
              ? JSON.stringify(parsedAnalysis.model_variables) 
              : null,
            raw_ai_response: JSON.stringify(aiData),
          })
          .select('id')
          .single();

        if (insertError) {
          console.error(`Database insert error for ${newsId}:`, insertError);
          results.push({ newsId, success: false, error: `Database error: ${insertError.message}` });
          continue;
        }

        console.log(`Successfully analyzed and stored ${newsId}`);
        results.push({ newsId, success: true, analysisId: insertData.id });

      } catch (itemError) {
        console.error(`Error processing ${newsId}:`, itemError);
        results.push({ 
          newsId, 
          success: false, 
          error: itemError instanceof Error ? itemError.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Analysis complete: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: { total: results.length, success: successCount, failed: failCount }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-news function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
