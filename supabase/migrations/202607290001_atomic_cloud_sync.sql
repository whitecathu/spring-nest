-- Atomic, authenticated replacement APIs for local-first cloud mirroring.
-- Every function is SECURITY INVOKER so RLS remains authoritative. Ownership
-- is always derived from auth.uid(); no client supplied user id is accepted.

create or replace function public.replace_user_favorites(items jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_count integer;
begin
  if current_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' then
    raise exception using errcode = '22023', message = 'items must be a JSON array';
  end if;
  if jsonb_array_length(items) > 500 then
    raise exception using errcode = '54000', message = 'favorites exceed the 500 item limit';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(items) as item(value)
    where jsonb_typeof(value) <> 'object'
      or not (value ?& array['item_id', 'item_type']::text[])
      or jsonb_typeof(value->'item_id') <> 'string'
      or char_length(value->>'item_id') not between 1 and 160
      or value->>'item_type' not in ('tool', 'game')
  ) then
    raise exception using errcode = '22023', message = 'invalid favorite item';
  end if;

  delete from public.favorites where user_id = current_user_id;

  insert into public.favorites (user_id, item_id, item_type)
  select current_user_id, record.item_id, record.item_type
  from jsonb_to_recordset(items) as record(item_id text, item_type text);

  get diagnostics inserted_count = row_count;
  return jsonb_build_object(
    'count', inserted_count,
    'syncedAt', clock_timestamp()
  );
end;
$$;

