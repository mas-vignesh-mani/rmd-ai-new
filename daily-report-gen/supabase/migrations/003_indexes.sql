-- Full-text search index
create index if not exists news_articles_tsv_idx
  on news_articles using gin(tsv);

-- Vector similarity index (HNSW for fast ANN search)
create index if not exists news_articles_embedding_idx
  on news_articles using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- User/date filtering indexes
create index if not exists news_articles_user_id_idx on news_articles(user_id);
create index if not exists news_articles_published_date_idx on news_articles(published_date);
create index if not exists reports_user_id_idx on reports(user_id);
create index if not exists user_preferences_user_id_idx on user_preferences(user_id);
create index if not exists user_uploaded_reports_user_id_idx on user_uploaded_reports(user_id);

-- Cache TTL index
create index if not exists data_provider_cache_expires_idx on data_provider_cache(expires_at);
