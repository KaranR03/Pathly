import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  fileName: z.string().min(1),
  /** base64 (no data: prefix) contents of the uploaded CV. */
  content: z.string().min(1).max(12_000_000),
});

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

function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64.replace(/^data:[^;]+;base64,/, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Lovable Cloud injects LOVABLE_API_KEY automatically; it isn't exportable,
// so it's never available outside Lovable's own hosting. GEMINI_API_KEY is a
// free key from https://aistudio.google.com/apikey, for running the CV
// parser (and everything else) from a plain local `bun dev`.
async function callLovableGateway(
  key: string,
  userContent: string,
): Promise<string> {
  const res = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    },
  );

  if (res.status === 429)
    throw new Error("AI is busy right now — please try again in a moment.");
  if (res.status === 402)
    throw new Error(
      "This workspace is out of AI credits. Add credits to keep analysing CVs.",
    );
  if (res.status === 403)
    throw new Error(
      "AI access is blocked for this workspace, so CV analysis is unavailable.",
    );
  if (!res.ok)
    throw new Error("We couldn't analyse that CV. Please try again.");

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content)
    throw new Error("The CV analysis came back empty. Please try again.");
  return content;
}

async function callGeminiDirect(
  key: string,
  userContent: string,
): Promise<string> {
  const model = process.env["GEMINI_MODEL"] || "gemini-3.6-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  if (res.status === 429)
    throw new Error("AI is busy right now — please try again in a moment.");
  if (res.status === 403)
    throw new Error("The Gemini API key is invalid or restricted.");
  if (!res.ok)
    throw new Error("We couldn't analyse that CV. Please try again.");

  const payload = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content)
    throw new Error("The CV analysis came back empty. Please try again.");
  return content;
}

export const parseCv = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<ParsedCv> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const geminiKey = process.env["GEMINI_API_KEY"];
    if (!lovableKey && !geminiKey) {
      throw new Error(
        "AI is not configured for this project. Set LOVABLE_API_KEY (inside Lovable) or GEMINI_API_KEY (local dev) in your environment.",
      );
    }

    const { extractCvText } = await import("./cv-parser.server");
    const text = await extractCvText(data.fileName, decodeBase64(data.content));
    const userContent = `CV file: ${data.fileName}\n\n${text}`;

    const content = lovableKey
      ? await callLovableGateway(lovableKey, userContent)
      : await callGeminiDirect(geminiKey!, userContent);

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
  });
