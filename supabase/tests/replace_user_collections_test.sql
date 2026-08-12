begin;

create extension if not exists pgtap with schema extensions;

select plan(33);

select has_function(
  'public',
  'list_public_profile_cards',
  array['uuid[]'],
  'narrow public profile-card RPC exists'
);
select ok(
  has_function_privilege(
    'anon',
    'public.list_public_profile_cards(uuid[])',
    'execute'
  ),
  'anon can execute only the narrow public profile-card RPC'
);
select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any (
        array[
          'profiles',
          'favorites',
          'user_settings',
          'tool_usage_events',
          'bookkeeping_entries',
          'bookkeeping_ledgers',
          'bookkeeping_budgets',
          'bookkeeping_categories',
          'bookkeeping_recurring'
        ]
      )
      and c.relrowsecurity
  ),
  9,
  'critical user-data tables have row-level security enabled'
);

select has_function(
  'public',
  'replace_user_favorites',
  array['jsonb'],
  'favorites replacement RPC exists'
);
select has_function(
  'public',
  'replace_user_bookkeeping_entries',
  array['jsonb'],
  'entries replacement RPC exists'
);
select has_function(
  'public',
  'replace_user_bookkeeping_budgets',
  array['jsonb'],
  'budgets replacement RPC exists'
);
select has_function(
  'public',
  'replace_user_bookkeeping_categories',
  array['jsonb'],
  'categories replacement RPC exists'
);
select has_function(
  'public',
  'replace_user_bookkeeping_recurring',
  array['jsonb'],
  'recurring replacement RPC exists'
);
select has_function(
  'public',
  'replace_user_bookkeeping_ledgers',
  array['jsonb'],
  'ledgers replacement RPC exists'
);

select ok(
  not has_function_privilege('anon', 'public.replace_user_favorites(jsonb)', 'execute'),
  'anon cannot execute favorites replacement'
);
select ok(
  not has_function_privilege('anon', 'public.replace_user_bookkeeping_entries(jsonb)', 'execute'),
  'anon cannot execute entries replacement'
);
select ok(
  not has_function_privilege('anon', 'public.replace_user_bookkeeping_budgets(jsonb)', 'execute'),
  'anon cannot execute budgets replacement'
);
select ok(
  not has_function_privilege('anon', 'public.replace_user_bookkeeping_categories(jsonb)', 'execute'),
  'anon cannot execute categories replacement'
);
select ok(
  not has_function_privilege('anon', 'public.replace_user_bookkeeping_recurring(jsonb)', 'execute'),
  'anon cannot execute recurring replacement'
);
select ok(
  not has_function_privilege('anon', 'public.replace_user_bookkeeping_ledgers(jsonb)', 'execute'),
  'anon cannot execute ledgers replacement'
);

insert into auth.users (id, aud, role, email, encrypted_password)
values
  (
    '00000000-0000-0000-0000-0000000000a1',
    'authenticated',
    'authenticated',
    'sync-a@example.com',
    ''
  ),
  (
    '00000000-0000-0000-0000-0000000000b2',
    'authenticated',
    'authenticated',
    'sync-b@example.com',
    ''
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  has_function_privilege(
    'authenticated',
    'public.replace_user_favorites(jsonb)',
    'execute'
  ),
  'authenticated can execute replacement RPCs'
);

select is(
  (
    public.replace_user_favorites(
      '[{"item_id":"unit-converter","item_type":"tool"}]'::jsonb
    )->>'count'
  )::integer,
  1,
  'favorites replacement returns its count'
);

select is(
  (
    select count(*)::integer
    from public.favorites
    where user_id = '00000000-0000-0000-0000-0000000000a1'
  ),
  1,
  'replacement derives the owner from auth.uid'
);

select throws_ok(
  $$
    select public.replace_user_favorites(
      '[{"item_id":"duplicate","item_type":"tool"},{"item_id":"duplicate","item_type":"tool"}]'::jsonb
    )
  $$,
  'duplicate favorites reject the whole replacement'
);

select is(
  (
    select item_id
    from public.favorites
    where user_id = '00000000-0000-0000-0000-0000000000a1'
  ),
  'unit-converter',
  'failed insertion rolls the earlier delete back'
);

reset role;

insert into public.bookkeeping_ledgers (id, user_id, owner_id, name, emoji)
values
  (
    'shared-ledger',
    '00000000-0000-0000-0000-0000000000a1',
    '00000000-0000-0000-0000-0000000000a1',
    'Shared',
    ''
  ),
  (
    'personal-ledger',
    '00000000-0000-0000-0000-0000000000a1',
    '00000000-0000-0000-0000-0000000000a1',
    'Personal',
    ''
  );
insert into public.ledger_members (ledger_id, user_id, role)
values (
  'shared-ledger',
  '00000000-0000-0000-0000-0000000000b2',
  'member'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

select lives_ok(
  $$ select public.replace_user_bookkeeping_ledgers('[]'::jsonb) $$,
  'personal ledger replacement completes'
);
select is(
  (select count(*)::integer from public.bookkeeping_ledgers where id = 'shared-ledger'),
  1,
  'shared ledger is preserved'
);
select is(
  (select count(*)::integer from public.ledger_members where ledger_id = 'shared-ledger'),
  1,
  'shared ledger membership is preserved'
);
select is(
  (select count(*)::integer from public.bookkeeping_ledgers where id = 'personal-ledger'),
  0,
  'unshared personal ledger is replaced'
);

select lives_ok(
  $$
    select public.replace_user_bookkeeping_entries(
      '[{"id":"entry-old","type":"expense","amount":12.50,"category":"food","date":"2026-07-29","account":"cash","note":"","tags":[],"ledger_id":null,"created_at":1753747200000}]'::jsonb
    )
  $$,
  'valid personal entries can be replaced'
);
select throws_ok(
  $$
    select public.replace_user_bookkeeping_entries(
      '[{"id":"entry-new","type":"expense","amount":-1,"category":"food","date":"2026-07-29","account":"cash","note":"","tags":[],"ledger_id":null,"created_at":1753747200000}]'::jsonb
    )
  $$,
  'invalid amount rejects the replacement'
);
select is(
  (
    select count(*)::integer
    from public.bookkeeping_entries
    where id = 'entry-old'
      and user_id = '00000000-0000-0000-0000-0000000000a1'
  ),
  1,
  'entry replacement rollback preserves the old row'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);
select is(
  (
    select count(*)::integer
    from public.favorites
    where user_id = '00000000-0000-0000-0000-0000000000a1'
  ),
  0,
  'RLS hides another user favorites'
);

select ok(
  public.replace_user_bookkeeping_budgets('[]'::jsonb) ? 'syncedAt',
  'RPC response includes syncedAt'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(
  (select count(*)::integer from public.profiles),
  0,
  'anon cannot enumerate the profiles table directly'
);
select is(
  (
    select count(*)::integer
    from public.list_public_profile_cards(
      array['00000000-0000-0000-0000-0000000000a1'::uuid]
    )
  ),
  1,
  'anon can read the requested narrow public profile card'
);
select throws_ok(
  $$
    insert into public.tool_usage_events (user_id, item_id, item_type)
    values (
      '00000000-0000-0000-0000-0000000000a1',
      'unit-converter',
      'tool'
    )
  $$,
  'anonymous usage event insert is rejected'
);
select throws_ok(
  $$ select public.replace_user_favorites('[]'::jsonb) $$,
  'anonymous replacement is rejected'
);

reset role;

select * from finish();
rollback;
