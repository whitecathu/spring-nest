-- Spring Nest shared Supabase backend.
-- Idempotent so it can be applied after the earlier bookkeeping-only baseline.

create extension if not exists pgcrypto;

-- Shared helpers -----------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Core identity ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text,
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
update public.profiles
set username = coalesce(nullif(username, ''), 'user-' || left(id::text, 8))
where username is null or username = '';
alter table public.profiles alter column username set not null;
alter table public.profiles alter column bio set default '';
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column updated_at set default now();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'moderator')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  primary key (user_id, role)
);

create index if not exists user_roles_role_idx on public.user_roles (role, user_id);

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = role_name
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  fallback_name text;
begin
  fallback_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'nickname', ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'user'
  );

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    fallback_name,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), fallback_name),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update
    set username = coalesce(nullif(public.profiles.username, ''), excluded.username),
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- User data ----------------------------------------------------------------

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  item_type text check (item_type in ('tool', 'game')),
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);

alter table public.favorites add column if not exists id uuid default gen_random_uuid();
alter table public.favorites add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.favorites add column if not exists item_id text;
alter table public.favorites add column if not exists item_type text check (item_type in ('tool', 'game'));
update public.favorites set id = gen_random_uuid() where id is null;
alter table public.favorites alter column id set default gen_random_uuid();
update public.favorites set item_type = coalesce(item_type, 'tool') where item_type is null;

create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_item_idx on public.favorites (item_type, item_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  language text not null default 'zh' check (language in ('zh', 'en')),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.user_settings add column if not exists theme text not null default 'system' check (theme in ('light', 'dark', 'system'));
alter table public.user_settings add column if not exists language text not null default 'zh' check (language in ('zh', 'en'));
alter table public.user_settings add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.user_settings add column if not exists updated_at timestamptz not null default now();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_slug text not null,
  score integer not null check (score >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_slug)
);

alter table public.game_scores add column if not exists id uuid default gen_random_uuid();
alter table public.game_scores add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.game_scores add column if not exists game_slug text;
alter table public.game_scores add column if not exists score integer not null default 0 check (score >= 0);
alter table public.game_scores add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.game_scores add column if not exists created_at timestamptz not null default now();
alter table public.game_scores add column if not exists updated_at timestamptz not null default now();
update public.game_scores set id = gen_random_uuid() where id is null;
alter table public.game_scores alter column id set default gen_random_uuid();

create index if not exists game_scores_user_id_idx on public.game_scores (user_id);
create index if not exists game_scores_leaderboard_idx on public.game_scores (game_slug, score desc, updated_at desc);

drop trigger if exists game_scores_set_updated_at on public.game_scores;
create trigger game_scores_set_updated_at
before update on public.game_scores
for each row execute function public.set_updated_at();

create table if not exists public.tool_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  item_id text not null,
  item_type text not null check (item_type in ('tool', 'game')),
  platform text not null default 'web' check (platform in ('web', 'app', 'pwa')),
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tool_usage_events_user_created_idx on public.tool_usage_events (user_id, created_at desc);
create index if not exists tool_usage_events_item_created_idx on public.tool_usage_events (item_type, item_id, created_at desc);

-- Operations ---------------------------------------------------------------

create table if not exists public.feedback_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 2 and 120),
  message text not null check (char_length(message) between 5 and 4000),
  category text not null default 'general' check (category in ('general', 'bug', 'feature', 'account', 'content')),
  status text not null default 'open' check (status in ('open', 'triage', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  admin_response text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_tickets_user_created_idx on public.feedback_tickets (user_id, created_at desc);
create index if not exists feedback_tickets_status_created_idx on public.feedback_tickets (status, created_at desc);

drop trigger if exists feedback_tickets_set_updated_at on public.feedback_tickets;
create trigger feedback_tickets_set_updated_at
before update on public.feedback_tickets
for each row execute function public.set_updated_at();

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  body text not null check (char_length(body) between 2 and 2000),
  severity text not null default 'info' check (severity in ('info', 'success', 'warning', 'critical')),
  platforms text[] not null default array['web', 'app'],
  enabled boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_public_idx on public.announcements (enabled, starts_at desc);

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

create table if not exists public.catalog_overrides (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('tool', 'game')),
  item_id text not null,
  enabled boolean not null default true,
  featured boolean,
  sort_order integer,
  platforms text[] not null default array['web', 'app'],
  announcement text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_type, item_id)
);

create index if not exists catalog_overrides_item_idx on public.catalog_overrides (item_type, item_id);
create index if not exists catalog_overrides_sort_idx on public.catalog_overrides (item_type, enabled, sort_order);

drop trigger if exists catalog_overrides_set_updated_at on public.catalog_overrides;
create trigger catalog_overrides_set_updated_at
before update on public.catalog_overrides
for each row execute function public.set_updated_at();

