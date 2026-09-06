/**
 * Shared helper for calling an AI model for structured (JSON) extraction
 * tasks. Server-only. Four providers are supported so this works whether
 * the project is running through Lovable Cloud (LOVABLE_API_KEY, set
 * automatically there) or fully independently (OPENAI_API_KEY /
 * ANTHROPIC_API_KEY / GEMINI_API_KEY, for local dev outside Lovable — a free
 * Gemini key is available from https://aistudio.google.com/apikey).
 * Preference order: OpenAI, Anthropic, Gemini, then the Lovable gateway.
 */

/** Strips a ```json ... ``` fence if the model wrapped its output in one. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1]!.trim() : trimmed;
}

async function callOpenAI(
  system: string,
  user: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429)
    throw new Error("AI is busy right now — please try again in a moment.");
  if (res.status === 401 || res.status === 403)
    throw new Error(
      "AI access is blocked — check that OPENAI_API_KEY is valid.",
    );
  if (!res.ok) throw new Error("The AI request failed. Please try again.");

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content)
    throw new Error("The AI response came back empty. Please try again.");
  return stripCodeFence(content);
}

async function callAnthropic(
  system: string,
  user: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (res.status === 429)
    throw new Error("AI is busy right now — please try again in a moment.");
  if (res.status === 401 || res.status === 403)
    throw new Error(
      "AI access is blocked — check that ANTHROPIC_API_KEY is valid.",
    );
  if (!res.ok) throw new Error("The AI request failed. Please try again.");

  const payload = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const content = payload.content?.find((c) => c.type === "text")?.text;
  if (!content)
    throw new Error("The AI response came back empty. Please try again.");
  return stripCodeFence(content);
}

async function callGemini(
  system: string,
  user: string,
  apiKey: string,
): Promise<string> {
  const model = process.env["GEMINI_MODEL"] || "gemini-3.6-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  if (res.status === 429)
    throw new Error("AI is busy right now — please try again in a moment.");
  if (res.status === 403)
    throw new Error("The Gemini API key is invalid or restricted.");
  if (!res.ok) throw new Error("The AI request failed. Please try again.");

  const payload = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content)
    throw new Error("The AI response came back empty. Please try again.");
  return stripCodeFence(content);
}

async function callLovableGateway(
  system: string,
  user: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    },
  );

  if (res.status === 429)
    throw new Error("AI is busy right now — please try again in a moment.");
  if (res.status === 402)
    throw new Error(
      "This workspace is out of AI credits. Add credits to keep using AI features.",
    );
  if (res.status === 403)
    throw new Error(
      "AI access is blocked for this workspace, so this feature is unavailable.",
    );
  if (!res.ok) throw new Error("The AI request failed. Please try again.");

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content)
    throw new Error("The AI response came back empty. Please try again.");
  return stripCodeFence(content);
}

export async function callAI(system: string, user: string): Promise<string> {
  const openaiKey = process.env["OPENAI_API_KEY"];
  if (openaiKey) return callOpenAI(system, user, openaiKey);

  const anthropicKey = process.env["ANTHROPIC_API_KEY"];
  if (anthropicKey) return callAnthropic(system, user, anthropicKey);

  const geminiKey = process.env["GEMINI_API_KEY"];
  if (geminiKey) return callGemini(system, user, geminiKey);

  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) return callLovableGateway(system, user, lovableKey);

  throw new Error(
    "AI is not configured for this project — set OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or LOVABLE_API_KEY (when running through Lovable Cloud).",
  );
}
