import { supabase } from "@/integrations/supabase/client";
import type { NewsSearchTerm } from "./types";

type AiTermsResponse = {
  terms?: string[];
  output?: string;
  result?: string;
};

const FALLBACK_SUFFIXES = ["news", "latest", "update", "trends", "insights"];

export async function ensureDailySearchTerms(
  mainAreaChips: string[],
  today?: Date | string,
): Promise<NewsSearchTerm[]> {
  const sanitizedChips = sanitizeValues(mainAreaChips);
  if (sanitizedChips.length === 0) {
    return [];
  }

  // Assumption: the first chip is the primary main_area for term generation.
  const primary = sanitizedChips[0];
  const collectionDate = normalizeDateInput(today ?? new Date());

  const { data: existing, error } = await supabase
    .from("search_terms")
    .select("term, main_area, collection_date")
    .eq("main_area", primary)
    .eq("collection_date", collectionDate);

  if (error) {
    throw error;
  }

  if (existing && existing.length > 0) {
    const terms = sanitizeTerms(existing.map((row) => row.term));
    return terms.map((term) => ({
      term,
      mainArea: primary,
      collectionDate,
    }));
  }

  const aiTerms = await generateTermsWithAi(primary);
  const normalized = normalizeToFiveTerms(primary, aiTerms);

  const { data: inserted, error: insertError } = await supabase
    .from("search_terms")
    .insert(
      normalized.map((term) => ({
        term,
        main_area: primary,
        collection_date: collectionDate,
      })),
    )
    .select("term, main_area, collection_date");

  if (insertError) {
    throw insertError;
  }

  const insertedTerms = inserted?.map((row) => row.term) ?? normalized;
  return insertedTerms.map((term) => ({
    term,
    mainArea: primary,
    collectionDate,
  }));
}

async function generateTermsWithAi(mainArea: string): Promise<string[]> {
  const prompt = [
    "Task:",
    "Generate search queries to find recent news relevant to the creator's topic.",
    "",
    "Inputs:",
    `- Creator topic focus: ${mainArea}`,
    "- Audience and region: general audience, global",
    "- Desired freshness window: 30 days",
    "- Platform and content goal: spoken content",
    "",
    "Rules:",
    "- Prefer 5-10 short queries.",
    "- Use quotes for exact phrases when helpful.",
    "- Include at least one query with a region or country.",
    "- Avoid jargon unless the audience expects it.",
    "",
    "Output:",
    "- Bullet list of search queries only.",
  ].join("\n");

  const { data, error } = await supabase.functions.invoke("generate-news-search-terms", {
    body: {
      prompt,
      mainArea,
      count: 5,
    },
  });

  if (error) {
    throw error;
  }

  return extractTermsFromAi(data as AiTermsResponse | null);
}

function extractTermsFromAi(response: AiTermsResponse | null): string[] {
  if (!response) return [];
  if (Array.isArray(response.terms)) return response.terms;
  const raw = response.output || response.result;
  if (!raw) return [];
  const cleaned = stripCodeFences(raw);
  const jsonTerms = tryParseJsonArray(cleaned);
  if (jsonTerms.length > 0) return jsonTerms;

  return cleaned
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function normalizeToFiveTerms(mainArea: string, terms: string[]): string[] {
  const sanitized = sanitizeTerms(terms);
  const unique = uniqueTerms(sanitized);

  const fallback = FALLBACK_SUFFIXES.map((suffix) => `${mainArea} ${suffix}`);
  const combined = unique.concat(fallback);
  const finalTerms = uniqueTerms(combined).slice(0, 5);

  if (finalTerms.length < 5) {
    while (finalTerms.length < 5) {
      finalTerms.push(`${mainArea} news ${finalTerms.length + 1}`);
    }
  }

  return finalTerms;
}

function sanitizeValues(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

function sanitizeTerms(terms: string[]): string[] {
  return terms
    .map((term) => term.replace(/^["']|["']$/g, "").replace(/^[\[\],]+|[\[\],]+$/g, "").trim())
    .filter(Boolean);
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  terms.forEach((term) => {
    const key = term.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(term);
  });
  return unique;
}

function normalizeDateInput(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

function stripCodeFences(value: string): string {
  return value.replace(/```[\s\S]*?```/g, (match) => {
    const withoutFence = match.replace(/^```[\w-]*\s*/i, "").replace(/```\s*$/i, "");
    return withoutFence.trim();
  });
}

function tryParseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string") as string[];
    }
  } catch {
    // ignore JSON parsing errors
  }
  return [];
}
