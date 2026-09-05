/**
 * Enriches the real scraped job listings with genuine role requirements
 * (required skills, nice-to-have skills, years of experience) using the
 * Lovable AI gateway, then rewrites src/data/jobs.generated.ts in place.
 *
 * Run with: LOVABLE_API_KEY=... bun run scripts/enrich-job-skills.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { GENERATED_JOBS } from "../src/data/jobs.generated";
import type { Job } from "../src/data/jobs";

const KEY = process.env["LOVABLE_API_KEY"];
if (!KEY) throw new Error("LOVABLE_API_KEY is required");

const FILE = "src/data/jobs.generated.ts";
const BATCH = 8;

interface Enriched {
  id: string;
  required: string[];
  preferred: string[];
  yearsPreferred: number;
  description: string;
}

async function enrich(batch: Job[]): Promise<Enriched[]> {
  const payload = batch.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    industry: j.industry,
    experience: j.experience,
    city: j.city,
  }));

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are an Australian labour-market analyst. For each job listing, infer the concrete skills an employer would actually require. " +
            "Return 4-7 `required` skills (hard requirements) and 2-4 `preferred` skills (nice to have). " +
            "Use short canonical skill names (e.g. 'SQL', 'Stakeholder management', 'Python', 'Salesforce', 'Registered Nurse (AHPRA)'). " +
            "Also give realistic `yearsPreferred` (0-10) and a specific 2-sentence `description` of the role. " +
            "Respond with JSON only: {\"jobs\":[{\"id\":string,\"required\":string[],\"preferred\":string[],\"yearsPreferred\":number,\"description\":string}]}",
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  const parsed = JSON.parse(data.choices[0]!.message.content) as { jobs: Enriched[] };
  return parsed.jobs;
}

const map = new Map<string, Enriched>();
for (let i = 0; i < GENERATED_JOBS.length; i += BATCH) {
  const batch = GENERATED_JOBS.slice(i, i + BATCH);
  process.stdout.write(`batch ${i / BATCH + 1} (${batch.length} jobs)... `);
  const out = await enrich(batch);
  for (const e of out) map.set(e.id, e);
  console.log("ok");
}

const enrichedJobs: Job[] = GENERATED_JOBS.map((j) => {
  const e = map.get(j.id);
  if (!e) return j;
  return {
    ...j,
    required: e.required.slice(0, 7),
    preferred: e.preferred.slice(0, 4),
    yearsPreferred: Math.max(0, Math.min(10, Math.round(e.yearsPreferred))),
    description: e.description.trim() || j.description,
  };
});

const header = readFileSync(FILE, "utf8").split("export const GENERATED_JOBS")[0]!;
writeFileSync(
  FILE,
  `${header}export const GENERATED_JOBS: Job[] = ${JSON.stringify(enrichedJobs, null, 2)};\n`,
);
console.log(`wrote ${enrichedJobs.length} enriched jobs`);
