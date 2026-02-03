-- Fix accidental UNIQUE(user_id) constraint on user_credits
-- Some environments ended up with a unique constraint named: user_credits_user_id_unique
-- This breaks monthly credits because the intended key is (user_id, month_start).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_credits_user_id_unique'
      AND conrelid = 'public.user_credits'::regclass
  ) THEN
    ALTER TABLE public.user_credits DROP CONSTRAINT user_credits_user_id_unique;
  END IF;

  -- Ensure the composite primary key exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE contype = 'p'
      AND conrelid = 'public.user_credits'::regclass
  ) THEN
    ALTER TABLE public.user_credits ADD PRIMARY KEY (user_id, month_start);
  END IF;
END $$;
