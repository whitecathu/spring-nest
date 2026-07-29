-- Narrow public profile enumeration and stop anonymous usage-event spam.
-- Leaderboard usernames are exposed via a SECURITY DEFINER helper that returns
-- only id/username/display_name/avatar_url for requested ids.

create or replace function public.list_public_profile_cards(ids uuid[])
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_url
  from public.profiles p
  where p.id = any (ids);
$$;

revoke all on function public.list_public_profile_cards(uuid[]) from public;
grant execute on function public.list_public_profile_cards(uuid[]) to anon, authenticated;

drop policy if exists profiles_public_select on public.profiles;
drop policy if exists profiles_authenticated_select on public.profiles;
create policy profiles_authenticated_select
  on public.profiles
  for select
  to authenticated
  using (true);

-- Anonymous clients can no longer SELECT the full profiles table.

drop policy if exists tool_usage_events_insert_public on public.tool_usage_events;
drop policy if exists tool_usage_events_insert_authenticated on public.tool_usage_events;
create policy tool_usage_events_insert_authenticated
  on public.tool_usage_events
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
