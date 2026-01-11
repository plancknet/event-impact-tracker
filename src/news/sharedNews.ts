import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import type { FullArticle } from "./types";
import { buildGoogleNewsRssUrl } from "./googleNewsRss";

type SharedNewsRow = Tables<"shared_news_items">;
type SharedNewsInsert = TablesInsert<"shared_news_items">;

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

const toIsoString = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const buildRssUrl = (term: string | undefined, context: SharedNewsContext) => {
  const query = term?.trim() || context.topic;
  return buildGoogleNewsRssUrl(query, {
    language: context.language,
    region: context.region,
  });
};

const toFullArticle = (row: SharedNewsRow): FullArticle => ({
  id: row.rss_id || row.link_url,
  title: row.title,
  link: row.link_url,
  publishedAt: row.published_at ?? undefined,
  fetchedAt: row.fetched_at ?? undefined,
  source: row.source ?? undefined,
  summary: row.summary ?? undefined,
  term: row.term ?? undefined,
});

export async function upsertSharedNewsItems(
  items: FullArticle[],
  context: SharedNewsContext,
): Promise<void> {
  if (!items.length) return;
  const topicNorm = normalizeTopic(context.topic);
  const payload: SharedNewsInsert[] = items
    .map((item) => {
      if (!item.link || !item.title) return null;
      return {
        topic: context.topic,
        topic_norm: topicNorm,
        term: item.term ?? null,
        rss_id: item.id ?? null,
        title: item.title,
        title_norm: normalizeText(item.title),
        link_url: item.link,
        source: item.source ?? null,
        summary: item.summary ?? null,
        published_at: toIsoString(item.publishedAt),
        fetched_at: toIsoString(item.fetchedAt) ?? new Date().toISOString(),
        language: context.language?.trim() || null,
        region: context.region?.trim() || null,
        rss_url: buildRssUrl(item.term, context),
      };
    })
    .filter(Boolean) as SharedNewsInsert[];

  if (!payload.length) return;

  const { error } = await supabase
    .from("shared_news_items")
    .upsert(payload, { onConflict: "topic_norm,link_url" });

  if (error) throw error;
}

export async function fetchSharedNewsItems(
  topic: string,
  options: SharedNewsFetchOptions = {},
): Promise<FullArticle[]> {
  const topicNorm = normalizeTopic(topic);
  let query = supabase
    .from("shared_news_items")
    .select(
      "rss_id, title, link_url, published_at, fetched_at, source, summary, term",
    )
    .eq("topic_norm", topicNorm);

  if (options.language?.trim()) {
    query = query.eq("language", options.language.trim());
  }
  if (options.region?.trim()) {
    query = query.eq("region", options.region.trim());
  }
  if (typeof options.sinceHours === "number" && options.sinceHours > 0) {
    const cutoff = new Date(
      Date.now() - options.sinceHours * 60 * 60 * 1000,
    ).toISOString();
    query = query.gte("fetched_at", cutoff);
  }

  const { data, error } = await query
    .order("published_at", { ascending: false })
    .order("fetched_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => toFullArticle(row as SharedNewsRow));
}
