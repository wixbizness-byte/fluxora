create table if not exists public.fluxora_tally_daily (
  date date primary key,
  commission numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fluxora_tally_daily enable row level security;
revoke all on table public.fluxora_tally_daily from anon, authenticated;
grant select, insert, update, delete on table public.fluxora_tally_daily to service_role;

-- Seed the current PH calendar day from the existing tally state.
insert into public.fluxora_tally_daily (date, commission, updated_at)
select
  (timezone('Asia/Manila', now()))::date,
  coalesce(sum(
    case
      when (account->'values'->>'commission_today') ~ '^-?[0-9]+(\.[0-9]+)?$'
        then (account->'values'->>'commission_today')::numeric
      else 0
    end
  ), 0),
  now()
from public.fluxora_tally_state s
cross join lateral jsonb_array_elements(s.data->'accounts') account
where s.id = 'main'
on conflict (date) do update
set commission = excluded.commission,
    updated_at = excluded.updated_at;
