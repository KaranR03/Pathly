/**
 * Structured résumé/CV extraction, shared by the profile CV-upload flow
 * (cv.functions.ts) and the job-application flow (applications.functions.ts).
 */
import { z } from "zod";
import { callAI } from "./ai-gateway.server";

export interface ParsedCv {
  name: string | null;
  location: string | null;
  careerGoal: string | null;
  experienceLevel:
    "No experience" | "Entry level" | "Junior" | "Mid-level" | "Senior" | null;
  yearsExperience: number | null;
  skills: string[];
  industries: string[];
  summary: string | null;
}

const AiSchema = z.object({
  name: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  careerGoal: z.string().nullable().optional(),
  experienceLevel: z
    .enum(["No experience", "Entry level", "Junior", "Mid-level", "Senior"])
    .nullable()
    .optional(),
  yearsExperience: z.number().nullable().optional(),
  skills: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  summary: z.string().nullable().optional(),
});

const SYSTEM = `You extract structured career data from an Australian job seeker's CV.
Rules:
- "name" is the candidate's full name exactly as written on the CV (usually the first line or in a header/contact block), else null. Never invent a name.
- "skills" are concrete, canonical skill names actually evidenced in the CV (tools, technologies, methods, licences, soft skills). 8-20 items, Title case, no duplicates, no sentences.
- "yearsExperience" is total relevant professional experience in years (0 if student/graduate with no professional roles). Integer or one decimal.
- "experienceLevel" is one of: No experience, Entry level, Junior, Mid-level, Senior.
- "careerGoal" is the role they are targeting next (e.g. "Data Analyst").
- "location" is an Australian city/state if stated (e.g. "Brisbane QLD"), else null.
- "industries" are 1-3 industries they fit (e.g. Technology, Banking, Healthcare, Government, Retail).
- Never invent skills that are not supported by the CV text.
Respond with JSON only.`;

export async function extractResumeProfile(
  fileName: string,
  text: string,
): Promise<ParsedCv> {
  const content = await callAI(SYSTEM, `CV file: ${fileName}\n\n${text}`);
  const parsed = AiSchema.parse(JSON.parse(content));

  const skills = Array.from(
    new Map(
      parsed.skills
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 48)
        .map((s) => [s.toLowerCase(), s]),
    ).values(),
  ).slice(0, 20);

  return {
    name: parsed.name?.trim() || null,
    location: parsed.location?.trim() || null,
    careerGoal: parsed.careerGoal?.trim() || null,
    experienceLevel: parsed.experienceLevel ?? null,
    yearsExperience:
      parsed.yearsExperience == null
        ? null
        : Math.max(
            0,
            Math.min(45, Math.round(parsed.yearsExperience * 10) / 10),
          ),
    skills,
    industries: parsed.industries
      .map((i) => i.trim())
      .filter(Boolean)
      .slice(0, 3),
    summary: parsed.summary?.trim() || null,
  };
}
