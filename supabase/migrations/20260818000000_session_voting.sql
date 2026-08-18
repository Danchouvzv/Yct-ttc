-- Session-based audience voting: replace anonymous voter_token with auth user_id
-- Films grouped into sessions of 6; each session gets its own QR / URL

-- 1. Wipe old votes
TRUNCATE TABLE public.audience_votes;

-- 2. Add session tracking to films
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS session_number INT;

-- 3. Evolve audience_votes
ALTER TABLE public.audience_votes
  ADD COLUMN IF NOT EXISTS session_number INT,
  ADD COLUMN IF NOT EXISTS user_id        UUID;

ALTER TABLE public.audience_votes
  DROP CONSTRAINT IF EXISTS audience_votes_award_choice_rank_voter_token_key;

ALTER TABLE public.audience_votes
  DROP COLUMN IF EXISTS voter_token;

-- One vote per user per award per rank (across all sessions)
ALTER TABLE public.audience_votes
  ADD CONSTRAINT audience_votes_user_unique UNIQUE (award, choice_rank, user_id);

-- 4. RLS: only authenticated users can insert their own rows
DROP POLICY IF EXISTS "audience_votes_insert" ON public.audience_votes;
CREATE POLICY "audience_votes_insert" ON public.audience_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
