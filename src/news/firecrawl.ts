export type FirecrawlResult = {
  fullText?: string;
  summary?: string;
};

export async function fetchFullArticleWithFirecrawl(_url: string): Promise<FirecrawlResult> {
  // TODO: Implement when Firecrawl is configured in Lovable.
  return {};
}