-- Bookkeeping --------------------------------------------------------------

create table if not exists public.bookkeeping_entries (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12,2) not null,
  category text not null,
  date date not null,
  account text not null,
  note text not null default '',
  tags text[] not null default '{}',
  ledger_id text,
  created_at bigint not null,
  updated_at timestamptz not null default now()
);

alter table public.bookkeeping_entries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.bookkeeping_entries add column if not exists ledger_id text;
alter table public.bookkeeping_entries add column if not exists updated_at timestamptz not null default now();

create index if not exists bookkeeping_entries_user_date_idx on public.bookkeeping_entries (user_id, date desc);
create index if not exists bookkeeping_entries_ledger_date_idx on public.bookkeeping_entries (ledger_id, date desc);

drop trigger if exists bookkeeping_entries_set_updated_at on public.bookkeeping_entries;
create trigger bookkeeping_entries_set_updated_at
before update on public.bookkeeping_entries
for each row execute function public.set_updated_at();

create table if not exists public.bookkeeping_ledgers (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookkeeping_ledgers add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.bookkeeping_ledgers add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.bookkeeping_ledgers add column if not exists updated_at timestamptz not null default now();
update public.bookkeeping_ledgers set user_id = coalesce(user_id, owner_id) where user_id is null;
update public.bookkeeping_ledgers set owner_id = coalesce(owner_id, user_id) where owner_id is null;

create index if not exists bookkeeping_ledgers_user_idx on public.bookkeeping_ledgers (user_id);
create index if not exists bookkeeping_ledgers_owner_idx on public.bookkeeping_ledgers (owner_id);

drop trigger if exists bookkeeping_ledgers_set_updated_at on public.bookkeeping_ledgers;
create trigger bookkeeping_ledgers_set_updated_at
before update on public.bookkeeping_ledgers
for each row execute function public.set_updated_at();

create table if not exists public.ledger_members (
  ledger_id text references public.bookkeeping_ledgers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (ledger_id, user_id)
);

create index if not exists ledger_members_user_idx on public.ledger_members (user_id);

create table if not exists public.bookkeeping_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_amount numeric(12,2) not null check (monthly_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

create index if not exists bookkeeping_budgets_user_idx on public.bookkeeping_budgets (user_id);

drop trigger if exists bookkeeping_budgets_set_updated_at on public.bookkeeping_budgets;
create trigger bookkeeping_budgets_set_updated_at
before update on public.bookkeeping_budgets
for each row execute function public.set_updated_at();

create table if not exists public.bookkeeping_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type, name)
);

create index if not exists bookkeeping_categories_user_type_idx on public.bookkeeping_categories (user_id, type, sort_order);

drop trigger if exists bookkeeping_categories_set_updated_at on public.bookkeeping_categories;
create trigger bookkeeping_categories_set_updated_at
before update on public.bookkeeping_categories
for each row execute function public.set_updated_at();

create table if not exists public.bookkeeping_recurring (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12,2) not null,
  category text not null,
  account text not null,
  note text not null default '',
  tags text[] not null default '{}',
  ledger_id text,
  day_of_month integer not null check (day_of_month between 1 and 31),
  active boolean not null default true,
  last_generated text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookkeeping_recurring_user_idx on public.bookkeeping_recurring (user_id, active);

drop trigger if exists bookkeeping_recurring_set_updated_at on public.bookkeeping_recurring;
create trigger bookkeeping_recurring_set_updated_at
before update on public.bookkeeping_recurring
for each row execute function public.set_updated_at();

-- RLS ----------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.favorites enable row level security;
alter table public.user_settings enable row level security;
alter table public.game_scores enable row level security;
alter table public.tool_usage_events enable row level security;
alter table public.feedback_tickets enable row level security;
alter table public.announcements enable row level security;
alter table public.catalog_overrides enable row level security;
alter table public.bookkeeping_entries enable row level security;
alter table public.bookkeeping_ledgers enable row level security;
alter table public.ledger_members enable row level security;
alter table public.bookkeeping_budgets enable row level security;
alter table public.bookkeeping_categories enable row level security;
alter table public.bookkeeping_recurring enable row level security;

