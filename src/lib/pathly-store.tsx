import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { JOBS, type Arrangement, type ExperienceLevel, type Job, type JobType } from "@/data/jobs";
import { analyseGaps, matchJob, type MatchResult } from "@/lib/matching";
import type { ParsedCv } from "@/lib/cv.functions";

export type AppStage = "Saved" | "Applied" | "Interview" | "Offer" | "Rejected";

export interface Application {
  jobId: string;
  stage: AppStage;
  date: string;
}

export interface Profile {
  name: string;
  location: string;
  careerGoal: string;
  experienceLevel: ExperienceLevel;
  yearsExperience: number;
  preferredIndustries: string[];
  preferredJobTypes: JobType[];
  maxCommuteMinutes: number;
  skills: string[];
  resumeName: string | null;
}

export interface Filters {
  query: string;
  jobTypes: JobType[];
  arrangements: Arrangement[];
  experience: ExperienceLevel[];
  minSalary: number;
  industries: string[];
  skills: string[];
  companySizes: Job["companySize"][];
  tiers: ("strong" | "potential" | "gap")[];
  city: string | null;
}

export const EMPTY_FILTERS: Filters = {
  query: "",
  jobTypes: [],
  arrangements: [],
  experience: [],
  minSalary: 0,
  industries: [],
  skills: [],
  companySizes: [],
  tiers: [],
  city: null,
};

const DEMO_PROFILE: Profile = {
  name: "Alex Morgan",
  location: "Brisbane QLD",
  careerGoal: "Data Analyst",
  experienceLevel: "Junior",
  yearsExperience: 2,
  preferredIndustries: ["Technology", "Government", "Banking"],
  preferredJobTypes: ["Full-time", "Graduate"],
  maxCommuteMinutes: 45,
  skills: [
    "Python",
    "SQL",
    "Excel",
    "Data analysis",
    "Data Visualisation",
    "Power BI",
    "Statistical analysis",
    "Machine Learning",
    "Stakeholder management",
    "Communication",
    "Problem solving",
    "Git",
  ],
  resumeName: null,

};

interface Ctx {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  addSkill: (s: string) => void;
  removeSkill: (s: string) => void;
  applyParsedCv: (fileName: string, cv: ParsedCv) => string[];
  jobs: Job[];
  employerJobs: Job[];
  addEmployerJob: (job: Job) => void;
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  filteredJobs: Job[];
  matchFor: (job: Job) => MatchResult;
  simulatedSkill: string | null;
  setSimulatedSkill: (s: string | null) => void;
  unlockedJobIds: string[];
  savedJobIds: string[];
  toggleSaved: (jobId: string) => void;
  applications: Application[];
  setStage: (jobId: string, stage: AppStage) => void;
  removeApplication: (jobId: string) => void;
  recentlyViewed: string[];
  markViewed: (jobId: string) => void;
  gapAnalysis: ReturnType<typeof analyseGaps>;
  snapshot: PathlySnapshot;
  hydrate: (s: Partial<PathlySnapshot>) => void;
}

export interface PathlySnapshot {
  profile: Profile;
  savedJobIds: string[];
  applications: Application[];
  employerJobs: Job[];
  recentlyViewed: string[];
}

const PathlyContext = createContext<Ctx | null>(null);


