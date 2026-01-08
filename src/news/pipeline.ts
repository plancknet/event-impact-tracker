import type { FullArticle, NewsSearchTerm, RssItem, Selection } from "./types";
import { fetchGoogleNewsRss } from "./googleNewsRss";

type PipelineInput = {
  topic: string;
  region?: string;
  language?: string;
  maxItemsPerTerm?: number;
};

export function buildSearchTerms(topic: string, region?: string): NewsSearchTerm[] {
  const trimmed = topic.trim();
  if (!trimmed) return [];

  const baseTerms = [
    trimmed,
    `${trimmed} news`,
    `${trimmed} latest`,
    `${trimmed} update`,
  ];

  const withRegion =
    region?.trim() ? baseTerms.map((term) => `${term} ${region.trim()}`) : [];

  return [...baseTerms, ...withRegion].map((term) => ({ term, region }));
}

export async function runNewsPipeline(input: PipelineInput): Promise<Selection> {
  const terms = buildSearchTerms(input.topic, input.region);

  const results = await Promise.all(
    terms.map((term) =>
      fetchGoogleNewsRss(term.term, {
        language: input.language,
        region: input.region,
        maxItems: input.maxItemsPerTerm,
      }),
    ),
  );

  const allItems = results.flat();
  const deduped = dedupeRssItems(allItems);
  const items = deduped.map(toFullArticle);

  return { items, terms };
}

function dedupeRssItems(items: RssItem[]): RssItem[] {
  const map = new Map<string, RssItem>();
  items.forEach((item) => {
    const key = item.link || item.title;
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}

function toFullArticle(item: RssItem): FullArticle {
  return {
    id: item.id,
    title: item.title,
    link: item.link,
    publishedAt: item.publishedAt,
    source: item.source,
    summary: item.snippet,
  };
}