drop policy if exists profiles_public_select on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_public_select on public.profiles for select to anon, authenticated using (true);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_admin_update on public.profiles for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists user_roles_select_own_or_admin on public.user_roles;
drop policy if exists user_roles_admin_all on public.user_roles;
create policy user_roles_select_own_or_admin on public.user_roles for select to authenticated using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy user_roles_admin_all on public.user_roles for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists favorites_select_own_or_admin on public.favorites;
drop policy if exists favorites_insert_own_or_admin on public.favorites;
drop policy if exists favorites_update_own_or_admin on public.favorites;
drop policy if exists favorites_delete_own_or_admin on public.favorites;
create policy favorites_select_own_or_admin on public.favorites for select to authenticated using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy favorites_insert_own_or_admin on public.favorites for insert to authenticated with check ((select auth.uid()) = user_id or (select public.is_admin()));
create policy favorites_update_own_or_admin on public.favorites for update to authenticated using ((select auth.uid()) = user_id or (select public.is_admin())) with check ((select auth.uid()) = user_id or (select public.is_admin()));
create policy favorites_delete_own_or_admin on public.favorites for delete to authenticated using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists user_settings_own_or_admin on public.user_settings;
create policy user_settings_own_or_admin on public.user_settings for all to authenticated using ((select auth.uid()) = user_id or (select public.is_admin())) with check ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists game_scores_public_select on public.game_scores;
drop policy if exists game_scores_insert_own on public.game_scores;
drop policy if exists game_scores_update_own on public.game_scores;
drop policy if exists game_scores_delete_own_or_admin on public.game_scores;
create policy game_scores_public_select on public.game_scores for select to anon, authenticated using (true);
create policy game_scores_insert_own on public.game_scores for insert to authenticated with check ((select auth.uid()) = user_id);
create policy game_scores_update_own on public.game_scores for update to authenticated using ((select auth.uid()) = user_id or (select public.is_admin())) with check ((select auth.uid()) = user_id or (select public.is_admin()));
create policy game_scores_delete_own_or_admin on public.game_scores for delete to authenticated using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists tool_usage_events_insert_public on public.tool_usage_events;
drop policy if exists tool_usage_events_select_own_or_admin on public.tool_usage_events;
create policy tool_usage_events_insert_public on public.tool_usage_events for insert to anon, authenticated with check (user_id is null or (select auth.uid()) = user_id);
create policy tool_usage_events_select_own_or_admin on public.tool_usage_events for select to authenticated using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists feedback_tickets_select_own_or_admin on public.feedback_tickets;
drop policy if exists feedback_tickets_insert_own on public.feedback_tickets;
drop policy if exists feedback_tickets_admin_update on public.feedback_tickets;
drop policy if exists feedback_tickets_admin_delete on public.feedback_tickets;
create policy feedback_tickets_select_own_or_admin on public.feedback_tickets for select to authenticated using ((select auth.uid()) = user_id or (select public.is_admin()));
create policy feedback_tickets_insert_own on public.feedback_tickets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy feedback_tickets_admin_update on public.feedback_tickets for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy feedback_tickets_admin_delete on public.feedback_tickets for delete to authenticated using ((select public.is_admin()));

drop policy if exists announcements_public_select on public.announcements;
drop policy if exists announcements_admin_all on public.announcements;
create policy announcements_public_select on public.announcements for select to anon, authenticated using (
  enabled
  and starts_at <= now()
  and (ends_at is null or ends_at >= now())
);
create policy announcements_admin_all on public.announcements for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists catalog_overrides_public_select on public.catalog_overrides;
drop policy if exists catalog_overrides_admin_all on public.catalog_overrides;
create policy catalog_overrides_public_select on public.catalog_overrides for select to anon, authenticated using (true);
create policy catalog_overrides_admin_all on public.catalog_overrides for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Users can manage own bookkeeping entries" on public.bookkeeping_entries;
drop policy if exists "Members can read shared ledger entries" on public.bookkeeping_entries;
drop policy if exists bookkeeping_entries_select_own_shared_or_admin on public.bookkeeping_entries;
drop policy if exists bookkeeping_entries_insert_own on public.bookkeeping_entries;
drop policy if exists bookkeeping_entries_update_own_or_admin on public.bookkeeping_entries;
drop policy if exists bookkeeping_entries_delete_own_or_admin on public.bookkeeping_entries;
create policy bookkeeping_entries_select_own_shared_or_admin on public.bookkeeping_entries for select to authenticated using (
  (select auth.uid()) = user_id
  or (select public.is_admin())
  or (
    ledger_id is not null
    and exists (
      select 1 from public.ledger_members lm
      where lm.ledger_id = bookkeeping_entries.ledger_id
        and lm.user_id = (select auth.uid())
    )
  )
);
create policy bookkeeping_entries_insert_own on public.bookkeeping_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy bookkeeping_entries_update_own_or_admin on public.bookkeeping_entries for update to authenticated using ((select auth.uid()) = user_id or (select public.is_admin())) with check ((select auth.uid()) = user_id or (select public.is_admin()));
create policy bookkeeping_entries_delete_own_or_admin on public.bookkeeping_entries for delete to authenticated using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "Users can manage own ledgers" on public.bookkeeping_ledgers;
drop policy if exists bookkeeping_ledgers_own_or_admin on public.bookkeeping_ledgers;
create policy bookkeeping_ledgers_own_or_admin on public.bookkeeping_ledgers for all to authenticated using ((select auth.uid()) = user_id or (select auth.uid()) = owner_id or (select public.is_admin())) with check ((select auth.uid()) = user_id or (select auth.uid()) = owner_id or (select public.is_admin()));

