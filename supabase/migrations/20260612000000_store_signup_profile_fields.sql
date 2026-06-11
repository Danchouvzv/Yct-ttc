-- Store team registration fields from auth metadata when a profile is auto-created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    team_name,
    country,
    city,
    language
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'team_name',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    coalesce(new.raw_user_meta_data->>'language', 'ru')
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    team_name = excluded.team_name,
    country = excluded.country,
    city = excluded.city,
    language = excluded.language;

  return new;
end;
$$;
