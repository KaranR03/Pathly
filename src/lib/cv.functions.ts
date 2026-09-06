import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ParsedCv } from "./resume-profile.server";

const Input = z.object({
  fileName: z.string().min(1),
  /** base64 (no data: prefix) contents of the uploaded CV. */
  content: z.string().min(1).max(12_000_000),
});

export type { ParsedCv };

function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64.replace(/^data:[^;]+;base64,/, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const parseCv = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<ParsedCv> => {
    const { extractCvText } = await import("./cv-parser.server");
    const { extractResumeProfile } = await import("./resume-profile.server");

    const text = await extractCvText(data.fileName, decodeBase64(data.content));
    return extractResumeProfile(data.fileName, text);
  });
