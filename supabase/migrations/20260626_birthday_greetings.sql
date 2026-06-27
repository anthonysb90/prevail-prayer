-- Birthday greetings: idempotent daily send support.

-- Records who has already been greeted on a given day so the daily job never
-- double-sends, even if it runs more than once.
create table if not exists public.birthday_greetings_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  greeted_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, greeted_on)
);

alter table public.birthday_greetings_log enable row level security;
-- No policies: only the service role / SECURITY DEFINER function may touch it.

-- Atomically claims today's birthday users (those not yet greeted) and returns
-- their push tokens, Pro status, and name. Uses America/New_York as the
-- reference clock so greetings land in the morning for a US-centered audience.
create or replace function public.claim_birthday_greetings()
returns table (
  user_id uuid,
  expo_push_token text,
  platform text,
  is_pro boolean,
  display_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'America/New_York')::date;
begin
  return query
  with eligible as (
    select p.id
    from profiles p
    where p.birthday is not null
      and p.deactivated_at is null
      and to_char(p.birthday, 'MM-DD') = to_char(today, 'MM-DD')
  ),
  claimed as (
    insert into birthday_greetings_log (user_id, greeted_on)
    select e.id, today from eligible e
    on conflict (user_id, greeted_on) do nothing
    returning birthday_greetings_log.user_id
  )
  select
    c.user_id,
    t.expo_push_token,
    t.platform,
    (p.subscription_status in ('premium', 'trial')) as is_pro,
    p.display_name
  from claimed c
  join profiles p on p.id = c.user_id
  join user_push_tokens t on t.user_id = c.user_id;
end;
$$;
