begin;
create table if not exists public.lottery_draws (
  id text primary key,
  kind text not null check (kind in ('dominical','miercolito','zodiaco','extraordinario','especial')),
  date date not null,
  number text not null,
  status text not null check (status in ('draft','scheduled','published')),
  body jsonb not null check (jsonb_typeof(body) = 'object'),
  unique (kind, number)
);
create index if not exists lottery_draws_date on public.lottery_draws(date desc);
create table if not exists public.lottery_sessions (id text primary key, expires bigint not null);
create index if not exists lottery_sessions_expiry on public.lottery_sessions(expires);
create table if not exists public.lottery_attempts (key text primary key, count integer not null, reset bigint not null);
alter table public.lottery_draws enable row level security;
alter table public.lottery_sessions enable row level security;
alter table public.lottery_attempts enable row level security;
revoke all on public.lottery_draws, public.lottery_sessions, public.lottery_attempts from public, anon, authenticated;
grant select, insert, update, delete on public.lottery_draws, public.lottery_sessions, public.lottery_attempts to service_role;
create or replace function public.lottery_consume_attempt(attempt_key text, attempt_limit integer, duration_ms bigint)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000); current_count integer;
begin
  if attempt_limit < 1 or duration_ms < 1 then raise exception 'Invalid rate limit'; end if;
  delete from public.lottery_attempts where reset < now_ms;
  insert into public.lottery_attempts as a (key, count, reset) values (attempt_key, 1, now_ms + duration_ms)
  on conflict (key) do update set
    count = case when a.reset <= now_ms then 1 else least(a.count + 1, attempt_limit + 1) end,
    reset = case when a.reset <= now_ms then now_ms + duration_ms else a.reset end
  returning count into current_count;
  return current_count <= attempt_limit;
end;
$$;
revoke all on function public.lottery_consume_attempt(text, integer, bigint) from public, anon, authenticated;
grant execute on function public.lottery_consume_attempt(text, integer, bigint) to service_role;
commit;
