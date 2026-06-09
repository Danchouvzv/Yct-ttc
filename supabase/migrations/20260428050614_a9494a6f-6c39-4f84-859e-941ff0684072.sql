
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- FILMS
create table public.films (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  tags text[] default '{}',
  video_path text not null,
  thumb_path text,
  duration_seconds int,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.films enable row level security;

create policy "Films are viewable by everyone"
  on public.films for select using (true);
create policy "Users can insert their own films"
  on public.films for insert with check (auth.uid() = user_id);
create policy "Users can update their own films"
  on public.films for update using (auth.uid() = user_id);
create policy "Users can delete their own films"
  on public.films for delete using (auth.uid() = user_id);

create trigger films_updated_at before update on public.films
  for each row execute function public.set_updated_at();

create index films_user_id_idx on public.films(user_id);
create index films_created_at_idx on public.films(created_at desc);

-- LIKES
create table public.film_likes (
  film_id uuid not null references public.films(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (film_id, user_id)
);
alter table public.film_likes enable row level security;
create policy "Likes viewable by everyone" on public.film_likes for select using (true);
create policy "Users can like" on public.film_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on public.film_likes for delete using (auth.uid() = user_id);

-- SAVES
create table public.film_saves (
  film_id uuid not null references public.films(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (film_id, user_id)
);
alter table public.film_saves enable row level security;
create policy "Users see their saves" on public.film_saves for select using (auth.uid() = user_id);
create policy "Users can save" on public.film_saves for insert with check (auth.uid() = user_id);
create policy "Users can unsave" on public.film_saves for delete using (auth.uid() = user_id);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('films','films', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('thumbs','thumbs', true) on conflict do nothing;

-- Storage policies for films bucket
create policy "Public read films"
  on storage.objects for select using (bucket_id = 'films');
create policy "Authenticated upload films"
  on storage.objects for insert with check (
    bucket_id = 'films' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Owner update films"
  on storage.objects for update using (
    bucket_id = 'films' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Owner delete films"
  on storage.objects for delete using (
    bucket_id = 'films' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for thumbs bucket
create policy "Public read thumbs"
  on storage.objects for select using (bucket_id = 'thumbs');
create policy "Authenticated upload thumbs"
  on storage.objects for insert with check (
    bucket_id = 'thumbs' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Owner update thumbs"
  on storage.objects for update using (
    bucket_id = 'thumbs' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Owner delete thumbs"
  on storage.objects for delete using (
    bucket_id = 'thumbs' and auth.uid()::text = (storage.foldername(name))[1]
  );
