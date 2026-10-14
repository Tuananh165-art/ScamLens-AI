create table if not exists public.analysis_reports (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  schema_version text not null default '1.0' check (schema_version = '1.0'),
  input_type text not null check (input_type in ('message', 'email', 'url', 'image')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'insufficient')),
  title text not null check (char_length(title) <= 160),
  report jsonb not null,
  created_at timestamptz not null default now(),
  constraint report_size_limit check (pg_column_size(report) <= 65536)
);

create index if not exists analysis_reports_user_created_idx
  on public.analysis_reports (user_id, created_at desc);

alter table public.analysis_reports enable row level security;

drop policy if exists "Owners read their own reports" on public.analysis_reports;
create policy "Owners read their own reports"
  on public.analysis_reports for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Owners create their own reports" on public.analysis_reports;
create policy "Owners create their own reports"
  on public.analysis_reports for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owners delete their own reports" on public.analysis_reports;
create policy "Owners delete their own reports"
  on public.analysis_reports for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.analysis_reports from anon;
grant select, insert, delete on public.analysis_reports to authenticated;
