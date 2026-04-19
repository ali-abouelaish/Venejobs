-- Add hire_count to jobs (default 1, max 10)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS hire_count INTEGER NOT NULL DEFAULT 1
  CHECK (hire_count >= 1 AND hire_count <= 10);

-- Add 'filled' to enum_jobs_status (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'filled'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_jobs_status')
  ) THEN
    ALTER TYPE enum_jobs_status ADD VALUE 'filled' AFTER 'paused';
  END IF;
END$$;
