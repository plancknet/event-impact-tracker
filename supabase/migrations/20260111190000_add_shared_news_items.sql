create table if not exists public.shared_news_items (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  topic_norm text not null,
  term text,
  rss_id text,
  title text not null,
  title_norm text not null,
  link_url text not null,
  source text,
  summary text,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  language text,
  region text,
  rss_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists shared_news_items_topic_link_uidx
  on public.shared_news_items (topic_norm, link_url);

create index if not exists shared_news_items_topic_norm_idx
  on public.shared_news_items (topic_norm);

create index if not exists shared_news_items_published_idx
  on public.shared_news_items (published_at desc);

create index if not exists shared_news_items_fetched_idx
  on public.shared_news_items (fetched_at desc);

alter table public.shared_news_items enable row level security;

create policy "Allow public read on shared_news_items"
  on public.shared_news_items
  for select
  using (true);

create policy "Allow public insert on shared_news_items"
  on public.shared_news_items
  for insert
  with check (true);

create policy "Allow public update on shared_news_items"
  on public.shared_news_items
  for update
  using (true);
