import type { ExperienceLevel, JobType } from "@/data/jobs";

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

export function createProfileForAccessMode(mode: ProfileAccessMode): Profile {
  const source = mode === "guest" ? DEMO_PROFILE : EMPTY_PROFILE;
  return {
    ...source,
    preferredIndustries: [...source.preferredIndustries],
    preferredJobTypes: [...source.preferredJobTypes],
    skills: [...source.skills],
  };
}
