-- 1) Status field for films moderation
DO $$ BEGIN
  CREATE TYPE public.film_status AS ENUM ('pending','approved','rejected','disqualified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.films
  ADD COLUMN IF NOT EXISTS status public.film_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderation_note text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid;

-- 2) Admin policies on films (in addition to existing user policies)
DROP POLICY IF EXISTS "Admins can update any film" ON public.films;
CREATE POLICY "Admins can update any film"
  ON public.films FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete any film" ON public.films;
CREATE POLICY "Admins can delete any film"
  ON public.films FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Allow admins to read full profiles (already public SELECT, this is a no-op safety)
-- profiles already viewable by everyone — OK

-- 4) Storage: allow admins to read private 'portfolios' bucket
DROP POLICY IF EXISTS "Admins can read portfolios" ON storage.objects;
CREATE POLICY "Admins can read portfolios"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'portfolios' AND public.has_role(auth.uid(), 'admin'));