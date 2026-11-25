ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS incidents_active_idx
  ON public.incidents (created_at DESC)
  WHERE deleted_at IS NULL;