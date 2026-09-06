import { CITIES } from "@/data/jobs";
import type { Filters } from "@/lib/pathly-store";

export interface NlResult {
  patch: Partial<Filters>;
  explanation: string;
  simulateSkill?: string | undefined;
}

const SKILL_WORDS = [
  "Power BI",
  "Tableau",
  "AWS",
  "Python",
  "SQL",
  "Excel",
  "React",
  "Machine Learning",
  "Git",
  "TypeScript",
  "JavaScript",
];

/**
 * Mock natural-language query understanding. Replace with an AI call later:
 * same contract — a sentence in, a filter patch + explanation out.
 */
export function interpretQuery(input: string): NlResult {
  const q = input.trim();
  const lower = q.toLowerCase();
  const patch: Partial<Filters> = {};
  const notes: string[] = [];

  const city = CITIES.find((c) => lower.includes(c.name.toLowerCase()));
  if (city) {
    patch.city = city.name;
    notes.push(`around ${city.name}`);
  }
  if (lower.includes("qut") || lower.includes("uq") || lower.includes("griffith")) {
    patch.city = "Brisbane";
    notes.push("near Brisbane campuses");
  }

  if (/entry.level|graduate|no experience|student/.test(lower)) {
    patch.experience = ["No experience", "Entry level"];
    notes.push("entry level");
  }
  if (/intern/.test(lower)) {
    patch.jobTypes = ["Internship"];
    notes.push("internships");
  }
  if (/part.time/.test(lower)) {
    patch.jobTypes = ["Part-time"];
    notes.push("part-time");
  }
  if (/remote/.test(lower)) {
    patch.arrangements = ["Remote"];
    notes.push("remote");
  }
  if (/hybrid/.test(lower)) {
    patch.arrangements = ["Hybrid"];
    notes.push("hybrid");
  }
  if (/strong match|already.*match|good match/.test(lower)) {
    patch.tiers = ["strong"];
    notes.push("strong matches only");
  }

  const learn = /learning ([a-z .+]+?) (would|could)/.exec(lower) ?? /learn ([a-z .+]+)/.exec(lower);
  let simulateSkill: string | undefined;
  if (learn) {
    const target = SKILL_WORDS.find((s) => learn[1]!.includes(s.toLowerCase()));
    if (target) {
      simulateSkill = target;
      notes.push(`simulating ${target}`);
    }
  }

  // Keyword part: strip filter language so the text query stays useful.
  const keyword = q
    .replace(
      /show me|show|find|jobs?|near|around|within \d+ \w+ of|entry.level|graduate|remote|hybrid|part.time|internships?|where my skills are already a strong match|would make me competitive|learning|learn|my|me|the|in|of/gi,
      " ",
    )
    .replace(new RegExp(CITIES.map((c) => c.name).join("|"), "gi"), " ")
    .replace(/\b(qut|uq|griffith)\b/gi, " ")
    .replace(/[.?,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const roleWords = keyword
    .split(" ")
    .filter((w) => w.length > 2 && !SKILL_WORDS.some((s) => s.toLowerCase() === w.toLowerCase()));
  patch.query = roleWords.slice(0, 3).join(" ");
  if (patch.query) notes.unshift(`"${patch.query}"`);

  return {
    patch,
    simulateSkill,
    explanation: notes.length ? `Showing ${notes.join(" · ")}` : "Showing all opportunities",
  };
}

export const SAMPLE_QUERIES = [
  "Show me entry-level data jobs near Brisbane CBD",
  "Show jobs within 30 minutes of QUT",
  "Find software jobs where my skills are already a strong match",
  "Show me jobs where learning AWS would make me competitive",
];
