export type JobType =
  "Full-time" | "Part-time" | "Casual" | "Contract" | "Internship" | "Graduate";
export type Arrangement = "On-site" | "Hybrid" | "Remote";
export type ExperienceLevel =
  "No experience" | "Entry level" | "Junior" | "Mid-level" | "Senior";

export interface Job {
  id: string;
  title: string;
  company: string;
  industry: string;
  suburb: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  salaryMin: number;
  salaryMax: number;
  jobType: JobType;
  arrangement: Arrangement;
  experience: ExperienceLevel;
  yearsPreferred: number;
  postedDaysAgo: number;
  companySize: "Startup" | "Small" | "Medium" | "Large";
  required: string[];
  preferred: string[];
  description: string;
  /** "employer" jobs are real, persisted rows a signed-in employer posted and
   * can receive verified applications for. "seed" (the default, omitted) is
   * the static demo dataset below, with no real employer account behind it. */
  source?: "seed" | "employer";
  ownerId?: string;
}

import { GENERATED_JOBS } from "./jobs.generated";
import { isDemoReadyJob } from "@/lib/demo-jobs";

/** Curated subset used by the hackathon demo; the generated snapshot remains untouched. */
export const JOBS: Job[] = GENERATED_JOBS.filter(isDemoReadyJob);

export const CITIES: {
  name: string;
  state: string;
  lat: number;
  lng: number;
  zoom: number;
}[] = [
  { name: "Brisbane", state: "QLD", lat: -27.4698, lng: 153.0251, zoom: 11.4 },
  { name: "Sydney", state: "NSW", lat: -33.8688, lng: 151.2093, zoom: 11.2 },
  { name: "Melbourne", state: "VIC", lat: -37.8136, lng: 144.9631, zoom: 11.2 },
  { name: "Perth", state: "WA", lat: -31.9523, lng: 115.8613, zoom: 11.4 },
  { name: "Adelaide", state: "SA", lat: -34.9285, lng: 138.6007, zoom: 11.6 },
  { name: "Canberra", state: "ACT", lat: -35.2809, lng: 149.13, zoom: 11.6 },
  {
    name: "Gold Coast",
    state: "QLD",
    lat: -27.9678,
    lng: 153.4009,
    zoom: 11.2,
  },
];

export const AUSTRALIA_VIEW = { lat: -27.5, lng: 137.5, zoom: 3.5 };

export const ALL_SKILLS = Array.from(
  new Set(JOBS.flatMap((j) => [...j.required, ...j.preferred])),
).sort();

export const ALL_INDUSTRIES = Array.from(
  new Set(JOBS.map((j) => j.industry)),
).sort();
