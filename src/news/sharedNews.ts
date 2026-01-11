import type { FullArticle } from "./types";

type SharedNewsContext = {
  topic: string;
  language?: string;
  region?: string;
};

type SharedNewsFetchOptions = {
  language?: string;
  region?: string;
  sinceHours?: number;
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeTopic = (topic: string) => normalizeText(topic);

/**
 * Stub implementation - shared_news_items table doesn't exist yet.
 * These functions are placeholders for when the table is created.
 */
export async function upsertSharedNewsItems(
  _items: FullArticle[],
  _context: SharedNewsContext,
): Promise<void> {
  // No-op: table doesn't exist
  console.warn("upsertSharedNewsItems: shared_news_items table not available");
}

export async function fetchSharedNewsItems(
  _topic: string,
  _options: SharedNewsFetchOptions = {},
): Promise<FullArticle[]> {
  // No-op: table doesn't exist
  console.warn("fetchSharedNewsItems: shared_news_items table not available");
  return [];
}
