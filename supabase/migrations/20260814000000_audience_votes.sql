-- Audience voting table for Round 2 screening sessions
create table if not exists public.audience_votes (
  id           uuid        default gen_random_uuid() primary key,
  film_id      uuid        references public.films(id) on delete cascade not null,
  award        text        not null check (award in ('impact', 'tech')),
  score        int         not null check (score between 1 and 5),
  voter_token  text        not null,
  created_at   timestamptz default now() not null,
  unique (film_id, award, voter_token)
);

alter table public.audience_votes enable row level security;

-- Anyone (anon) can insert a vote
create policy "audience_votes_insert" on public.audience_votes
  for insert with check (true);

-- Anyone can read aggregated results
create policy "audience_votes_select" on public.audience_votes
  for select using (true);
