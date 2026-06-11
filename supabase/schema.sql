create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  phone_verified_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  last_profile_draft jsonb,
  last_environment_draft jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_sessions_user_id on user_sessions(user_id);
create index if not exists idx_user_sessions_expires_at on user_sessions(expires_at);

create table if not exists login_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  purpose text not null default 'login',
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_login_codes_phone_purpose on login_codes(phone, purpose, created_at desc);

create table if not exists user_credits (
  user_id uuid primary key references users(id) on delete cascade,
  balance integer not null default 0,
  total_granted integer not null default 0,
  total_used integer not null default 0,
  total_refunded integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seat_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_result_id text,
  zodiac text not null,
  birth_month integer not null,
  mood text not null,
  budget_option text not null,
  custom_budget text,
  goal text not null,
  door_position text not null,
  window_position text not null,
  available_seats jsonb not null default '[]'::jsonb,
  light text not null,
  noise text not null,
  today_state text not null,
  recommended_seat text not null,
  discouraged_seat text not null,
  reason text not null,
  traditional_note text,
  scene_reading text,
  today_avoid text,
  folk_reminder text,
  opening_advice text,
  stop_loss_reminder text,
  lucky_color text,
  opening_reminder text,
  total_score integer not null default 0,
  score_items jsonb not null default '[]'::jsonb,
  result_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_seat_records_user_id_created_at on seat_records(user_id, created_at desc);

create table if not exists image_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  seat_record_id uuid references seat_records(id) on delete set null,
  task_type text not null check (task_type in ('analysis', 'poster', 'prompt_image')),
  status text not null check (status in ('pending', 'processing', 'success', 'failed')),
  credits_cost integer not null default 0,
  external_task_id text,
  source_file_name text,
  source_image_url text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  result_image_urls jsonb not null default '[]'::jsonb,
  error_message text,
  credits_refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_image_tasks_external_task_id on image_tasks(external_task_id) where external_task_id is not null;
create index if not exists idx_image_tasks_user_id_created_at on image_tasks(user_id, created_at desc);

create table if not exists payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  order_no text not null unique,
  package_name text not null,
  credits_amount integer not null default 0,
  amount_cents integer not null default 0,
  currency text not null default 'CNY',
  provider text,
  provider_order_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_orders_user_id_created_at on payment_orders(user_id, created_at desc);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  category text not null,
  related_task_id uuid references image_tasks(id) on delete set null,
  related_order_id uuid references payment_orders(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_transactions_user_id_created_at on credit_transactions(user_id, created_at desc);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_at_client timestamptz,
  event_name text not null,
  path text not null,
  visitor_id text not null,
  session_id text not null,
  user_id uuid references users(id) on delete set null,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

alter table analytics_events add column if not exists created_at_client timestamptz;
alter table analytics_events add column if not exists user_id uuid references users(id) on delete set null;
alter table analytics_events add column if not exists referrer text;
alter table analytics_events add column if not exists user_agent text;
alter table analytics_events add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_analytics_events_created_at on analytics_events(created_at desc);
create index if not exists idx_analytics_events_event_name on analytics_events(event_name);
create index if not exists idx_analytics_events_user_id on analytics_events(user_id);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  client_result_id text unique,
  created_at timestamptz not null default now(),
  created_at_client timestamptz,
  zodiac text,
  birth_month integer,
  mood text,
  budget_option text,
  custom_budget text,
  goal text,
  door_position text,
  window_position text,
  available_seats jsonb not null default '[]'::jsonb,
  light text,
  noise text,
  today_state text,
  recommended_seat text,
  discouraged_seat text,
  reason text,
  traditional_note text,
  scene_reading text,
  today_avoid text,
  folk_reminder text,
  opening_advice text,
  stop_loss_reminder text,
  lucky_color text,
  opening_reminder text,
  total_score integer default 0,
  score_items jsonb not null default '[]'::jsonb,
  input_snapshot jsonb
);

create table if not exists poster_jobs (
  id uuid primary key default gen_random_uuid(),
  task_id text not null unique,
  status text not null,
  progress text,
  profile jsonb,
  environment jsonb,
  markup jsonb,
  result_image_urls jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
