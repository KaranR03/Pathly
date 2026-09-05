/**
 * Server-only CV text extraction. Runs in the Worker runtime, so everything
 * here is pure JavaScript — no native binaries, no filesystem.
 */
import { unzipSync, strFromU8 } from "fflate";

const decoder = new TextDecoder();

function fromDocx(bytes: Uint8Array): string {
  const files = unzipSync(bytes, { filter: (f) => f.name === "word/document.xml" });
  const xml = files["word/document.xml"];
  if (!xml) throw new Error("This .docx file has no readable document body.");
  return strFromU8(xml)
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

async function fromPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? (text as string[]).join("\n") : (text as string);

}

export async function extractCvText(fileName: string, bytes: Uint8Array): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  let text: string;
  if (ext === "pdf") text = await fromPdf(bytes);
  else if (ext === "docx") text = fromDocx(bytes);
  else if (ext === "txt" || ext === "md" || ext === "rtf") text = decoder.decode(bytes);
  else if (ext === "doc")
    throw new Error("Legacy .doc files aren't supported — please upload a PDF or .docx.");
  else throw new Error("Unsupported file type. Upload a PDF, .docx, .txt or .md CV.");

  const cleaned = text.replace(/\u0000/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length < 80) {
    throw new Error(
      "We couldn't read any text from that file — it may be a scanned image. Try a text-based PDF or .docx.",
    );
  }
  return cleaned.slice(0, 24000);
}
