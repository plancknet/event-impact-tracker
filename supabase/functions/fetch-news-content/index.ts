const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract actual URL from Google News redirect URLs
function extractRealUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Handle Google News redirect URLs
    if (urlObj.hostname.includes('google.com') && urlObj.pathname === '/url') {
      const realUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
      if (realUrl) {
        console.log('Extracted real URL from Google redirect:', realUrl);
        return realUrl;
      }
    }
    
    // Handle news.google.com article URLs
    if (urlObj.hostname === 'news.google.com') {
      // These URLs often need to be followed to get the real article
      console.log('Google News URL detected, will follow redirects');
    }
    
    return url;
  } catch {
    return url;
  }
}

// Follow redirects manually to get the final URL
async function followRedirects(url: string, maxRedirects = 5): Promise<{ finalUrl: string; html: string }> {
  let currentUrl = url;
  let redirectCount = 0;
  
  while (redirectCount < maxRedirects) {
    console.log(`Fetching (redirect ${redirectCount}):`, currentUrl);
    
    const response = await fetch(currentUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'manual',
    });
    
    // Check for redirect
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        // Handle relative URLs
        if (location.startsWith('/')) {
          const urlObj = new URL(currentUrl);
          currentUrl = `${urlObj.protocol}//${urlObj.host}${location}`;
        } else if (!location.startsWith('http')) {
          const urlObj = new URL(currentUrl);
          currentUrl = `${urlObj.protocol}//${urlObj.host}/${location}`;
        } else {
          currentUrl = location;
        }
        redirectCount++;
        continue;
      }
    }
    
    // Check for meta refresh redirect in HTML
    if (response.ok) {
      const html = await response.text();
      
      // Check for meta refresh
      const metaRefreshMatch = html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'\s>]+)/i);
      if (metaRefreshMatch && redirectCount < maxRedirects) {
        let refreshUrl = metaRefreshMatch[1];
        if (refreshUrl.startsWith('/')) {
          const urlObj = new URL(currentUrl);
          refreshUrl = `${urlObj.protocol}//${urlObj.host}${refreshUrl}`;
        } else if (!refreshUrl.startsWith('http')) {
          const urlObj = new URL(currentUrl);
          refreshUrl = `${urlObj.protocol}//${urlObj.host}/${refreshUrl}`;
        }
        currentUrl = refreshUrl;
        redirectCount++;
        continue;
      }
      
      // Check for JavaScript redirects
      const jsRedirectMatch = html.match(/window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/i) ||
                              html.match(/location\.replace\(["']([^"']+)["']\)/i);
      if (jsRedirectMatch && redirectCount < maxRedirects) {
        let jsUrl = jsRedirectMatch[1];
        if (jsUrl.startsWith('/')) {
          const urlObj = new URL(currentUrl);
          jsUrl = `${urlObj.protocol}//${urlObj.host}${jsUrl}`;
        } else if (!jsUrl.startsWith('http')) {
          const urlObj = new URL(currentUrl);
          jsUrl = `${urlObj.protocol}//${urlObj.host}/${jsUrl}`;
        }
        currentUrl = jsUrl;
        redirectCount++;
        continue;
      }
      
      return { finalUrl: currentUrl, html };
    }
    
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  throw new Error('Too many redirects');
}

// Extract main content from HTML
function extractContent(html: string): string {
  let content = html;
  
  // Remove scripts, styles, and non-content elements
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  content = content.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ');
  content = content.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ');
  content = content.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');
  content = content.replace(/<!--[\s\S]*?-->/g, ' ');
  
  // Try to find article content using common patterns
  const patterns = [
    // Article tag
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    // Main tag
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    // Common article class patterns
    /<div[^>]*class="[^"]*(?:article-body|article-content|article__body|article__content|post-content|post-body|entry-content|story-body|story-content|news-body|news-content|content-article|texto|materia|noticia)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // ID patterns
    /<div[^>]*id="[^"]*(?:article|content|post|story|news|texto|materia)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // Paragraph-heavy sections (likely content)
    /(<p[^>]*>[\s\S]{100,}?<\/p>[\s\S]*?<p[^>]*>[\s\S]{100,}?<\/p>)/i,
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].length > 200) {
      content = match[1];
      console.log('Found content using pattern, length:', content.length);
      break;
    }
  }
  
  // Remove navigation, header, footer, sidebar elements
  content = content.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ');
  content = content.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');
  content = content.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ');
  content = content.replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ');
  content = content.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, ' ');
  
  // Remove common non-content divs
  content = content.replace(/<div[^>]*class="[^"]*(?:sidebar|menu|nav|footer|header|comment|social|share|related|advertisement|ad-|ads-|banner)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ' ');
  
  // Remove all remaining HTML tags
  content = content.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  content = content.replace(/&nbsp;/g, ' ');
  content = content.replace(/&amp;/g, '&');
  content = content.replace(/&lt;/g, '<');
  content = content.replace(/&gt;/g, '>');
  content = content.replace(/&quot;/g, '"');
  content = content.replace(/&#39;/g, "'");
  content = content.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  content = content.replace(/&[a-zA-Z]+;/g, ' ');
  
  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  // Remove very short lines that are likely navigation or UI text
  const lines = content.split(/(?<=[.!?])\s+/);
  const meaningfulLines = lines.filter(line => line.length > 30);
  content = meaningfulLines.join(' ');
  
  return content;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Original URL:', url);
    
    // Extract real URL if it's a Google redirect
    const realUrl = extractRealUrl(url);
    console.log('Processing URL:', realUrl);

    // Fetch with redirect following
    const { finalUrl, html } = await followRedirects(realUrl);
    console.log('Final URL after redirects:', finalUrl);
    console.log('HTML length:', html.length);
    
    // Extract content
    const content = extractContent(html);
    
    if (content.length < 100) {
      console.warn('Content too short, might be a paywall or failed extraction');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível extrair o conteúdo. O site pode ter paywall ou proteção contra bots.',
          finalUrl 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Limit content length
    const finalContent = content.length > 50000 ? content.substring(0, 50000) + '...' : content;

    console.log('Content extracted successfully, length:', finalContent.length);

    return new Response(
      JSON.stringify({ success: true, content: finalContent, finalUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch content';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
