import type { Job } from "@/data/jobs";

export type MatchTier = "strong" | "potential" | "gap";

export interface MatchResult {
  score: number;
  tier: MatchTier;
  matched: string[];
  /** Requirements the candidate partly covers through related skills. */
  partial: string[];
  missing: string[];
  missingPreferred: string[];
  experienceGap: number;
}

export function tierFor(score: number): MatchTier {
  if (score >= 78) return "strong";
  if (score >= 50) return "potential";
  return "gap";
}

export const TIER_LABEL: Record<MatchTier, string> = {
  strong: "Strong match",
  potential: "Potential match",
  gap: "Skill gap",
};

export const TIER_COLOR: Record<MatchTier, string> = {
  strong: "#1f9d55",
  potential: "#d59a0b",
  gap: "#c8543f",
};

export interface CandidateLike {
  skills: string[];
  yearsExperience: number;
  preferredIndustries?: string[];
}

/** Words that carry no signal when comparing skill phrases. */
const STOP = new Set([
  "and",
  "or",
  "of",
  "the",
  "a",
  "in",
  "for",
  "with",
  "skills",
  "skill",
  "experience",
  "knowledge",
  "ability",
  "strong",
  "excellent",
  "advanced",
  "basic",
]);

/** Canonical forms so "MS Excel", "Excel" and "Microsoft Excel" all agree. */
const ALIASES: Record<string, string> = {
  "microsoft excel": "excel",
  "ms excel": "excel",
  "advanced excel": "excel",
  spreadsheets: "excel",
  "structured query language": "sql",
  postgres: "sql",
  postgresql: "sql",
  mysql: "sql",
  "power bi": "data visualisation",
  powerbi: "data visualisation",
  tableau: "data visualisation",
  "data visualization": "data visualisation",
  "data viz": "data visualisation",
  "machine learning": "machine learning",
  ml: "machine learning",
  "artificial intelligence": "machine learning",
  js: "javascript",
  ts: "typescript",
  "react.js": "react",
  reactjs: "react",
  "node.js": "node",
  nodejs: "node",
  "amazon web services": "aws",
  gcp: "google cloud",
  "version control": "git",
  github: "git",
  "stakeholder engagement": "stakeholder management",
  "communication skills": "communication",
  "verbal communication": "communication",
  "written communication": "communication",
  "problem solving": "problem solving",
  "team leadership": "leadership",
  "people leadership": "leadership",
  "people management": "leadership",
  "project management": "project management",
  "agile methodologies": "agile",
  scrum: "agile",
  "customer service": "customer service",
  "data analysis": "data analysis",
  analytics: "data analysis",
  "data analytics": "data analysis",
  "google analytics": "data analysis",
  sem: "digital marketing",
  seo: "digital marketing",
  "seo strategy": "digital marketing",
  "search engine optimisation": "digital marketing",
  "content marketing": "digital marketing",
};

const canonical = (raw: string) => {
  const cleaned = raw
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9+#. ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ALIASES[cleaned] ?? cleaned;
};

const tokens = (raw: string) =>
  canonical(raw)
    .split(" ")
    .filter((t) => t.length > 2 && !STOP.has(t));

/** 1 = the candidate clearly has it, 0.5-0.9 = closely related, 0 = absent. */
function skillStrength(requirement: string, candidateSkills: string[]): number {
  const reqCanon = canonical(requirement);
  const reqTokens = tokens(requirement);
  let best = 0;

  for (const skill of candidateSkills) {
    const canon = canonical(skill);
    if (!canon) continue;
    if (canon === reqCanon) return 1;
    if (reqCanon.includes(canon) || canon.includes(reqCanon)) {
      best = Math.max(best, 0.85);
      continue;
    }
    const skillTokens = tokens(skill);
    if (!reqTokens.length || !skillTokens.length) continue;
    const shared = reqTokens.filter((t) => skillTokens.includes(t)).length;
    if (shared) {
      const overlap = shared / Math.max(reqTokens.length, skillTokens.length);
      best = Math.max(best, Math.min(0.8, 0.45 + overlap * 0.45));
    }
  }
  return best;
}

const HAVE_THRESHOLD = 0.8;
const PARTIAL_THRESHOLD = 0.45;

/**
 * Candidate-to-job matching. Every number below is computed from the job's
 * actual stated requirements and the candidate's own profile — nothing is
 * randomised or pre-baked.
 */
