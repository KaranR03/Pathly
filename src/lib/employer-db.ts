/**
 * Client-side access to the `employer_jobs` / `job_applications` tables.
 * Follows the same pattern as use-cloud-profile.ts: plain calls against the
 * browser `supabase` client, security enforced by RLS (see the migration in
 * supabase/migrations) rather than by a server function.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/data/jobs";
import type { VerificationResult } from "./verify-application.functions";
import type { Json, Tables, TablesInsert } from "@/integrations/supabase/types";

type EmployerJobRow = Tables<"employer_jobs">;
type JobApplicationRow = Tables<"job_applications">;

function rowToJob(row: EmployerJobRow): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    industry: row.industry,
    suburb: row.suburb,
    city: row.city,
    state: row.state,
    lat: row.lat,
    lng: row.lng,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    jobType: row.job_type as Job["jobType"],
    arrangement: row.arrangement as Job["arrangement"],
    experience: row.experience as Job["experience"],
    yearsPreferred: row.years_preferred,
    postedDaysAgo: Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(row.created_at).getTime()) / 86_400_000,
      ),
    ),
    companySize: row.company_size as Job["companySize"],
    required: row.required,
    preferred: row.preferred,
    description: row.description,
    source: "employer",
    ownerId: row.owner_id,
  };
}

export async function fetchAllEmployerJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("employer_jobs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToJob);
}

export async function insertEmployerJob(
  ownerId: string,
  job: Job,
): Promise<Job | null> {
  const insert: TablesInsert<"employer_jobs"> = {
    owner_id: ownerId,
    title: job.title,
    company: job.company,
    industry: job.industry,
    suburb: job.suburb,
    city: job.city,
    state: job.state,
    lat: job.lat,
    lng: job.lng,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    job_type: job.jobType,
    arrangement: job.arrangement,
    experience: job.experience,
    years_preferred: job.yearsPreferred,
    company_size: job.companySize,
    required: job.required,
    preferred: job.preferred,
    description: job.description,
  };
  const { data, error } = await supabase
    .from("employer_jobs")
    .insert(insert)
    .select("*")
    .single();
  if (error || !data) {
    console.error("[Pathly] Failed to publish job", error);
    return null;
  }
  return rowToJob(data);
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  applicantId: string;
  applicantName: string;
  resumeFileName: string;
  resumeSkills: string[];
  resumeYearsExperience: number | null;
  githubUsername: string | null;
  linkedinUrl: string | null;
  linkedinText: string | null;
  verification: VerificationResult | null;
  status: string;
  createdAt: string;
}

function rowToApplication(row: JobApplicationRow): ApplicationRecord {
  const verification =
    row.verification &&
    typeof row.verification === "object" &&
    "authenticityScore" in row.verification
      ? (row.verification as unknown as VerificationResult)
      : null;
  return {
    id: row.id,
    jobId: row.job_id,
    applicantId: row.applicant_id,
    applicantName: row.applicant_name,
    resumeFileName: row.resume_file_name,
    resumeSkills: row.resume_skills,
    resumeYearsExperience: row.resume_years_experience,
    githubUsername: row.github_username,
    linkedinUrl: row.linkedin_url,
    linkedinText: row.linkedin_text,
    verification,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function submitJobApplication(input: {
  applicantId: string;
  applicantName: string;
  jobId: string;
  resumeFileName: string;
  resumeSkills: string[];
  resumeYearsExperience: number | null;
  githubUsername: string | null;
  linkedinUrl: string | null;
  linkedinText: string | null;
  verification: VerificationResult;
}): Promise<{ error: string | null }> {
  const insert: TablesInsert<"job_applications"> = {
    applicant_id: input.applicantId,
    applicant_name: input.applicantName,
    job_id: input.jobId,
    resume_file_name: input.resumeFileName,
    resume_skills: input.resumeSkills,
    resume_years_experience: input.resumeYearsExperience,
    github_username: input.githubUsername,
    linkedin_url: input.linkedinUrl,
    linkedin_text: input.linkedinText,
    verification: input.verification as unknown as Json,
  };
  const { error } = await supabase.from("job_applications").insert(insert);
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "You've already applied to this role."
          : error.message,
    };
  }
  return { error: null };
}

export async function fetchMyApplications(
  applicantId: string,
): Promise<ApplicationRecord[]> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToApplication);
}

export async function fetchApplicantsForMyJobs(
  ownerId: string,
): Promise<{ job: Job; applications: ApplicationRecord[] }[]> {
  const { data: jobRows, error: jobsError } = await supabase
    .from("employer_jobs")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (jobsError || !jobRows || jobRows.length === 0) return [];

  const jobIds = jobRows.map((j) => j.id);
  const { data: appRows } = await supabase
    .from("job_applications")
    .select("*")
    .in("job_id", jobIds)
    .order("created_at", { ascending: false });

  return jobRows.map((jobRow) => ({
    job: rowToJob(jobRow),
    applications: (appRows ?? [])
      .filter((a) => a.job_id === jobRow.id)
      .map(rowToApplication),
  }));
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);
  return { error: error?.message ?? null };
}
