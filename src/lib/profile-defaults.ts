import type { ExperienceLevel, JobType } from "@/data/jobs";

export type AccountType = "seeker" | "employer";

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
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  onboardingCompleted: boolean;
  /** Chosen on first onboarding step. Employers skip the CV-driven steps and
   * are asked about their company instead. */
  accountType: AccountType;
  companyName: string | null;
  companyBlurb: string | null;
}

export type ProfileAccessMode = "anonymous" | "guest" | "member";

export const EMPTY_PROFILE: Profile = {
  name: "",
  location: "",
  careerGoal: "",
  experienceLevel: "No experience",
  yearsExperience: 0,
  preferredIndustries: [],
  preferredJobTypes: [],
  maxCommuteMinutes: 45,
  skills: [],
  resumeName: null,
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  onboardingCompleted: false,
  accountType: "seeker",
  companyName: null,
  companyBlurb: null,
};

export const DEMO_PROFILE: Profile = {
  name: "Alex Morgan",
  location: "Brisbane QLD",
  careerGoal: "Data Analyst",
  experienceLevel: "Junior",
  yearsExperience: 2,
  preferredIndustries: ["Technology", "Government", "Banking"],
  preferredJobTypes: ["Full-time", "Graduate"],
  maxCommuteMinutes: 45,
  skills: [],
  resumeName: null,
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  onboardingCompleted: true,
  accountType: "seeker",
  companyName: null,
  companyBlurb: null,
};

export function createProfileForAccessMode(mode: ProfileAccessMode): Profile {
  const source = mode === "guest" ? DEMO_PROFILE : EMPTY_PROFILE;
  return {
    ...source,
    preferredIndustries: [...source.preferredIndustries],
    preferredJobTypes: [...source.preferredJobTypes],
    skills: [...source.skills],
  };
}