drop policy if exists "Users can read memberships" on public.ledger_members;
drop policy if exists "Ledger owners can manage members" on public.ledger_members;
drop policy if exists ledger_members_select_own_owner_or_admin on public.ledger_members;
drop policy if exists ledger_members_owner_or_admin_all on public.ledger_members;
create policy ledger_members_select_own_owner_or_admin on public.ledger_members for select to authenticated using (
  (select auth.uid()) = user_id
  or (select public.is_admin())
  or exists (
    select 1 from public.bookkeeping_ledgers bl
    where bl.id = ledger_members.ledger_id
      and (bl.owner_id = (select auth.uid()) or bl.user_id = (select auth.uid()))
  )
);
create policy ledger_members_owner_or_admin_all on public.ledger_members for all to authenticated using (
  (select public.is_admin())
  or exists (
    select 1 from public.bookkeeping_ledgers bl
    where bl.id = ledger_members.ledger_id
      and (bl.owner_id = (select auth.uid()) or bl.user_id = (select auth.uid()))
  )
) with check (
  (select public.is_admin())
  or exists (
    select 1 from public.bookkeeping_ledgers bl
    where bl.id = ledger_members.ledger_id
      and (bl.owner_id = (select auth.uid()) or bl.user_id = (select auth.uid()))
  )
);

drop policy if exists bookkeeping_budgets_own_or_admin on public.bookkeeping_budgets;
drop policy if exists bookkeeping_categories_own_or_admin on public.bookkeeping_categories;
drop policy if exists bookkeeping_recurring_own_or_admin on public.bookkeeping_recurring;
create policy bookkeeping_budgets_own_or_admin on public.bookkeeping_budgets for all to authenticated using ((select auth.uid()) = user_id or (select public.is_admin())) with check ((select auth.uid()) = user_id or (select public.is_admin()));
create policy bookkeeping_categories_own_or_admin on public.bookkeeping_categories for all to authenticated using ((select auth.uid()) = user_id or (select public.is_admin())) with check ((select auth.uid()) = user_id or (select public.is_admin()));
create policy bookkeeping_recurring_own_or_admin on public.bookkeeping_recurring for all to authenticated using ((select auth.uid()) = user_id or (select public.is_admin())) with check ((select auth.uid()) = user_id or (select public.is_admin()));

-- Admin RPC ----------------------------------------------------------------

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'totalUsers', (select count(*) from public.profiles),
    'totalFavorites', (select count(*) from public.favorites),
    'totalScores', (select count(*) from public.game_scores),
    'totalSettings', (select count(*) from public.user_settings),
    'openFeedback', (select count(*) from public.feedback_tickets where status in ('open', 'triage', 'in_progress')),
    'activeAnnouncements', (select count(*) from public.announcements where enabled and starts_at <= now() and (ends_at is null or ends_at >= now())),
    'catalogOverrides', (select count(*) from public.catalog_overrides),
    'usageEvents7d', (select count(*) from public.tool_usage_events where created_at >= now() - interval '7 days')
  ) into result;

  return result;
end;
$$;

create or replace function public.admin_list_users(search_text text default '', page_limit integer default 50)
returns table (
  id uuid,
  email text,
  username text,
  display_name text,
  created_at timestamptz,
  roles text[]
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.username,
    p.display_name,
    p.created_at,
    coalesce(array_agg(ur.role order by ur.role) filter (where ur.role is not null), '{}'::text[]) as roles
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join public.user_roles ur on ur.user_id = p.id
  where
    coalesce(search_text, '') = ''
    or p.username ilike '%' || search_text || '%'
    or p.display_name ilike '%' || search_text || '%'
    or u.email ilike '%' || search_text || '%'
  group by p.id, u.email, p.username, p.display_name, p.created_at
  order by p.created_at desc
  limit greatest(1, least(coalesce(page_limit, 50), 100));
end;
$$;

create or replace function public.admin_set_user_role(target_user_id uuid, role_name text, enabled boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if role_name not in ('admin', 'moderator') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  if enabled then
    insert into public.user_roles (user_id, role, created_by)
    values (target_user_id, role_name, (select auth.uid()))
    on conflict (user_id, role) do nothing;
  else
    delete from public.user_roles
    where user_id = target_user_id
      and role = role_name;
  end if;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
revoke all on function public.admin_list_users(text, integer) from public;
revoke all on function public.admin_set_user_role(uuid, text, boolean) from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_list_users(text, integer) to authenticated;
grant execute on function public.admin_set_user_role(uuid, text, boolean) to authenticated;
