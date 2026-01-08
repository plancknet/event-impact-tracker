import type { RssItem } from "./types";

type GoogleNewsRssOptions = {
  language?: string;
  region?: string;
  maxItems?: number;
};

export function buildGoogleNewsRssUrl(term: string, options: GoogleNewsRssOptions = {}): string {
  const language = options.language ?? "en";
  const region = options.region ?? "US";
  const ceid = `${region}:${language}`;
  const params = new URLSearchParams({
    q: term,
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
  const url = buildGoogleNewsRssUrl(term, options);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google News RSS request failed (${response.status})`);
  }

  const xml = await response.text();
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
