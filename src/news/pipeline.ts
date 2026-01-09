import type { FullArticle, NewsSearchTerm, RssItem, Selection } from "./types";
import { fetchGoogleNewsRss } from "./googleNewsRss";

type PipelineInput = {
  topic: string;
  region?: string;
  language?: string;
  maxItemsPerTerm?: number;
  minItemsPerTerm?: number;
  initialWindowHours?: number;
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
    minItemsPerTerm: input.minItemsPerTerm,
    initialWindowHours: input.initialWindowHours,
  });

  return { items, terms };
}

export async function runNewsPipelineWithTerms(
  terms: NewsSearchTerm[],
  options?: {
    language?: string;
    region?: string;
    maxItemsPerTerm?: number;
    minItemsPerTerm?: number;
    initialWindowHours?: number;
  },
): Promise<Selection> {
  const sanitizedTerms = terms.filter((term) => term.term.trim().length > 0);
  const items = await fetchRssForTerms(sanitizedTerms, {
    language: options?.language,
    region: options?.region,
    maxItemsPerTerm: options?.maxItemsPerTerm,
    minItemsPerTerm: options?.minItemsPerTerm,
    initialWindowHours: options?.initialWindowHours,
  });

  return { items, terms: sanitizedTerms };
}

async function fetchRssForTerms(
  terms: NewsSearchTerm[],
  options: {
    language?: string;
    region?: string;
    maxItemsPerTerm?: number;
    minItemsPerTerm?: number;
    initialWindowHours?: number;
  },
): Promise<FullArticle[]> {
  const results = await Promise.all(
    terms.map(async (term) => {
      const minItems = options.minItemsPerTerm ?? 0;
      const fetchMaxItems = Math.max(options.maxItemsPerTerm ?? 0, minItems * 6 || 0);
      const items = await fetchGoogleNewsRss(term.term, {
        language: options.language,
        region: options.region,
        maxItems: fetchMaxItems || options.maxItemsPerTerm,
      });
      const windowedItems = filterItemsByWindow(items, {
        minItemsPerTerm: minItems,
        initialWindowHours: options.initialWindowHours ?? 24,
      });
      return windowedItems.map((item) => ({ ...item, term: term.term }));
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

function filterItemsByWindow(
  items: RssItem[],
  options: { minItemsPerTerm: number; initialWindowHours: number },
): RssItem[] {
  if (items.length === 0) return items;
  const minItems = Math.max(0, options.minItemsPerTerm);
  if (minItems === 0) return items;

  const stepHours = 24;
  let windowHours = Math.max(stepHours, options.initialWindowHours || stepHours);
  let filtered = filterByPublishedWindow(items, windowHours);

  while (filtered.length < minItems) {
    const nextWindow = windowHours + stepHours;
    const expanded = filterByPublishedWindow(items, nextWindow);
    if (expanded.length === filtered.length) break;
    windowHours = nextWindow;
    filtered = expanded;
  }

  return filtered;
}

function filterByPublishedWindow(items: RssItem[], windowHours: number): RssItem[] {
  const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
  return items.filter((item) => {
    if (!item.publishedAt) return true;
    const publishedTime = new Date(item.publishedAt).getTime();
    if (Number.isNaN(publishedTime)) return true;
    return publishedTime >= cutoff;
  });
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
