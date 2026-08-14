-- Audience voting table for Round 2 screening sessions
-- Voters pick 1st and 2nd choice film per award (Glorious / Impact / Tech)
create table if not exists public.audience_votes (
  id           uuid        default gen_random_uuid() primary key,
  award        text        not null check (award in ('glorious', 'impact', 'tech')),
  choice_rank  int         not null check (choice_rank in (1, 2)),
  film_id      uuid        references public.films(id) on delete cascade not null,
  voter_token  text        not null,
  created_at   timestamptz default now() not null,
  -- one 1st-choice and one 2nd-choice per award per voter
  unique (award, choice_rank, voter_token)
);

alter table public.audience_votes enable row level security;

create policy "audience_votes_insert" on public.audience_votes
  for insert with check (true);

create policy "audience_votes_select" on public.audience_votes
  for select using (true);
