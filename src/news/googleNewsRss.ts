import { supabase } from "@/integrations/supabase/client";
import type { RssItem } from "./types";

type GoogleNewsRssOptions = {
  language?: string;
  region?: string;
  maxItems?: number;
};

const MAX_TERM_LENGTH = 200;

const sanitizeTerm = (value: string) => {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  if (trimmed.length <= MAX_TERM_LENGTH) return trimmed;
  return trimmed.slice(0, MAX_TERM_LENGTH).trim();
};

export function buildGoogleNewsRssUrl(term: string, options: GoogleNewsRssOptions = {}): string {
  const language = options.language ?? "en";
  const region = options.region ?? "US";
  const sanitizedTerm = sanitizeTerm(term);
  const ceid = `${region}:${language}`;
  const params = new URLSearchParams({
    q: sanitizedTerm,
    hl: language,
    gl: region,
    ceid,
  });

  return `https://news.google.com/rss/search?${params.toString()}`;
}

export async function fetchGoogleNewsRss(
  term: string,
  options: GoogleNewsRssOptions = {},
): Promise<RssItem[]> {
  const sanitizedTerm = sanitizeTerm(term);
  if (!sanitizedTerm) return [];
  const { data, error } = await supabase.functions.invoke("google-news-rss", {
    body: {
      term: sanitizedTerm,
      language: options.language ?? "en",
      region: options.region ?? "US",
      allowGuest: true,
    },
  });

  if (error) {
    const message =
      typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Unknown error";
    throw new Error(message);
  }

  const payload = (data as { xml?: string; error?: string } | null) || {};
  if (payload.error) {
    console.warn("Google News RSS proxy error:", payload.error);
    return [];
  }
  const xml = payload.xml ?? "";
  if (!xml) {
    return [];
  }

  return parseGoogleNewsRss(xml, options.maxItems);
}

export function parseGoogleNewsRss(xml: string, maxItems?: number): RssItem[] {
  if (typeof DOMParser === "undefined") {
    throw new Error("DOMParser is not available in this environment.");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const items = Array.from(doc.querySelectorAll("item"));

  const parsed = items.map((item) => {
    const title = item.querySelector("title")?.textContent?.trim() ?? "Untitled";
    const link = item.querySelector("link")?.textContent?.trim() ?? "";
    const guid = item.querySelector("guid")?.textContent?.trim();
    const publishedAt = item.querySelector("pubDate")?.textContent?.trim();
    const source = item.querySelector("source")?.textContent?.trim();
    const description = item.querySelector("description")?.textContent?.trim();

    return {
      id: guid || link || title,
      title,
      link,
      publishedAt,
      source,
      snippet: description ? stripHtml(description) : undefined,
    } satisfies RssItem;
  });

  return typeof maxItems === "number" ? parsed.slice(0, maxItems) : parsed;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
