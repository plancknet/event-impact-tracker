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

  const items = await fetchRssForTerms(terms, {
    language: input.language,
    region: input.region,
    maxItemsPerTerm: input.maxItemsPerTerm,
  });

  return { items, terms };
}

export async function runNewsPipelineWithTerms(
  terms: NewsSearchTerm[],
  options?: { language?: string; region?: string; maxItemsPerTerm?: number },
): Promise<Selection> {
  const sanitizedTerms = terms.filter((term) => term.term.trim().length > 0);
  const items = await fetchRssForTerms(sanitizedTerms, {
    language: options?.language,
    region: options?.region,
    maxItemsPerTerm: options?.maxItemsPerTerm,
  });

  return { items, terms: sanitizedTerms };
}

async function fetchRssForTerms(
  terms: NewsSearchTerm[],
  options: { language?: string; region?: string; maxItemsPerTerm?: number },
): Promise<FullArticle[]> {
  const results = await Promise.all(
    terms.map(async (term) => {
      const items = await fetchGoogleNewsRss(term.term, {
        language: options.language,
        region: options.region,
        maxItems: options.maxItemsPerTerm,
      });
      return items.map((item) => ({ ...item, term: term.term }));
    }),
  );

  const allItems = results.flat();
  const deduped = dedupeRssItems(allItems);
  return deduped.map(toFullArticle);
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
    term: item.term,
  };
}
