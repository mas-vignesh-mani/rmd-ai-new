-- Enable RLS on all user-scoped tables
alter table news_articles enable row level security;
alter table reports enable row level security;
alter table report_sources enable row level security;
alter table user_uploaded_reports enable row level security;
alter table user_preferences enable row level security;

-- news_articles: users see only their own
create policy "news_articles_user_isolation" on news_articles
  for all using (auth.uid() = user_id);

-- reports: users see only their own
create policy "reports_user_isolation" on reports
  for all using (auth.uid() = user_id);

-- report_sources: accessible if the parent report belongs to the user
create policy "report_sources_user_isolation" on report_sources
  for all using (
    exists (
      select 1 from reports r
      where r.report_id = report_sources.report_id
        and r.user_id = auth.uid()
    )
  );

-- user_uploaded_reports: users see only their own
create policy "user_uploaded_reports_user_isolation" on user_uploaded_reports
  for all using (auth.uid() = user_id);

-- user_preferences: users see only their own
create policy "user_preferences_user_isolation" on user_preferences
  for all using (auth.uid() = user_id);

-- report_templates: public read, no insert/update for users
alter table report_templates enable row level security;
create policy "report_templates_public_read" on report_templates
  for select using (is_active = true);

-- time_series_data and cache: service role only (no RLS needed, no user data)
