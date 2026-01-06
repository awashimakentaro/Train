-- supabase/schema.sql
--
-- 【責務】
-- Supabase プロジェクトに必要なテーブル定義 / RLS ポリシー / インデックスをまとめ、
-- ローカル + CI で一貫したスキーマを再現できるようにする。
--
-- 【使用方法】
-- supabase cli もしくはダッシュボードの SQL Editor で本ファイルを実行する。

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preset_id uuid not null references public.menu_presets(id) on delete cascade,
  name text not null,
  sets integer not null default 3,
  reps integer not null default 10,
  weight numeric not null default 0,
  rest_seconds integer not null default 60,
  training_seconds integer not null default 60,
  note text,
  youtube_url text,
  focus_area text not null check (focus_area in ('push','pull','legs','core')),
  enabled boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.body_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  weight numeric,
  height_cm numeric,
  gender text check (gender in ('male','female','other')),
  body_fat numeric,
  muscle_mass numeric,
  bmi numeric,
  water_content numeric,
  visceral_fat numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists public.calorie_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  type text not null check (type in ('intake','burn')),
  amount integer not null,
  label text not null,
  category text,
  linked_session_id uuid,
  duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  menu_name text not null,
  calories integer not null,
  duration_seconds integer not null,
  finished_at timestamptz not null,
  exercise_count integer not null,
  created_at timestamptz not null default now()
);

create function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_menu_presets_updated
  before update on public.menu_presets
  for each row execute procedure public.touch_updated_at();

create trigger trg_exercises_updated
  before update on public.exercises
  for each row execute procedure public.touch_updated_at();

create trigger trg_body_entries_updated
  before update on public.body_entries
  for each row execute procedure public.touch_updated_at();

create trigger trg_calorie_entries_updated
  before update on public.calorie_entries
  for each row execute procedure public.touch_updated_at();

-- インデックス
create index if not exists idx_body_entries_user_date on public.body_entries (user_id, entry_date desc);
create index if not exists idx_calorie_entries_user_date on public.calorie_entries (user_id, entry_date desc);
create index if not exists idx_exercises_preset_order on public.exercises (preset_id, order_index);
create index if not exists idx_training_sessions_user_date on public.training_sessions (user_id, finished_at desc);

-- RLS
alter table public.menu_presets enable row level security;
alter table public.exercises enable row level security;
alter table public.body_entries enable row level security;
alter table public.calorie_entries enable row level security;
alter table public.training_sessions enable row level security;

create policy "menu_presets_owner_rw" on public.menu_presets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercises_owner_rw" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "body_entries_owner_rw" on public.body_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "calorie_entries_owner_rw" on public.calorie_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "training_sessions_owner_rw" on public.training_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
