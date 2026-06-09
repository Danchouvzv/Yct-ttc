
-- Profile/team fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS team_name text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'ru';

-- Film submission fields
ALTER TABLE public.films
  ADD COLUMN IF NOT EXISTS theme text,
  ADD COLUMN IF NOT EXISTS genres text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS conditions_log text,
  ADD COLUMN IF NOT EXISTS portfolio_reach text,
  ADD COLUMN IF NOT EXISTS portfolio_connect text,
  ADD COLUMN IF NOT EXISTS portfolio_doc_path text,
  ADD COLUMN IF NOT EXISTS participants jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS submitted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Portfolio storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolios', 'portfolios', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own portfolio"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own portfolio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own portfolio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own portfolio"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);
