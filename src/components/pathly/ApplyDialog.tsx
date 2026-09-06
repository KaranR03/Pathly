import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, HelpCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Job } from "@/data/jobs";
import { matchJob } from "@/lib/matching";
import { useAuth } from "@/lib/auth";
import { usePathly } from "@/lib/pathly-store";
import { persistProfileNow } from "@/lib/persist-profile-now";
import { submitJobApplication } from "@/lib/employer-db";
import {
  verifyApplication,
  type VerifyApplicationResult,
} from "@/lib/verify-application.functions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

const authenticityTier = (score: number) =>
  score >= 75 ? "strong" : score >= 45 ? "potential" : "gap";

const tierStyles: Record<string, string> = {
  strong: "bg-strong-soft text-strong",
  potential: "bg-potential-soft text-potential",
  gap: "bg-gap-soft text-gap",
};

export function ApplyDialog({
  job,
  open,
  onOpenChange,
}: {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, isGuest, displayName } = useAuth();
  const { setStage, markViewed, snapshot } = usePathly();
  const verify = useServerFn(verifyApplication);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [githubUsername, setGithubUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<VerifyApplicationResult | null>(null);

  const reset = () => {
    setFileName(null);
    setFileContent(null);
    setGithubUsername("");
    setLinkedinUrl("");
    setLinkedinText("");
    setResult(null);
  };

  const handleFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("That file is too large", {
        description: "Please upload a résumé under 8 MB.",
      });
      return;
    }
    setFileName(file.name);
    setFileContent(await toBase64(file));
  };

  const submit = async () => {
    if (!user || !fileName || !fileContent) return;
    setSubmitting(true);
    try {
      const outcome = await verify({
        data: {
          fileName,
          content: fileContent,
          githubUsername: githubUsername.trim() || undefined,
          linkedinText: linkedinText.trim() || undefined,
          jobTitle: job.title,
          requiredSkills: job.required,
          preferredSkills: job.preferred,
        },
      });

      const { error } = await submitJobApplication({
        applicantId: user.id,
        applicantName: outcome.resumeProfile.name ?? displayName ?? "Applicant",
        jobId: job.id,
        resumeFileName: fileName,
        resumeSkills: outcome.resumeProfile.skills,
        resumeYearsExperience: outcome.resumeProfile.yearsExperience,
        githubUsername: githubUsername.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
        linkedinText: linkedinText.trim() || null,
        verification: outcome.verification,
      });

      if (error) {
        toast.error("Couldn't submit your application", { description: error });
        return;
      }

      setStage(job.id, "Applied");
      markViewed(job.id);

      // Guarantees the "Applied" card survives even if the user closes this
      // dialog and immediately navigates away, rather than waiting on the
      // store's 900ms debounced autosave (see persist-profile-now.ts).
      if (user && !isGuest) {
        const today = new Date().toISOString().slice(0, 10);
        const nextApplications = snapshot.applications.some(
          (a) => a.jobId === job.id,
        )
          ? snapshot.applications.map((a) =>
              a.jobId === job.id
                ? { ...a, stage: "Applied" as const, date: a.date }
                : a,
            )
          : [
              ...snapshot.applications,
              { jobId: job.id, stage: "Applied" as const, date: today },
            ];
        await persistProfileNow(user.id, {
          ...snapshot,
          applications: nextApplications,
        });
      }

      setResult(outcome);
      toast.success("Application submitted", {
        description: `${job.company} can now see your verified profile for this role.`,
      });
    } catch (err) {
      toast.error("Couldn't verify your application", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const missingForJob = result
    ? matchJob(job, {
        skills: result.resumeProfile.skills,
        yearsExperience: result.resumeProfile.yearsExperience ?? 0,
      })
    : null;
  const missingSkills = missingForJob
    ? [...missingForJob.missing, ...missingForJob.missingPreferred]
    : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Apply with verification</DialogTitle>
          <DialogDescription>
            {job.title} at {job.company}. We'll check that your résumé's claimed
            skills line up with your public GitHub and the LinkedIn text you
            paste below.
          </DialogDescription>
        </DialogHeader>

        {isGuest || !user ? (
          <div className="rounded-2xl bg-secondary/60 p-4 text-[13px] text-muted-foreground">
            Sign in to apply — verified applications are tied to your account so
            the employer knows who submitted them.
            <Button className="mt-3 w-full rounded-full" asChild>
              <Link to="/auth">Sign in / create account</Link>
            </Button>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div
              className={cn(
                "rounded-2xl p-4",
                tierStyles[
                  authenticityTier(result.verification.authenticityScore)
                ],
              )}
            >
              <p className="text-[13px] font-semibold">
                Authenticity score: {result.verification.authenticityScore}%
              </p>
              <p className="mt-1 text-[13px] opacity-90">
                {result.verification.summary}
              </p>
            </div>

            {result.verification.verifiedSkills.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-strong" /> Backed up by
                  your online presence
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.verification.verifiedSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-strong-soft px-2 py-0.5 text-[12px] text-strong"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.verification.contradictions.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <AlertTriangle className="size-3.5 text-gap" /> Not backed up
                  anywhere else
                </p>
                <ul className="space-y-1 text-[13px]">
                  {result.verification.contradictions.map((c) => (
                    <li key={c.skill}>
                      <span className="font-medium">{c.skill}</span> — {c.note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.verification.unverifiedSkills.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <HelpCircle className="size-3.5" /> Claimed, no public
                  evidence either way
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.verification.unverifiedSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border px-2 py-0.5 text-[12px] text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {missingSkills.length > 0 && (
              <div>
                <p className="mb-1.5 text-[12px] font-medium text-muted-foreground">
                  To be a stronger fit for this role, add:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.map((s) => (
                    <Link
                      key={s}
                      to="/learning"
                      search={{ skill: s }}
                      className="rounded-full border border-border bg-card px-2 py-0.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-[12px]">Résumé (PDF, .docx or .txt)</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 p-4 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Upload className="size-4" /> {fileName ?? "Upload your résumé"}
              </button>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-[12px]">
                GitHub username (optional, but strengthens verification)
              </Label>
              <Input
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="e.g. octocat"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-[12px]">
                LinkedIn profile URL (optional)
              </Label>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/you"
                className="h-9 rounded-xl"
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-[12px]">
                Paste your LinkedIn "About" / "Skills" text (optional, but
                strengthens verification)
              </Label>
              <Textarea
                value={linkedinText}
                onChange={(e) => setLinkedinText(e.target.value)}
                rows={4}
                className="rounded-2xl"
                placeholder="Copy the text from your LinkedIn profile's About and Skills sections here."
              />
            </div>

            <Button
              className="rounded-full"
              onClick={submit}
              disabled={!fileName || submitting}
            >
              {submitting ? "Verifying your profile…" : "Submit application"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
