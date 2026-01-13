-- Supabase schema for Pups & Rec
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  breed text,
  age_years int,
  avatar_url text,
  notes text,
  health_records jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete cascade,
  type text not null,
  title text not null,
  date_time timestamptz not null,
  recurrence jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete cascade,
  type text not null,
  date timestamptz not null,
  duration_minutes int,
  distance_km numeric,
  notes text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete cascade,
  date timestamptz not null,
  title text not null,
  content text not null,
  tags text[] default '{}',
  category text not null,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pets enable row level security;
alter table public.reminders enable row level security;
alter table public.activities enable row level security;
alter table public.journal_entries enable row level security;

create policy "Users can manage own pets" on public.pets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own reminders" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own activities" on public.activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own journal entries" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Supabase SQL for Pups & Rec
-- Tables: pets, reminders, activities, journal_entries

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  breed text,
  avatar_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pet_id uuid references public.pets on delete cascade,
  type text not null,
  title text not null,
  datetime timestamptz not null,
  recurrence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pet_id uuid references public.pets on delete cascade,
  type text not null,
  date timestamptz not null,
  duration_minutes int,
  distance_km numeric,
  notes text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pet_id uuid references public.pets on delete cascade,
  date timestamptz not null,
  title text not null,
  content text not null,
  tags text[] default '{}'::text[],
  category text not null,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_pets on public.pets;
create trigger set_updated_at_pets before update on public.pets for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_reminders on public.reminders;
create trigger set_updated_at_reminders before update on public.reminders for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_activities on public.activities;
create trigger set_updated_at_activities before update on public.activities for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_journal on public.journal_entries;
create trigger set_updated_at_journal before update on public.journal_entries for each row execute function public.set_updated_at();

-- RLS
alter table public.pets enable row level security;
alter table public.reminders enable row level security;
alter table public.activities enable row level security;
alter table public.journal_entries enable row level security;

-- Policies: owner-only
create policy if not exists "pets_select" on public.pets for select using (auth.uid() = user_id);
create policy if not exists "pets_write" on public.pets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "reminders_select" on public.reminders for select using (auth.uid() = user_id);
create policy if not exists "reminders_write" on public.reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "activities_select" on public.activities for select using (auth.uid() = user_id);
create policy if not exists "activities_write" on public.activities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "journal_select" on public.journal_entries for select using (auth.uid() = user_id);
create policy if not exists "journal_write" on public.journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