export function PathlyProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEMO_PROFILE);
  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [filters, setFiltersState] = useState<Filters>(EMPTY_FILTERS);
  const [simulatedSkill, setSimulatedSkill] = useState<string | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  // Session persistence so a demo survives refreshes without a backend.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pathly-state");
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.profile) setProfile(s.profile);
      if (s.savedJobIds) setSavedJobIds(s.savedJobIds);
      if (s.applications) setApplications(s.applications);
      if (s.employerJobs) setEmployerJobs(s.employerJobs);
      if (s.recentlyViewed) setRecentlyViewed(s.recentlyViewed);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "pathly-state",
        JSON.stringify({ profile, savedJobIds, applications, employerJobs, recentlyViewed }),
      );
    } catch {
      /* ignore */
    }
  }, [profile, savedJobIds, applications, employerJobs, recentlyViewed]);

  const jobs = useMemo(() => [...employerJobs, ...JOBS], [employerJobs]);

  const effectiveSkills = useMemo(
    () => (simulatedSkill ? [...profile.skills, simulatedSkill] : profile.skills),
    [profile.skills, simulatedSkill],
  );

  const candidate = useMemo(
    () => ({
      skills: effectiveSkills,
      yearsExperience: profile.yearsExperience,
      preferredIndustries: profile.preferredIndustries,
    }),
    [effectiveSkills, profile.yearsExperience, profile.preferredIndustries],
  );

  const baseCandidate = useMemo(
    () => ({
      skills: profile.skills,
      yearsExperience: profile.yearsExperience,
      preferredIndustries: profile.preferredIndustries,
    }),
    [profile.skills, profile.yearsExperience, profile.preferredIndustries],
  );

  const matchFor = useCallback((job: Job) => matchJob(job, candidate), [candidate]);

  const unlockedJobIds = useMemo(() => {
    if (!simulatedSkill) return [];
    return jobs
      .filter(
        (j) =>
          matchJob(j, candidate).tier === "strong" && matchJob(j, baseCandidate).tier !== "strong",
      )
      .map((j) => j.id);
  }, [simulatedSkill, jobs, candidate, baseCandidate]);

  const filteredJobs = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (
        q &&
        ![j.title, j.company, j.suburb, j.city, j.industry, ...j.required, ...j.preferred]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (filters.city && j.city !== filters.city) return false;
      if (filters.jobTypes.length && !filters.jobTypes.includes(j.jobType)) return false;
      if (filters.arrangements.length && !filters.arrangements.includes(j.arrangement)) return false;
      if (filters.experience.length && !filters.experience.includes(j.experience)) return false;
      if (filters.minSalary && j.salaryMax < filters.minSalary) return false;
      if (filters.industries.length && !filters.industries.includes(j.industry)) return false;
      if (filters.companySizes.length && !filters.companySizes.includes(j.companySize)) return false;
      if (
        filters.skills.length &&
        !filters.skills.every((s) => [...j.required, ...j.preferred].includes(s))
      )
        return false;
      if (filters.tiers.length && !filters.tiers.includes(matchJob(j, candidate).tier)) return false;
      return true;
    });
  }, [jobs, filters, candidate]);

  const gapAnalysis = useMemo(
    () =>
      analyseGaps(
        filters.city ? jobs.filter((j) => j.city === filters.city) : jobs,
        baseCandidate,
        6,
      ),
    [jobs, filters.city, baseCandidate],
  );

  const value: Ctx = {
    profile,
    updateProfile: (patch) => setProfile((p) => ({ ...p, ...patch })),
    addSkill: (s) =>
      setProfile((p) =>
        p.skills.some((x) => x.toLowerCase() === s.toLowerCase())
          ? p
          : { ...p, skills: [...p.skills, s] },
      ),
    removeSkill: (s) => setProfile((p) => ({ ...p, skills: p.skills.filter((x) => x !== s) })),
    applyParsedCv: (fileName, cv) => {
      setProfile((p) => ({
        ...p,
        resumeName: fileName,
        // The CV is the source of truth: parsed skills replace the placeholder set.
        skills: cv.skills.length ? cv.skills : p.skills,
        name: cv.name ?? p.name,
        location: cv.location ?? p.location,
        careerGoal: cv.careerGoal ?? p.careerGoal,
        experienceLevel: cv.experienceLevel ?? p.experienceLevel,
        yearsExperience: cv.yearsExperience ?? p.yearsExperience,
        preferredIndustries: cv.industries.length ? cv.industries : p.preferredIndustries,
      }));
      return cv.skills;
    },

    jobs,
    employerJobs,
    addEmployerJob: (job) => setEmployerJobs((e) => [job, ...e]),
    filters,
    setFilters: (patch) => setFiltersState((f) => ({ ...f, ...patch })),
    resetFilters: () => setFiltersState(EMPTY_FILTERS),
    filteredJobs,
    matchFor,
    simulatedSkill,
    setSimulatedSkill,
    unlockedJobIds,
    savedJobIds,
    toggleSaved: (jobId) =>
      setSavedJobIds((s) => (s.includes(jobId) ? s.filter((x) => x !== jobId) : [...s, jobId])),
    applications,
    setStage: (jobId, stage) =>
      setApplications((a) => {
        const existing = a.find((x) => x.jobId === jobId);
        if (existing)
          return a.map((x) => (x.jobId === jobId ? { ...x, stage, date: x.date } : x));
        return [
          ...a,
          { jobId, stage, date: new Date().toISOString().slice(0, 10) },
        ];
      }),
    removeApplication: (jobId) => setApplications((a) => a.filter((x) => x.jobId !== jobId)),
    recentlyViewed,
    markViewed: (jobId) =>
      setRecentlyViewed((r) => [jobId, ...r.filter((x) => x !== jobId)].slice(0, 8)),
    gapAnalysis,
    snapshot: { profile, savedJobIds, applications, employerJobs, recentlyViewed },
    hydrate: (s) => {
      if (s.profile) setProfile(s.profile);
      if (s.savedJobIds) setSavedJobIds(s.savedJobIds);
      if (s.applications) setApplications(s.applications);
      if (s.employerJobs) setEmployerJobs(s.employerJobs);
      if (s.recentlyViewed) setRecentlyViewed(s.recentlyViewed);
    },
  };

  return <PathlyContext.Provider value={value}>{children}</PathlyContext.Provider>;
}

export function usePathly() {
  const ctx = useContext(PathlyContext);
  if (!ctx) throw new Error("usePathly must be used inside PathlyProvider");
  return ctx;
}
