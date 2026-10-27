begin;

drop function if exists public.lottery_consume_attempt(text, integer, bigint);
drop table if exists public.lottery_sessions;
drop table if exists public.lottery_attempts;

commit;
