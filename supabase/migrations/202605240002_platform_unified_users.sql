-- Platform unified user management -----------------------------------------
-- Keep Auth users, profiles, and the independent admin console aligned.

insert into public.profiles (id, username, display_name, avatar_url, bio, created_at, updated_at)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'username', ''), nullif(u.raw_user_meta_data ->> 'nickname', ''), split_part(u.email, '@', 1), u.id::text),
  coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), nullif(u.raw_user_meta_data ->> 'nickname', ''), nullif(u.raw_user_meta_data ->> 'username', ''), split_part(u.email, '@', 1), u.id::text),
  nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
  '',
  u.created_at,
  now()
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
);

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
    'totalUsers', (select count(*) from auth.users),
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
    u.id,
    u.email::text,
    coalesce(
      nullif(p.username, ''),
      nullif(u.raw_user_meta_data ->> 'username', ''),
      nullif(u.raw_user_meta_data ->> 'nickname', ''),
      split_part(u.email, '@', 1),
      u.id::text
    ) as username,
    coalesce(
      nullif(p.display_name, ''),
      nullif(u.raw_user_meta_data ->> 'display_name', ''),
      nullif(u.raw_user_meta_data ->> 'nickname', ''),
      nullif(p.username, ''),
      split_part(u.email, '@', 1),
      u.id::text
    ) as display_name,
    coalesce(p.created_at, u.created_at) as created_at,
    coalesce(array_agg(ur.role order by ur.role) filter (where ur.role is not null), '{}'::text[]) as roles
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.user_roles ur on ur.user_id = u.id
  where
    coalesce(search_text, '') = ''
    or u.email ilike '%' || search_text || '%'
    or p.username ilike '%' || search_text || '%'
    or p.display_name ilike '%' || search_text || '%'
    or (u.raw_user_meta_data ->> 'username') ilike '%' || search_text || '%'
    or (u.raw_user_meta_data ->> 'nickname') ilike '%' || search_text || '%'
  group by u.id, u.email, u.raw_user_meta_data, u.created_at, p.username, p.display_name, p.created_at
  order by coalesce(p.created_at, u.created_at) desc
  limit greatest(1, least(coalesce(page_limit, 50), 100));
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
revoke all on function public.admin_list_users(text, integer) from public;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_list_users(text, integer) to authenticated;
