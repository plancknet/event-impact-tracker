export type NewsSearchTerm = {
  term: string;
  mainArea?: string;
  collectionDate?: string;
  region?: string;
  language?: string;
};

export type RssItem = {
  id: string;
  title: string;
  link: string;
  publishedAt?: string;
  source?: string;
  snippet?: string;
};

export type FullArticle = {
  id: string;
  title: string;
  link: string;
  publishedAt?: string;
  source?: string;
  summary?: string;
  fullText?: string;
};

export type Selection = {
  items: FullArticle[];
  terms: NewsSearchTerm[];
};