create or replace function public.replace_user_bookkeeping_entries(items jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_count integer;
begin
  if current_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' then
    raise exception using errcode = '22023', message = 'items must be a JSON array';
  end if;
  if jsonb_array_length(items) > 20000 then
    raise exception using errcode = '54000', message = 'entries exceed the 20000 row limit';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(items) as item(value)
    where jsonb_typeof(value) <> 'object'
      or not (
        value ?& array[
          'id',
          'type',
          'amount',
          'category',
          'date',
          'account',
          'note',
          'tags',
          'created_at'
        ]::text[]
      )
      or jsonb_typeof(value->'id') <> 'string'
      or char_length(value->>'id') not between 1 and 128
      or value->>'type' not in ('expense', 'income')
      or jsonb_typeof(value->'amount') <> 'number'
      or (value->>'amount')::numeric <= 0
      or (value->>'amount')::numeric > 9999999999.99
      or jsonb_typeof(value->'category') <> 'string'
      or char_length(value->>'category') not between 1 and 100
      or jsonb_typeof(value->'date') <> 'string'
      or value->>'date' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      or jsonb_typeof(value->'account') <> 'string'
      or char_length(value->>'account') not between 1 and 100
      or jsonb_typeof(value->'note') <> 'string'
      or char_length(value->>'note') > 1000
      or jsonb_typeof(value->'tags') <> 'array'
      or jsonb_array_length(value->'tags') > 20
      or exists (
        select 1
        from jsonb_array_elements(value->'tags') as tag(tag_value)
        where jsonb_typeof(tag_value) <> 'string'
          or char_length(tag_value#>>'{}') not between 1 and 50
      )
      or (
        value->'ledger_id' <> 'null'::jsonb
        and (
          jsonb_typeof(value->'ledger_id') <> 'string'
          or char_length(value->>'ledger_id') not between 1 and 128
        )
      )
      or jsonb_typeof(value->'created_at') <> 'number'
      or (value->>'created_at')::numeric < 0
      or (value->>'created_at')::numeric > 9999999999999
      or mod((value->>'created_at')::numeric, 1) <> 0
  ) then
    raise exception using errcode = '22023', message = 'invalid bookkeeping entry';
  end if;

  -- Shared-ledger rows are outside the personal replacement set. This
  -- preserves both rows in ledgers owned by another user and ledgers with
  -- membership relationships.
  delete from public.bookkeeping_entries as entry
  where entry.user_id = current_user_id
    and (
      entry.ledger_id is null
      or not exists (
        select 1
        from public.bookkeeping_ledgers as ledger
        where ledger.id = entry.ledger_id
          and (
            ledger.owner_id is distinct from current_user_id
            or ledger.user_id is distinct from current_user_id
            or exists (
              select 1
              from public.ledger_members as member
              where member.ledger_id = ledger.id
            )
          )
      )
    );

  insert into public.bookkeeping_entries (
    id,
    user_id,
    type,
    amount,
    category,
    date,
    account,
    note,
    tags,
    ledger_id,
    created_at
  )
  select
    record.id,
    current_user_id,
    record.type,
    record.amount,
    record.category,
    record.date,
    record.account,
    record.note,
    array(select jsonb_array_elements_text(record.tags)),
    record.ledger_id,
    record.created_at
  from jsonb_to_recordset(items) as record(
    id text,
    type text,
    amount numeric,
    category text,
    date date,
    account text,
    note text,
    tags jsonb,
    ledger_id text,
    created_at bigint
  )
  where record.ledger_id is null
    or not exists (
      select 1
      from public.bookkeeping_ledgers as ledger
      where ledger.id = record.ledger_id
        and (
          ledger.owner_id is distinct from current_user_id
          or ledger.user_id is distinct from current_user_id
          or exists (
            select 1
            from public.ledger_members as member
            where member.ledger_id = ledger.id
          )
        )
    );

  get diagnostics inserted_count = row_count;
  return jsonb_build_object(
    'count', inserted_count,
    'syncedAt', clock_timestamp()
  );
end;
$$;

create or replace function public.replace_user_bookkeeping_budgets(items jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_count integer;
begin
  if current_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' then
    raise exception using errcode = '22023', message = 'items must be a JSON array';
  end if;
  if jsonb_array_length(items) > 500 then
    raise exception using errcode = '54000', message = 'budgets exceed the 500 item limit';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(items) as item(value)
    where jsonb_typeof(value) <> 'object'
      or not (value ?& array['category', 'monthly_amount']::text[])
      or jsonb_typeof(value->'category') <> 'string'
      or char_length(value->>'category') not between 1 and 100
      or jsonb_typeof(value->'monthly_amount') <> 'number'
      or (value->>'monthly_amount')::numeric < 0
      or (value->>'monthly_amount')::numeric > 9999999999.99
  ) then
    raise exception using errcode = '22023', message = 'invalid bookkeeping budget';
  end if;

  delete from public.bookkeeping_budgets where user_id = current_user_id;
  insert into public.bookkeeping_budgets (user_id, category, monthly_amount)
  select current_user_id, record.category, record.monthly_amount
  from jsonb_to_recordset(items) as record(category text, monthly_amount numeric);

  get diagnostics inserted_count = row_count;
  return jsonb_build_object(
    'count', inserted_count,
    'syncedAt', clock_timestamp()
  );
end;
$$;

create or replace function public.replace_user_bookkeeping_categories(items jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_count integer;
begin
  if current_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' then
    raise exception using errcode = '22023', message = 'items must be a JSON array';
  end if;
  if jsonb_array_length(items) > 500 then
    raise exception using errcode = '54000', message = 'categories exceed the 500 item limit';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(items) as item(value)
    where jsonb_typeof(value) <> 'object'
      or not (value ?& array['type', 'name', 'sort_order']::text[])
      or value->>'type' not in ('expense', 'income')
      or jsonb_typeof(value->'name') <> 'string'
      or char_length(value->>'name') not between 1 and 100
      or jsonb_typeof(value->'sort_order') <> 'number'
      or (value->>'sort_order')::numeric < 0
      or (value->>'sort_order')::numeric > 499
      or mod((value->>'sort_order')::numeric, 1) <> 0
  ) then
    raise exception using errcode = '22023', message = 'invalid bookkeeping category';
  end if;

  delete from public.bookkeeping_categories where user_id = current_user_id;
  insert into public.bookkeeping_categories (user_id, type, name, sort_order)
  select current_user_id, record.type, record.name, record.sort_order
  from jsonb_to_recordset(items) as record(
    type text,
    name text,
    sort_order integer
  );

  get diagnostics inserted_count = row_count;
  return jsonb_build_object(
    'count', inserted_count,
    'syncedAt', clock_timestamp()
  );
end;
$$;

create or replace function public.replace_user_bookkeeping_recurring(items jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_count integer;
begin
  if current_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' then
    raise exception using errcode = '22023', message = 'items must be a JSON array';
  end if;
  if jsonb_array_length(items) > 5000 then
    raise exception using errcode = '54000', message = 'recurring rules exceed the 5000 item limit';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(items) as item(value)
    where jsonb_typeof(value) <> 'object'
      or not (
        value ?& array[
          'id',
          'type',
          'amount',
          'category',
          'account',
          'note',
          'tags',
          'day_of_month',
          'active',
          'created_at'
        ]::text[]
      )
      or jsonb_typeof(value->'id') <> 'string'
      or char_length(value->>'id') not between 1 and 128
      or value->>'type' not in ('expense', 'income')
      or jsonb_typeof(value->'amount') <> 'number'
      or (value->>'amount')::numeric <= 0
      or (value->>'amount')::numeric > 9999999999.99
      or jsonb_typeof(value->'category') <> 'string'
      or char_length(value->>'category') not between 1 and 100
      or jsonb_typeof(value->'account') <> 'string'
      or char_length(value->>'account') not between 1 and 100
      or jsonb_typeof(value->'note') <> 'string'
      or char_length(value->>'note') > 1000
      or jsonb_typeof(value->'tags') <> 'array'
      or jsonb_array_length(value->'tags') > 20
      or exists (
        select 1
        from jsonb_array_elements(value->'tags') as tag(tag_value)
        where jsonb_typeof(tag_value) <> 'string'
          or char_length(tag_value#>>'{}') not between 1 and 50
      )
      or jsonb_typeof(value->'day_of_month') <> 'number'
      or (value->>'day_of_month')::numeric not between 1 and 31
      or mod((value->>'day_of_month')::numeric, 1) <> 0
      or jsonb_typeof(value->'active') <> 'boolean'
      or (
        value->'last_generated' <> 'null'::jsonb
        and (
          jsonb_typeof(value->'last_generated') <> 'string'
          or value->>'last_generated' !~ '^[0-9]{4}-[0-9]{2}$'
        )
      )
      or (
        value->'ledger_id' <> 'null'::jsonb
        and (
          jsonb_typeof(value->'ledger_id') <> 'string'
          or char_length(value->>'ledger_id') not between 1 and 128
        )
      )
      or jsonb_typeof(value->'created_at') <> 'string'
      or char_length(value->>'created_at') > 40
  ) then
    raise exception using errcode = '22023', message = 'invalid recurring rule';
  end if;

  delete from public.bookkeeping_recurring as recurring
  where recurring.user_id = current_user_id
    and (
      recurring.ledger_id is null
      or not exists (
        select 1
        from public.bookkeeping_ledgers as ledger
        where ledger.id = recurring.ledger_id
          and (
            ledger.owner_id is distinct from current_user_id
            or ledger.user_id is distinct from current_user_id
            or exists (
              select 1
              from public.ledger_members as member
              where member.ledger_id = ledger.id
            )
          )
      )
    );
  insert into public.bookkeeping_recurring (
    id,
    user_id,
    type,
    amount,
    category,
    account,
    note,
    tags,
    ledger_id,
    day_of_month,
    active,
    last_generated,
    created_at
  )
  select
    record.id,
    current_user_id,
    record.type,
    record.amount,
    record.category,
    record.account,
    record.note,
    array(select jsonb_array_elements_text(record.tags)),
    record.ledger_id,
    record.day_of_month,
    record.active,
    record.last_generated,
    record.created_at
  from jsonb_to_recordset(items) as record(
    id text,
    type text,
    amount numeric,
    category text,
    account text,
    note text,
    tags jsonb,
    ledger_id text,
    day_of_month integer,
    active boolean,
    last_generated text,
    created_at timestamptz
  )
  where record.ledger_id is null
    or not exists (
      select 1
      from public.bookkeeping_ledgers as ledger
      where ledger.id = record.ledger_id
        and (
          ledger.owner_id is distinct from current_user_id
          or ledger.user_id is distinct from current_user_id
          or exists (
            select 1
            from public.ledger_members as member
            where member.ledger_id = ledger.id
          )
        )
    );

  get diagnostics inserted_count = row_count;
  return jsonb_build_object(
    'count', inserted_count,
    'syncedAt', clock_timestamp()
  );
end;
$$;

create or replace function public.replace_user_bookkeeping_ledgers(items jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_count integer;
begin
  if current_user_id is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' then
    raise exception using errcode = '22023', message = 'items must be a JSON array';
  end if;
  if jsonb_array_length(items) > 500 then
    raise exception using errcode = '54000', message = 'ledgers exceed the 500 item limit';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(items) as item(value)
    where jsonb_typeof(value) <> 'object'
      or not (value ?& array['id', 'name', 'emoji', 'created_at']::text[])
      or jsonb_typeof(value->'id') <> 'string'
      or char_length(value->>'id') not between 1 and 128
      or jsonb_typeof(value->'name') <> 'string'
      or char_length(value->>'name') not between 1 and 80
      or jsonb_typeof(value->'emoji') <> 'string'
      or char_length(value->>'emoji') > 16
      or jsonb_typeof(value->'created_at') <> 'string'
      or char_length(value->>'created_at') > 40
  ) then
    raise exception using errcode = '22023', message = 'invalid bookkeeping ledger';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(items) as item(value)
    join public.bookkeeping_ledgers as ledger on ledger.id = item.value->>'id'
    where ledger.owner_id is distinct from current_user_id
       or ledger.user_id is distinct from current_user_id
  ) then
    raise exception using errcode = '42501', message = 'ledger id belongs to another user';
  end if;

  -- A ledger with any membership row is shared. It is never part of the
  -- destructive personal replacement set, so its membership relationships
  -- cannot be cascaded away.
  delete from public.bookkeeping_ledgers as ledger
  where (ledger.user_id = current_user_id or ledger.owner_id = current_user_id)
    and not exists (
      select 1
      from public.ledger_members as member
      where member.ledger_id = ledger.id
    );

  insert into public.bookkeeping_ledgers (
    id,
    user_id,
    owner_id,
    name,
    emoji,
    created_at
  )
  select
    record.id,
    current_user_id,
    current_user_id,
    record.name,
    record.emoji,
    record.created_at
  from jsonb_to_recordset(items) as record(
    id text,
    name text,
    emoji text,
    created_at timestamptz
  )
  where not exists (
    select 1
    from public.bookkeeping_ledgers as shared
    where shared.id = record.id
      and exists (
        select 1
        from public.ledger_members as member
        where member.ledger_id = shared.id
      )
  );

  get diagnostics inserted_count = row_count;
  return jsonb_build_object(
    'count', inserted_count,
    'syncedAt', clock_timestamp()
  );
end;
$$;

revoke all on function public.replace_user_favorites(jsonb) from public;
revoke all on function public.replace_user_bookkeeping_entries(jsonb) from public;
revoke all on function public.replace_user_bookkeeping_budgets(jsonb) from public;
revoke all on function public.replace_user_bookkeeping_categories(jsonb) from public;
revoke all on function public.replace_user_bookkeeping_recurring(jsonb) from public;
revoke all on function public.replace_user_bookkeeping_ledgers(jsonb) from public;

grant execute on function public.replace_user_favorites(jsonb) to authenticated;
grant execute on function public.replace_user_bookkeeping_entries(jsonb) to authenticated;
grant execute on function public.replace_user_bookkeeping_budgets(jsonb) to authenticated;
grant execute on function public.replace_user_bookkeeping_categories(jsonb) to authenticated;
grant execute on function public.replace_user_bookkeeping_recurring(jsonb) to authenticated;
grant execute on function public.replace_user_bookkeeping_ledgers(jsonb) to authenticated;
