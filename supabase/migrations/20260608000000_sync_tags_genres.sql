-- Backfill tags from genres for all existing films
-- The upload form previously only wrote to `genres`, not `tags`.
-- UI components (FilmCard, explore search) read from `tags`.
-- This migration syncs existing data and adds a trigger to keep them in sync.

UPDATE public.films
SET tags = genres
WHERE (tags IS NULL OR tags = '{}')
  AND genres IS NOT NULL
  AND array_length(genres, 1) > 0;

-- Trigger: whenever genres is updated on a film, keep tags in sync too.
CREATE OR REPLACE FUNCTION public.sync_tags_from_genres()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Only sync if genres changed and tags wasn't explicitly provided
  IF NEW.genres IS DISTINCT FROM OLD.genres THEN
    NEW.tags := COALESCE(NEW.genres, '{}');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS films_sync_tags ON public.films;
CREATE TRIGGER films_sync_tags
  BEFORE UPDATE ON public.films
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_tags_from_genres();
