begin;

alter table public.lottery_draws
  add column if not exists views bigint not null default 0;

create table if not exists public.lottery_draw_visitors (
  draw_id text not null references public.lottery_draws(id) on delete cascade,
  visitor_hash text not null check (visitor_hash ~ '^[0-9a-f]{64}$'),
  viewed_at timestamptz not null default now(),
  primary key (draw_id, visitor_hash)
);

alter table public.lottery_draw_visitors enable row level security;
revoke all on public.lottery_draw_visitors from public, anon, authenticated;
grant select, insert, delete on public.lottery_draw_visitors to service_role;

create or replace function public.lottery_record_draw_view(
  draw_id_input text,
  visitor_hash_input text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare total bigint;
begin
  if visitor_hash_input !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid visitor hash';
  end if;

  if not exists (
    select 1 from public.lottery_draws
    where id = draw_id_input and status in ('published', 'scheduled')
  ) then
    return null;
  end if;

  insert into public.lottery_draw_visitors (draw_id, visitor_hash)
  values (draw_id_input, visitor_hash_input)
  on conflict do nothing;

  if found then
    update public.lottery_draws
    set views = views + 1
    where id = draw_id_input
    returning views into total;
  else
    select views into total from public.lottery_draws where id = draw_id_input;
  end if;

  return total;
end;
$$;

revoke all on function public.lottery_record_draw_view(text, text) from public, anon, authenticated;
grant execute on function public.lottery_record_draw_view(text, text) to service_role;

commit;
