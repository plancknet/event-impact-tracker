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
const MAX_URL_LENGTH = 2048;
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

// Extract real URL from Google News redirect
function extractRealUrl(url: string): string {
  try {
    // Handle Google News redirect URLs
    if (url.includes('news.google.com')) {
      // Try to extract from ./articles/ format
      const articlesMatch = url.match(/\/articles\/([^?]+)/);
      if (articlesMatch) {
        // These are base64-encoded, just return original
        return url;
      }
      
      // Try URL parameter extraction
      const urlObj = new URL(url);
      const redirectUrl = urlObj.searchParams.get('url');
      if (redirectUrl) {
        return redirectUrl;
      }
    }
    return url;
  } catch {
    return url;
  }
}

// Paywall/protection detection keywords
const PAYWALL_INDICATORS = [
  'subscribe', 'subscription', 'paywall', 'premium', 'member',
  'sign in to continue', 'login to read', 'assine', 'assinante',
  'acesso exclusivo', 'conteúdo exclusivo', 'faça login',
  'create an account', 'register to continue', 'unlock this article'
];

function detectPaywall(content: string): boolean {
  const lowerContent = content.toLowerCase();
  const matchCount = PAYWALL_INDICATORS.filter(indicator => 
    lowerContent.includes(indicator)
  ).length;
  
  // If content is short AND has paywall indicators, likely paywalled
  return content.length < 1000 && matchCount >= 2;
}

// Simple extraction fallback
function extractContentSimple(html: string): string {
  // Remove scripts, styles, and other non-content elements
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Try to find article content
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]*class="[^"]*(?:article|post|content|entry|story)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<main[^>]*>([\s\S]*?)<\/main>/gi,
  ];

  for (const pattern of articlePatterns) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 0) {
      content = matches.map(m => m[1]).join('\n');
      break;
    }
  }

  // Clean HTML tags and normalize whitespace
  content = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return content;
}

// URL validation helper
function validateUrl(url: string): { valid: boolean; error?: string } {
  if (typeof url !== 'string' || url.length === 0) {
    return { valid: false, error: 'URL is required' };
  }
  
  if (url.length > MAX_URL_LENGTH) {
    return { valid: false, error: `URL too long. Maximum is ${MAX_URL_LENGTH} characters` };
  }
  
  try {
    const parsedUrl = new URL(url);
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return { valid: false, error: 'Invalid URL protocol. Only http and https are allowed' };
    }
    
    // Block internal/private IP ranges (comprehensive SSRF protection)
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // CRITICAL: Block cloud metadata endpoint (AWS/GCP/Azure credential theft)
    if (hostname === '169.254.169.254') {
      return { valid: false, error: 'Metadata endpoint blocked' };
    }
    
    // Block full link-local range 169.254.0.0/16
    if (hostname.startsWith('169.254.')) {
      return { valid: false, error: 'Link-local addresses blocked' };
    }
    
    // Block localhost variants (IPv4 and IPv6)
    if (
      hostname === 'localhost' ||
      hostname === 'localhost.' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.startsWith('0x7f') ||  // hex format
      hostname.startsWith('0177')     // octal format
    ) {
      return { valid: false, error: 'Localhost blocked' };
    }
    
    // Block private IPv4 ranges
    if (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname)
    ) {
      return { valid: false, error: 'Private IPs blocked' };
    }
    
    // Block IPv6 private/link-local ranges
    if (
      hostname.startsWith('fc') || hostname.startsWith('fd') ||       // ULA fc00::/7
      hostname.startsWith('fe80:') || hostname.startsWith('[fe80:') || // Link-local
      hostname.includes('::ffff:127') ||                               // IPv4-mapped localhost
      hostname.includes('::ffff:10.') ||                               // IPv4-mapped 10.x
      hostname.includes('::ffff:192.168') ||                           // IPv4-mapped 192.168.x
      hostname.includes('::ffff:172.') ||                              // IPv4-mapped 172.x
      hostname.includes('::ffff:169.254')                              // IPv4-mapped link-local
    ) {
      return { valid: false, error: 'Private IPv6 blocked' };
    }
    
    // Block internal domains
    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { valid: false, error: 'Internal domains blocked' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Firecrawl scraping
async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<{ success: boolean; content?: string; finalUrl?: string; error?: string }> {
  console.log('Attempting Firecrawl scrape for:', url);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();
    console.log('Firecrawl response status:', response.status);

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return { success: false, error: data.error || `Firecrawl error: ${response.status}` };
    }

    // Handle v1 API response structure
    const markdown = data.data?.markdown || data.markdown;
    const finalUrl = data.data?.metadata?.sourceURL || data.metadata?.sourceURL || url;

    if (!markdown || markdown.length < 100) {
      return { success: false, error: 'Firecrawl returned insufficient content' };
    }

    // Check for paywall
    if (detectPaywall(markdown)) {
      return { success: false, error: 'Conteúdo protegido por paywall detectado' };
    }

    return { success: true, content: markdown, finalUrl };
  } catch (error) {
    console.error('Firecrawl fetch error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Firecrawl request failed' };
  }
}

// Simple fetch fallback
async function scrapeSimple(url: string): Promise<{ success: boolean; content?: string; finalUrl?: string; error?: string }> {
  console.log('Attempting simple scrape for:', url);
  
  try {
    const realUrl = extractRealUrl(url);
    
    const response = await fetch(realUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const finalUrl = response.url || realUrl;
    
    const content = extractContentSimple(html);

    if (content.length < 200) {
      return { success: false, error: 'Conteúdo extraído muito curto - possível proteção' };
    }

    // Check for paywall
    if (detectPaywall(content)) {
      return { success: false, error: 'Conteúdo protegido por paywall detectado' };
    }

    return { success: true, content, finalUrl };
  } catch (error) {
    console.error('Simple scrape error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
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
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);
    // === End Authentication Check ===

    const body = await req.json();
    const url = body.url;

    // Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing URL:', url);

    // Check for Firecrawl API key
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    let result: { success: boolean; content?: string; finalUrl?: string; error?: string; extractor?: string };

    // Try Firecrawl first if available
    if (firecrawlKey) {
      console.log('Firecrawl key available, trying Firecrawl first');
      result = await scrapeWithFirecrawl(url, firecrawlKey);
      result.extractor = 'firecrawl';
      
      // If Firecrawl fails, fallback to simple
      if (!result.success) {
        console.log('Firecrawl failed, falling back to simple scrape');
        const simpleResult = await scrapeSimple(url);
        if (simpleResult.success) {
          result = { ...simpleResult, extractor: 'simple' };
        }
        // Keep Firecrawl error if simple also fails
      }
    } else {
      console.log('No Firecrawl key, using simple scrape');
      result = await scrapeSimple(url);
      result.extractor = 'simple';
    }

    console.log('Final result:', { success: result.success, extractor: result.extractor, contentLength: result.content?.length });

    return new Response(
      JSON.stringify({
        success: result.success,
        content: result.content,
        finalUrl: result.finalUrl || url,
        extractor: result.extractor,
        error: result.error,
        sourceUrl: url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Handler error:', error);
    const origin = req.headers.get('origin');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
