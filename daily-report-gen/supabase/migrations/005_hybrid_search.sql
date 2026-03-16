-- Hybrid search function combining FTS + vector search
create or replace function hybrid_search(
  query_text       text,
  query_embedding  vector,
  p_user_id        uuid,
  date_from        timestamptz default null,
  date_to          timestamptz default null,
  match_count      int default 8,
  lexical_weight   float default 0.55,
  semantic_weight  float default 0.45
)
returns table (
  article_id      text,
  title           text,
  snippet         text,
  score           float,
  published_date  timestamptz
)
language plpgsql
as $$
begin
  return query
  with lexical as (
    select
      a.article_id,
      a.title,
      ts_headline(
        'english',
        a.content,
        websearch_to_tsquery('english', query_text),
        'MaxWords=80, MinWords=20, MaxFragments=2, FragmentDelimiter=" ... "'
      ) as snippet,
      ts_rank(a.tsv, websearch_to_tsquery('english', query_text)) as lex_score
    from news_articles a
    where
      a.user_id = p_user_id
      and a.tsv @@ websearch_to_tsquery('english', query_text)
      and (date_from is null or a.published_date >= date_from)
      and (date_to is null or a.published_date <= date_to)
    order by lex_score desc
    limit 250
  ),
  semantic as (
    select
      a.article_id,
      a.title,
      left(a.content, 400) as snippet,
      1 - (a.embedding <=> query_embedding) as sem_score
    from news_articles a
    where
      a.user_id = p_user_id
      and (date_from is null or a.published_date >= date_from)
      and (date_to is null or a.published_date <= date_to)
    order by a.embedding <=> query_embedding
    limit 80
  ),
  combined as (
    select
      coalesce(l.article_id, s.article_id) as article_id,
      coalesce(l.title, s.title) as title,
      coalesce(l.snippet, s.snippet) as snippet,
      (
        coalesce(l.lex_score, 0) * lexical_weight +
        coalesce(s.sem_score, 0) * semantic_weight
      ) as score,
      a.published_date
    from lexical l
    full outer join semantic s on l.article_id = s.article_id
    join news_articles a on a.article_id = coalesce(l.article_id, s.article_id)
    order by score desc
    limit match_count
  )
  select * from combined;
end;
$$;
