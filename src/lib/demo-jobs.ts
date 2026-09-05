export interface DemoJobCandidate {
  title: string;
  suburb: string;
  arrangement: string;
  experience: string;
}

const UNRELIABLE_SUBURBS = new Set([
  "chermside",
  "grafton",
  "northbridge",
  "port adelaide",
]);

const SENIOR_TITLE =
  /\b(senior|staff|principal|lead|head|vp|vice president|general counsel|director|manager)\b/i;
const EARLY_CAREER_LEVELS = new Set(["No experience", "Entry level", "Junior"]);

/**
 * Keeps only records whose generated location and seniority are safe to show
 * in the hackathon demo. The original generated snapshot stays untouched.
 */
export function isDemoReadyJob(job: DemoJobCandidate): boolean {
  const suburb = job.suburb.trim().toLowerCase();

  if (UNRELIABLE_SUBURBS.has(suburb)) return false;
  if (suburb === "remote") return false;
  if (/los angeles|san francisco/.test(suburb)) return false;
  if (SENIOR_TITLE.test(job.title) && EARLY_CAREER_LEVELS.has(job.experience))
    return false;

  return true;
}
