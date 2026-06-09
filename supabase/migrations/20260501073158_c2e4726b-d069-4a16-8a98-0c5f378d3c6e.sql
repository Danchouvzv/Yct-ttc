-- Comments
create table public.film_comments (
  id uuid primary key default gen_random_uuid(),
  film_id uuid not null,
  user_id uuid not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.film_comments enable row level security;

create policy "Comments viewable by everyone" on public.film_comments
for select using (true);
create policy "Users can comment" on public.film_comments
for insert with check (auth.uid() = user_id);
create policy "Users can edit own comments" on public.film_comments
for update using (auth.uid() = user_id);
create policy "Users can delete own comments" on public.film_comments
for delete using (auth.uid() = user_id);

create index film_comments_film_idx on public.film_comments(film_id, created_at desc);

create trigger film_comments_set_updated_at
before update on public.film_comments
for each row execute function public.set_updated_at();

-- Ratings
create table public.film_ratings (
  film_id uuid not null,
  user_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (film_id, user_id)
);
alter table public.film_ratings enable row level security;

create policy "Ratings viewable by everyone" on public.film_ratings
for select using (true);
create policy "Users can rate" on public.film_ratings
for insert with check (auth.uid() = user_id);
create policy "Users can change own rating" on public.film_ratings
for update using (auth.uid() = user_id);
create policy "Users can remove own rating" on public.film_ratings
for delete using (auth.uid() = user_id);

create index film_ratings_film_idx on public.film_ratings(film_id);

create trigger film_ratings_set_updated_at
before update on public.film_ratings
for each row execute function public.set_updated_at();

-- Follows (author subscriptions)
create table public.follows (
  follower_id uuid not null,
  author_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, author_id),
  check (follower_id <> author_id)
);
alter table public.follows enable row level security;

create policy "Follows viewable by everyone" on public.follows
for select using (true);
create policy "Users can follow" on public.follows
for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows
for delete using (auth.uid() = follower_id);

create index follows_author_idx on public.follows(author_id);
create index follows_follower_idx on public.follows(follower_id);

-- Search indexes on films
create index if not exists films_tags_gin on public.films using gin (tags);
create index if not exists films_search_idx on public.films
using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));
create index if not exists films_created_idx on public.films(created_at desc);