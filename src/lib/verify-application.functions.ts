import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ParsedCv } from "./resume-profile.server";
import type { GithubEvidence } from "./github-evidence.server";

const Input = z.object({
  fileName: z.string().min(1),
  /** base64 (no data: prefix) contents of the uploaded résumé. */
  content: z.string().min(1).max(12_000_000),
  githubUsername: z.string().trim().max(80).optional(),
  linkedinText: z.string().trim().max(4000).optional(),
  jobTitle: z.string().min(1),
  requiredSkills: z.array(z.string()).max(40),
  preferredSkills: z.array(z.string()).max(40),
});

export interface VerificationResult {
  verifiedSkills: string[];
  unverifiedSkills: string[];
  contradictions: { skill: string; note: string }[];
  authenticityScore: number;
  summary: string;
}

export interface VerifyApplicationResult {
  resumeProfile: ParsedCv;
  githubEvidence: GithubEvidence | null;
  verification: VerificationResult;
}

const VerificationSchema = z.object({
  verifiedSkills: z.array(z.string()).default([]),
  unverifiedSkills: z.array(z.string()).default([]),
  contradictions: z
    .array(z.object({ skill: z.string(), note: z.string() }))
    .default([]),
  authenticityScore: z.number().min(0).max(100),
  summary: z.string(),
});

const SYSTEM = `You are an applicant-verification assistant for a job platform. You are given:
- A job title and its required/preferred skills.
- Skills and text extracted from a candidate's résumé.
- Evidence of the candidate's public GitHub activity (languages used, repo topics/descriptions), if provided.
- Text the candidate pasted from their own LinkedIn "About"/"Skills" section, if provided.

Your job is to judge whether the résumé's claimed skills are actually backed up by the
candidate's public online presence — a common problem is people adding keywords to a
résumé for a specific job application that don't appear anywhere else about them.

Rules:
- Only flag a résumé skill as a "contradiction" if it is a specific, verifiable technical
  skill/tool (e.g. a programming language, framework, or platform) that a genuinely
  experienced practitioner would normally leave some public trace of (in GitHub repos or
  their own LinkedIn text), AND there is no such trace in the evidence given.
- Never flag soft skills (communication, teamwork, leadership, stakeholder management,
  problem solving, etc.) as contradictions — they can't be verified this way. Put these in
  "unverifiedSkills" at most, never "contradictions".
- If no GitHub username or LinkedIn text was provided at all, do not invent
  contradictions — say so in the summary and keep authenticityScore capped at 65 to
  reflect the missing evidence, but do not penalise skills that are simply unverifiable
  due to lack of evidence versus outright contradicted by it.
- "verifiedSkills" are résumé skills clearly corroborated by GitHub languages/topics/repo
  content or the LinkedIn text.
- "authenticityScore" (0-100): how well the overall online presence corroborates the
  résumé's claims relevant to this job's required/preferred skills.
- "summary" is 1-2 plain-English sentences for an employer skimming applicants.
Respond with JSON only, matching: { verifiedSkills: string[], unverifiedSkills: string[], contradictions: {skill: string, note: string}[], authenticityScore: number, summary: string }`;

function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64.replace(/^data:[^;]+;base64,/, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const verifyApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<VerifyApplicationResult> => {
    const { extractCvText } = await import("./cv-parser.server");
    const { extractResumeProfile } = await import("./resume-profile.server");
    const { fetchGithubEvidence } = await import("./github-evidence.server");
    const { callAI } = await import("./ai-gateway.server");

    const text = await extractCvText(data.fileName, decodeBase64(data.content));
    const resumeProfile = await extractResumeProfile(data.fileName, text);

    const githubEvidence = data.githubUsername
      ? await fetchGithubEvidence(data.githubUsername)
      : null;

    const userPrompt = `Job: ${data.jobTitle}
Required skills: ${data.requiredSkills.join(", ") || "none listed"}
Preferred skills: ${data.preferredSkills.join(", ") || "none listed"}

Résumé-claimed skills: ${resumeProfile.skills.join(", ") || "none extracted"}
Résumé excerpt:
${text.slice(0, 4000)}

GitHub evidence: ${
      githubEvidence?.found
        ? `found user "${githubEvidence.username}" with ${githubEvidence.publicRepos} public repos.
Languages used: ${githubEvidence.languages.join(", ") || "none detected"}.
Repo topics: ${githubEvidence.topics.join(", ") || "none"}.
Notable repos: ${githubEvidence.repoSummaries.join(" | ") || "none"}.
Bio: ${githubEvidence.bio ?? "none"}`
        : data.githubUsername
          ? `no public GitHub profile found for "${data.githubUsername}"`
          : "not provided"
    }

LinkedIn About/Skills text pasted by candidate: ${data.linkedinText?.trim() || "not provided"}`;

    const content = await callAI(SYSTEM, userPrompt);
    const verification = VerificationSchema.parse(JSON.parse(content));

    return { resumeProfile, githubEvidence, verification };
  });
