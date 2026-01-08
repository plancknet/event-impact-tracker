alter table if exists public.search_terms
  add column if not exists main_area text,
  add column if not exists collection_date date default current_date;

create index if not exists search_terms_main_area_collection_date_idx
  on public.search_terms (main_area, collection_date);

alter table if exists public.alert_query_results
  add column if not exists query_type text default 'google_news_rss',
  add column if not exists rss_url text;

create index if not exists alert_query_results_term_id_queried_at_idx
  on public.alert_query_results (term_id, queried_at);

alter table if exists public.alert_news_results
  add column if not exists title_norm text;

create index if not exists alert_news_results_title_norm_idx
  on public.alert_news_results (title_norm);

create index if not exists alert_news_results_link_url_idx
  on public.alert_news_results (link_url);

create unique index if not exists full_news_content_news_id_uidx
  on public.full_news_content (news_id);
