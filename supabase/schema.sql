create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  client_result_id text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  created_at_client timestamptz,
  zodiac text not null,
  birth_month integer not null,
  mood text not null,
  budget_option text not null,
  custom_budget text,
  goal text not null,
  door_position text not null,
  window_position text not null,
  available_seats text[] not null default '{}',
  light text not null,
  noise text not null,
  today_state text not null,
  recommended_seat text not null,
  discouraged_seat text not null,
  reason text not null,
  traditional_note text not null,
  scene_reading text not null,
  today_avoid text not null,
  folk_reminder text not null,
  opening_advice text not null,
  stop_loss_reminder text not null,
  lucky_color text not null,
  opening_reminder text not null,
  total_score integer not null,
  score_items jsonb not null default '[]'::jsonb,
  input_snapshot jsonb not null default '{}'::jsonb
);

create table if not exists public.poster_jobs (
  id uuid primary key default gen_random_uuid(),
  task_id text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  status text not null,
  progress text,
  profile jsonb,
  environment jsonb,
  markup jsonb,
  result_image_urls text[] not null default '{}',
  error_message text
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  created_at_client timestamptz,
  event_name text not null,
  path text not null,
  visitor_id text not null,
  session_id text not null,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.submissions enable row level security;
alter table public.poster_jobs enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "anon can insert submissions" on public.submissions;
create policy "anon can insert submissions"
on public.submissions
for insert
to anon, authenticated
with check (true);

drop policy if exists "anon can update submissions" on public.submissions;
create policy "anon can update submissions"
on public.submissions
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "anon can insert poster jobs" on public.poster_jobs;
create policy "anon can insert poster jobs"
on public.poster_jobs
for insert
to anon, authenticated
with check (true);

drop policy if exists "anon can update poster jobs" on public.poster_jobs;
create policy "anon can update poster jobs"
on public.poster_jobs
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "anon can select submissions" on public.submissions;
create policy "anon can select submissions"
on public.submissions
for select
to anon, authenticated
using (true);

drop policy if exists "anon can select poster jobs" on public.poster_jobs;
create policy "anon can select poster jobs"
on public.poster_jobs
for select
to anon, authenticated
using (true);

drop policy if exists "anon can insert analytics events" on public.analytics_events;
create policy "anon can insert analytics events"
on public.analytics_events
for insert
to anon, authenticated
with check (true);

drop policy if exists "anon can select analytics events" on public.analytics_events;
create policy "anon can select analytics events"
on public.analytics_events
for select
to anon, authenticated
using (true);