export function matchJob(job: Job, candidate: CandidateLike): MatchResult {
  const skills = candidate.skills.filter(Boolean);

  const score1 = (list: string[]) =>
    list.map((s) => ({ skill: s, strength: skillStrength(s, skills) }));

  const reqScored = score1(job.required);
  const prefScored = score1(job.preferred);

  const matchedReq = reqScored.filter((r) => r.strength >= HAVE_THRESHOLD);
  const partialReq = reqScored.filter(
    (r) => r.strength >= PARTIAL_THRESHOLD && r.strength < HAVE_THRESHOLD,
  );
  const missingReq = reqScored.filter((r) => r.strength < PARTIAL_THRESHOLD);
  const matchedPref = prefScored.filter((r) => r.strength >= HAVE_THRESHOLD);
  const missingPref = prefScored.filter((r) => r.strength < HAVE_THRESHOLD);

  // Coverage weights every requirement by how well it is actually covered.
  const reqScore = job.required.length
    ? reqScored.reduce((sum, r) => sum + r.strength, 0) / job.required.length
    : 0.7;
  const prefScore = job.preferred.length
    ? prefScored.reduce((sum, r) => sum + r.strength, 0) / job.preferred.length
    : reqScore;

  const experienceGap = Math.max(
    0,
    job.yearsPreferred - candidate.yearsExperience,
  );
  const surplus = Math.max(0, candidate.yearsExperience - job.yearsPreferred);
  const expScore =
    job.yearsPreferred === 0
      ? 1
      : Math.max(0, 1 - experienceGap * 0.18 - Math.max(0, surplus - 4) * 0.05);

  const industryScore = candidate.preferredIndustries?.length
    ? candidate.preferredIndustries.includes(job.industry)
      ? 1
      : 0.4
    : 0.7;

  const raw =
    reqScore * 0.6 + prefScore * 0.17 + expScore * 0.16 + industryScore * 0.07;
  const score = Math.max(3, Math.min(99, Math.round(raw * 100)));

  return {
    score,
    tier: tierFor(score),
    matched: [...matchedReq, ...matchedPref].map((r) => r.skill),
    partial: partialReq.map((r) => r.skill),
    missing: missingReq.map((r) => r.skill),
    missingPreferred: missingPref.map((r) => r.skill),
    experienceGap,
  };
}

export interface GapSkill {
  skill: string;
  jobsAlmostMatched: number;
  jobsTotal: number;
  currentStrong: number;
  projectedStrong: number;
  unlockedJobIds: string[];
  topSuburbs: string[];
  industries: string[];
}

export function analyseGaps(
  jobs: Job[],
  candidate: CandidateLike,
  limit = 6,
): { strongCount: number; potentialCount: number; gaps: GapSkill[] } {
  const results = jobs.map((j) => ({ job: j, match: matchJob(j, candidate) }));
  const strongCount = results.filter((r) => r.match.tier === "strong").length;
  const potentialCount = results.filter(
    (r) => r.match.tier === "potential",
  ).length;

  const counts = new Map<string, number>();
  for (const r of results) {
    if (r.match.tier === "strong") continue;
    for (const s of [...r.match.missing, ...r.match.missingPreferred]) {
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  }

  const gaps: GapSkill[] = [...counts.entries()]
    .map(([skill, jobsTotal]) => {
      const withSkill: CandidateLike = {
        ...candidate,
        skills: [...candidate.skills, skill],
      };
      const after = jobs.map((j) => ({
        job: j,
        match: matchJob(j, withSkill),
      }));
      const projectedStrong = after.filter(
        (r) => r.match.tier === "strong",
      ).length;
      const unlocked = after.filter((r, i) => {
        return r.match.tier === "strong" && results[i]!.match.tier !== "strong";
      });
      const suburbs = new Map<string, number>();
      const industries = new Set<string>();
      for (const u of unlocked) {
        suburbs.set(u.job.suburb, (suburbs.get(u.job.suburb) ?? 0) + 1);
        industries.add(u.job.industry);
      }
      return {
        skill,
        jobsTotal,
        jobsAlmostMatched: results.filter(
          (r) =>
            r.match.tier !== "strong" &&
            r.match.score >= 45 &&
            [...r.match.missing, ...r.match.missingPreferred].includes(skill),
        ).length,
        currentStrong: strongCount,
        projectedStrong,
        unlockedJobIds: unlocked.map((u) => u.job.id),
        topSuburbs: [...suburbs.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([s]) => s),
        industries: [...industries].slice(0, 4),
      };
    })
    .sort(
      (a, b) =>
        b.projectedStrong - a.projectedStrong || b.jobsTotal - a.jobsTotal,
    )
    .slice(0, limit);

  return { strongCount, potentialCount, gaps };
}

export const formatSalary = (
  min: number,
  max: number,
  period: "year" | "hour" = "year",
) => {
  if (period === "hour") {
    const fmt = (n: number) => `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
    return `${fmt(min)}–${fmt(max)}/hr AUD`;
  }
  return `$${(min / 1000).toFixed(0)},000–$${(max / 1000).toFixed(0)},000 AUD`;
};
