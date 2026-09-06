CREATE TABLE public.employer_jobs (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  industry TEXT NOT NULL,
  suburb TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  salary_min INTEGER NOT NULL,
  salary_max INTEGER NOT NULL,
  job_type TEXT NOT NULL,
  arrangement TEXT NOT NULL,
  experience TEXT NOT NULL,
  years_preferred INTEGER NOT NULL DEFAULT 0,
  company_size TEXT NOT NULL,
  required TEXT[] NOT NULL DEFAULT '{}',
  preferred TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_jobs TO authenticated;
GRANT ALL ON public.employer_jobs TO service_role;

ALTER TABLE public.employer_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can browse employer jobs" ON public.employer_jobs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners can insert their own jobs" ON public.employer_jobs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own jobs" ON public.employer_jobs
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own jobs" ON public.employer_jobs
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TRIGGER employer_jobs_touch_updated_at
BEFORE UPDATE ON public.employer_jobs
FOR EACH ROW EXECUTE FUNCTION public.pathly_touch_updated_at();

CREATE INDEX employer_jobs_owner_id_idx ON public.employer_jobs (owner_id);

CREATE TABLE public.job_applications (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.employer_jobs ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  resume_file_name TEXT NOT NULL,
  resume_skills TEXT[] NOT NULL DEFAULT '{}',
  resume_years_experience NUMERIC,
  github_username TEXT,
  linkedin_url TEXT,
  linkedin_text TEXT,
  verification JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);

GRANT SELECT, INSERT, UPDATE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view their own applications" ON public.job_applications
  FOR SELECT TO authenticated USING (auth.uid() = applicant_id);
CREATE POLICY "Applicants can submit their own applications" ON public.job_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Employers can view applications to their own jobs" ON public.job_applications
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employer_jobs j
      WHERE j.id = job_applications.job_id AND j.owner_id = auth.uid()
    )
  );
CREATE POLICY "Employers can update the status of applications to their own jobs" ON public.job_applications
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.employer_jobs j
      WHERE j.id = job_applications.job_id AND j.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employer_jobs j
      WHERE j.id = job_applications.job_id AND j.owner_id = auth.uid()
    )
  );

CREATE INDEX job_applications_job_id_idx ON public.job_applications (job_id);
CREATE INDEX job_applications_applicant_id_idx ON public.job_applications (applicant_id);
