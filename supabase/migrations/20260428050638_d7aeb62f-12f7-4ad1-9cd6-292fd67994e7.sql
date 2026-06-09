
-- Fix function search_path
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end; $$;

-- Lock down handle_new_user execution to system only
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Replace broad public SELECT on storage with owner-only listing.
-- Public read still works via getPublicUrl (signed/direct CDN read does not require RLS SELECT).
drop policy if exists "Public read films" on storage.objects;
drop policy if exists "Public read thumbs" on storage.objects;

create policy "Owners can list own films"
  on storage.objects for select using (
    bucket_id = 'films' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Owners can list own thumbs"
  on storage.objects for select using (
    bucket_id = 'thumbs' and auth.uid()::text = (storage.foldername(name))[1]
  );
