-- Add the user column, fill it, then enforce NOT NULL + uniqueness
ALTER TABLE public.devotionals
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- TODO: update existing rows with the correct owner. For example:
-- UPDATE public.devotionals SET user_id = '<some-user-uuid>' WHERE user_id IS NULL;

ALTER TABLE public.devotionals
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.devotionals
  DROP CONSTRAINT IF EXISTS devotionals_date_key;

ALTER TABLE public.devotionals
  ADD CONSTRAINT devotionals_user_id_date_key UNIQUE (user_id, date);

-- Update row-level security policies
DROP POLICY IF EXISTS "Anyone can view devotionals" ON public.devotionals;
DROP POLICY IF EXISTS "Users can insert their devotionals" ON public.devotionals;
DROP POLICY IF EXISTS "Users can update their devotionals" ON public.devotionals;
DROP POLICY IF EXISTS "Users can delete their devotionals" ON public.devotionals;

CREATE POLICY "Users can view their devotionals"
  ON public.devotionals
  FOR SELECT
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can insert their devotionals"
  ON public.devotionals
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their devotionals"
  ON public.devotionals
  FOR UPDATE
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their devotionals"
  ON public.devotionals
  FOR DELETE
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- New composite index
DROP INDEX IF EXISTS idx_devotionals_date;
CREATE INDEX IF NOT EXISTS idx_devotionals_user_date ON public.devotionals(user_id, date DESC);
