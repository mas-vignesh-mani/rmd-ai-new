-- News articles (core document store)
create table if not exists news_articles (
  article_id     text primary key default gen_random_uuid()::text,
  user_id        uuid references auth.users(id) on delete cascade not null,
  title          text,
  content        text,
  source_url     text,
  published_date timestamptz,
  -- Using text-embedding-3-small (1536 dims)
  embedding      vector(1536),
  tsv            tsvector generated always as (
                   to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
                 ) stored,
  metadata       jsonb default '{}'::jsonb,
  created_at     timestamptz default now()
);

-- Reports
create table if not exists reports (
  report_id      text primary key default gen_random_uuid()::text,
  user_id        uuid references auth.users(id) on delete cascade not null,
  report_type    text default 'daily',
  title          text,
  summary        text,
  content        jsonb default '{}'::jsonb,
  template_id    text,
  status         text default 'pending' check (status in ('pending','processing','completed','failed')),
  metadata       jsonb default '{}'::jsonb,
  created_at     timestamptz default now(),
  completed_at   timestamptz
);

-- Report sources (join table)
create table if not exists report_sources (
  source_id         text primary key default gen_random_uuid()::text,
  report_id         text references reports(report_id) on delete cascade not null,
  source_type       text check (source_type in ('news_article','time_series','user_upload','excel_upload')),
  source_reference  text,
  content_summary   text,
  created_at        timestamptz default now()
);

-- User uploaded reports (for preference learning)
create table if not exists user_uploaded_reports (
  upload_id          text primary key default gen_random_uuid()::text,
  user_id            uuid references auth.users(id) on delete cascade not null,
  title              text,
  content            text,
  uploaded_at        timestamptz default now(),
  compared_report_id text references reports(report_id) on delete set null
);

-- User preferences (accumulated from edits)
create table if not exists user_preferences (
  pref_id          text primary key default gen_random_uuid()::text,
  user_id          uuid references auth.users(id) on delete cascade not null,
  preference       text not null,
  source_report_id text references user_uploaded_reports(upload_id) on delete set null,
  created_at       timestamptz default now()
);

-- Report templates
create table if not exists report_templates (
  template_id      text primary key,
  name             text not null,
  description      text,
  prompt_template  text,
  sections         jsonb default '[]'::jsonb,
  is_active        boolean default true,
  created_at       timestamptz default now()
);

-- Time series data
create table if not exists time_series_data (
  series_id   text not null,
  provider    text not null,
  data_type   text,
  timestamp   timestamptz not null,
  value       numeric,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now(),
  primary key (series_id, provider, timestamp)
);

-- Data provider cache (Macrobond)
create table if not exists data_provider_cache (
  cache_key      text primary key,
  provider       text,
  request_params jsonb,
  response_data  jsonb,
  expires_at     timestamptz,
  created_at     timestamptz default now()
);

-- Seed default template
insert into report_templates (template_id, name, description, prompt_template, sections, is_active)
values (
  'default_daily_report',
  'Default Daily Report',
  'Standard daily financial market report',
  'You are a financial analyst. Generate a comprehensive daily report covering the following sections. Use the provided news articles and market data. Be analytical, precise, and cite sources where relevant.',
  '[
    {"name": "Executive Summary", "required": ["news_articles"]},
    {"name": "Market Overview", "required": ["time_series", "excel_upload"]},
    {"name": "Key News & Events", "required": ["news_articles"]},
    {"name": "Economic Indicators", "required": ["time_series", "excel_upload"]},
    {"name": "Outlook", "required": []}
  ]'::jsonb,
  true
) on conflict (template_id) do nothing;
