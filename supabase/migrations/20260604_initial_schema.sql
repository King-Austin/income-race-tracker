-- ============================================================
-- Income Chase Buddy — Initial Schema
-- ============================================================

-- ── profiles ──────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  username      text unique not null,
  avatar_url    text,
  monthly_goal  numeric not null default 0,
  created_at    timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles: own write"
  on profiles
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: anyone read"
  on profiles for select
  using (true);

-- ── races ─────────────────────────────────────────────────
create table if not exists races (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text,
  invite_code    text unique not null,
  owner_id       uuid not null references profiles(id) on delete cascade,
  target_amount  numeric not null default 0,
  month_year     text not null,          -- "2026-06"
  is_active      boolean default true,
  created_at     timestamptz default now()
);

alter table races enable row level security;

-- members and owner can read
create policy "races: member read"
  on races for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from race_members
      where race_members.race_id = races.id
        and race_members.user_id = auth.uid()
    )
  );

-- owner can insert / update / delete
create policy "races: owner write"
  on races
  using (owner_id = auth.uid());

-- allow anyone to read races by invite_code (for the join page)
create policy "races: public invite lookup"
  on races for select
  using (is_active = true);

-- ── race_members ───────────────────────────────────────────
create table if not exists race_members (
  id         uuid primary key default gen_random_uuid(),
  race_id    uuid not null references races(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  joined_at  timestamptz default now(),
  unique (race_id, user_id)
);

alter table race_members enable row level security;

-- members of the same race can see each other
create policy "race_members: peer read"
  on race_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from race_members rm
      where rm.race_id = race_members.race_id
        and rm.user_id = auth.uid()
    )
  );

-- users can join (insert themselves)
create policy "race_members: self join"
  on race_members for insert
  with check (user_id = auth.uid());

-- users can leave (delete themselves)
create policy "race_members: self leave"
  on race_members for delete
  using (user_id = auth.uid());

-- race owner can remove any member
create policy "race_members: owner remove"
  on race_members for delete
  using (
    exists (
      select 1 from races
      where races.id = race_members.race_id
        and races.owner_id = auth.uid()
    )
  );

-- ── income_records ─────────────────────────────────────────
create table if not exists income_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  amount       numeric not null check (amount > 0),
  description  text,
  recorded_at  timestamptz default now()
);

alter table income_records enable row level security;

-- users own their records
create policy "income_records: own write"
  on income_records
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- race members can read each other's records
create policy "income_records: race peer read"
  on income_records for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from race_members rm
      join race_members rm2 on rm.race_id = rm2.race_id
      where rm.user_id  = income_records.user_id
        and rm2.user_id = auth.uid()
    )
  );

-- ── Storage: avatars bucket ────────────────────────────────
-- Run this in Supabase Dashboard → Storage → New bucket
-- Name: avatars, Public: true
-- Then add this policy via Dashboard → Storage → avatars → Policies:
--
-- INSERT policy (authenticated):
--   bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Or run the SQL below if storage schema is accessible:

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ── Realtime ───────────────────────────────────────────────
-- Enable realtime on income_records in Supabase Dashboard:
-- Database → Replication → Tables → toggle income_records
-- Or via SQL:
alter publication supabase_realtime add table income_records;
