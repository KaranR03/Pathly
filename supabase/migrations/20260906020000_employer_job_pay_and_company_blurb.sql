-- Employers now describe pay as an explicit "per year" or "per hour" rate,
-- and can add a short blurb about their company shown on the listing (kept
-- on the job row, not the employer's profile, since job_applications/
-- employer_jobs readers cannot read another user's profiles row under RLS).
ALTER TABLE public.employer_jobs
  ADD COLUMN salary_period TEXT NOT NULL DEFAULT 'year',
  ADD COLUMN company_blurb TEXT;
