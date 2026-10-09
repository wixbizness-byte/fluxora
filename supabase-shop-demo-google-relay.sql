-- One-time cross-origin demo-login relay. Public/anonymous roles cannot read or mutate.
create table if not exists public.shop_demo_sso_tickets (
  ticket_hash text primary key check (length(ticket_hash) = 64),
  state_hash text not null check (length(state_hash) = 64),
  buyer_email text not null,
  role text not null check (role in ('admin', 'member', 'free')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz
);
create index if not exists shop_demo_sso_expiry_idx on public.shop_demo_sso_tickets (expires_at);
alter table public.shop_demo_sso_tickets enable row level security;
revoke all on public.shop_demo_sso_tickets from public, anon, authenticated;
grant all on public.shop_demo_sso_tickets to service_role;

create table if not exists public.shop_demo_login_sessions (
  token_hash text primary key check (length(token_hash) = 64),
  buyer_email text not null,
  role text not null check (role in ('admin', 'member', 'free')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.shop_demo_login_sessions enable row level security;
revoke all on public.shop_demo_login_sessions from public, anon, authenticated;
grant all on public.shop_demo_login_sessions to service_role;

create or replace function public.shop_demo_consume_sso_ticket(
  p_ticket_hash text, p_state_hash text
) returns table (buyer_email text, member_role text)
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  return query
  with claimed as (
    update public.shop_demo_sso_tickets s
       set redeemed_at = now()
     where s.ticket_hash = p_ticket_hash
       and s.state_hash = p_state_hash
       and s.redeemed_at is null
       and s.expires_at > now()
     returning s.buyer_email, s.role
  )
  select claimed.buyer_email, claimed.role from claimed;
end;
$$;
revoke all on function public.shop_demo_consume_sso_ticket(text,text) from PUBLIC, anon, authenticated;
grant execute on function public.shop_demo_consume_sso_ticket(text,text) to service_role;
