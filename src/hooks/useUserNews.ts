import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserNewsItem {
  id: string;
  user_id: string;
  title: string;
  link?: string | null;
  published_at?: string | null;
  source?: string | null;
  summary?: string | null;
  external_id?: string | null;
  topic: string;
  language?: string | null;
  fetched_at: string;
  created_at: string;
}

interface FetchedNewsItem {
  title: string;
  link?: string;
  publishedAt?: string;
  source?: string;
  summary?: string;
  id?: string;
}

export function useUserNews() {
  const { user } = useAuth();
  const [newsItems, setNewsItems] = useState<UserNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load news from database
  const loadNews = useCallback(async (topic?: string) => {
    if (!user) {
      setIsLoading(false);
      return newsItems;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("user_news_items")
        .select("*")
        .eq("user_id", user.id)
        .order("fetched_at", { ascending: false });

      if (topic) {
        query = query.eq("topic", topic);
      }

      const { data, error: fetchError } = await query.limit(50);

      if (fetchError) throw fetchError;

      const items = (data || []) as UserNewsItem[];
      setNewsItems(items);
      return items;
    } catch (err) {
      console.error("Failed to load news:", err);
      setError("Não foi possível carregar as notícias.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, newsItems]);

  // Fetch news from Google RSS and save to database (or keep locally for guests)
  const fetchAndSaveNews = useCallback(async (topic: string, language: string = "pt-BR") => {
    if (!topic.trim()) {
      setError("Defina um tema principal.");
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!user) {
        const { data, error: fetchError } = await supabase.functions.invoke("google-news-rss", {
          body: {
            term: topic,
            language: language.split("-")[0] || "pt",
            region: language.split("-")[1]?.toUpperCase() || "BR",
          },
        });

        if (fetchError) throw fetchError;

        const xmlText = data?.xml || "";
        const items = parseRssXml(xmlText);

        if (items.length === 0) {
          setNewsItems([]);
          return [];
        }

        const now = new Date().toISOString();
        const guestItems = items.map((item, index) => ({
          id: item.id || `guest-${index}-${Date.now()}`,
          user_id: "guest",
          title: item.title,
          link: item.link || null,
          published_at: item.publishedAt || null,
          source: item.source || null,
          summary: item.summary || null,
          external_id: item.id || `guest-${index}-${Date.now()}`,
          topic: topic,
          language: language,
          fetched_at: now,
          created_at: now,
        }));

        setNewsItems(guestItems);
        return guestItems;
      }

      // First, clear old news for this topic
      await supabase
        .from("user_news_items")
        .delete()
        .eq("user_id", user.id)
        .eq("topic", topic);

      // Fetch fresh news from edge function
      const { data, error: fetchError } = await supabase.functions.invoke("google-news-rss", {
        body: {
          term: topic,
          language: language.split("-")[0] || "pt",
          region: language.split("-")[1]?.toUpperCase() || "BR",
        },
      });

      if (fetchError) throw fetchError;

      // Parse XML response
      const xmlText = data?.xml || "";
      const items = parseRssXml(xmlText);

      if (items.length === 0) {
        setNewsItems([]);
        return [];
      }

      // Save to database
      const now = new Date().toISOString();
      const newsToInsert = items.map((item, index) => ({
        user_id: user.id,
        title: item.title,
        link: item.link || null,
        published_at: item.publishedAt || null,
        source: item.source || null,
        summary: item.summary || null,
        external_id: item.id || `${topic}-${index}-${Date.now()}`,
        topic: topic,
        language: language,
        fetched_at: now,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("user_news_items")
        .insert(newsToInsert)
        .select();

      if (insertError) throw insertError;

      const savedItems = (inserted || []) as UserNewsItem[];
      setNewsItems(savedItems);
      return savedItems;
    } catch (err) {
      console.error("Failed to fetch and save news:", err);
      setError("Não foi possível buscar as notícias. Tente novamente.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Delete all news for a topic
  const clearNews = useCallback(async (topic?: string) => {
    if (!user) {
      setNewsItems([]);
      return;
    }

    try {
      let query = supabase
        .from("user_news_items")
        .delete()
        .eq("user_id", user.id);

      if (topic) {
        query = query.eq("topic", topic);
      }

      await query;
      setNewsItems([]);
    } catch (err) {
      console.error("Failed to clear news:", err);
    }
  }, [user]);

  return {
    newsItems,
    isLoading,
    error,
    loadNews,
    fetchAndSaveNews,
    clearNews,
    setLocalNewsItems: setNewsItems,
  };
}

// Parse Google News RSS XML
function parseRssXml(xml: string): FetchedNewsItem[] {
  if (!xml) return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const items = doc.querySelectorAll("item");

    return Array.from(items).map((item, index) => {
      const title = item.querySelector("title")?.textContent || "";
      const link = item.querySelector("link")?.textContent || "";
      const pubDate = item.querySelector("pubDate")?.textContent || "";
      const source = item.querySelector("source")?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";

      // Parse date
      let publishedAt: string | undefined;
      if (pubDate) {
        const date = new Date(pubDate);
        if (!isNaN(date.getTime())) {
          publishedAt = date.toISOString();
        }
      }

      // Extract source from HTML in description if not available
      let parsedSource = source;
      if (!parsedSource && description) {
        const sourceMatch = description.match(/<font[^>]*>([^<]+)<\/font>/);
        if (sourceMatch) {
          parsedSource = sourceMatch[1];
        }
      }

      // Clean HTML from description to get summary
      let summary = description
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Limit summary length
      if (summary.length > 300) {
        summary = summary.slice(0, 297) + "...";
      }

      return {
        id: `news-${index}-${Date.now()}`,
        title: cleanHtml(title),
        link,
        publishedAt,
        source: parsedSource,
        summary: summary || undefined,
      };
    });
  } catch (err) {
    console.error("Failed to parse RSS XML:", err);
    return [];
  }
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
