import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Github,
  Globe,
  Linkedin,
  PartyPopper,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ALL_SKILLS } from "@/data/jobs";
import type { ExperienceLevel } from "@/data/jobs";
import { parseCv } from "@/lib/cv.functions";
import { usePathly } from "@/lib/pathly-store";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/pathly/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Set up your profile — Pathly" }],
  }),
  component: OnboardingPage,
});

const STEPS = ["CV", "Skills", "Profiles", "Done"] as const;

const EXPERIENCE_YEARS: Record<string, number> = {
  "No experience": 0,
  "Entry level": 1,
  Junior: 2,
  "Mid-level": 4,
  Senior: 7,
};

function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, updateProfile, addSkill, removeSkill, applyParsedCv } =
    usePathly();
  const parse = useServerFn(parseCv);
  const [step, setStep] = useState(0);
  const [newSkill, setNewSkill] = useState("");
  const [detected, setDetected] = useState<string[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const finish = () => {
    updateProfile({ onboardingCompleted: true });
    navigate({ to: "/dashboard", replace: true });
  };

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = () => reject(new Error("Could not read that file."));
      reader.readAsDataURL(file);
    });

  const handleUpload = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("That file is too large", {
        description: "Please upload a CV under 8 MB.",
      });
      return;
    }
    setAnalysing(true);
    setDetected([]);
    try {
      const content = await toBase64(file);
      const cv = await parse({ data: { fileName: file.name, content } });
      applyParsedCv(file.name, cv);
      setDetected(cv.skills);
      toast.success("CV analysed", {
        description: cv.skills.length
          ? `${cv.skills.length} skills read from your CV.`
          : "We read your CV but couldn't identify clear skills. Add a few manually next.",
      });
    } catch (err) {
      toast.error("Couldn't analyse that CV", {
        description:
          err instanceof Error ? err.message : "Please try a different file.",
      });
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <AppShell bare>
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[640px] flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-[11px] font-semibold transition-colors",
                    i === step
                      ? "bg-foreground text-background"
                      : i < step
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    className={cn(
                      "h-px w-6 sm:w-10",
                      i < step ? "bg-primary/40" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          {step < STEPS.length - 1 && (
            <button
              onClick={finish}
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip onboarding
            </button>
          )}
        </div>

        <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[var(--shadow-float)] sm:p-8">
          {step === 0 && (
            <>
              <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
                Step 1 of 4
              </p>
              <h1 className="mt-1.5 text-[24px] font-semibold">
                Upload your CV
              </h1>
              <p className="mt-2 text-[14px] text-muted-foreground">
                Pathly reads your real skills and experience straight from your
                CV so your match scores are accurate from day one.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                  e.target.value = "";
                }}
              />
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center">
                {profile.resumeName ? (
                  <div className="flex items-center justify-center gap-2 text-[13px]">
                    <FileText className="size-4" /> {profile.resumeName}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    PDF, .docx or .txt. Scanned images can't be read.
                  </p>
                )}
                <div className="mt-3 flex justify-center gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => fileRef.current?.click()}
                    disabled={analysing}
                  >
                    <Upload className="size-4" />{" "}
                    {analysing ? "Reading your CV…" : "Upload CV"}
                  </Button>
                </div>
              </div>

              {detected.length > 0 && (
                <div className="animate-rise mt-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    <Sparkles className="size-3.5" /> Detected skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {detected.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-strong-soft px-2.5 py-1 text-[12px] font-medium text-strong"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
                Step 2 of 4
              </p>
              <h1 className="mt-1.5 text-[24px] font-semibold">
                Your skills and experience
              </h1>
              <p className="mt-2 text-[14px] text-muted-foreground">
                Add anything your CV missed, and tell us your experience level.
              </p>

              <div className="mt-5">
                <Label className="text-[12px]">Experience level</Label>
                <Select
                  value={profile.experienceLevel}
                  onValueChange={(v) =>
                    updateProfile({
                      experienceLevel: v as ExperienceLevel,
                      yearsExperience: EXPERIENCE_YEARS[v] ?? 1,
                    })
                  }
                >
                  <SelectTrigger className="mt-2 h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "No experience",
                        "Entry level",
                        "Junior",
                        "Mid-level",
                        "Senior",
                      ] as const
                    ).map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-5">
                <Label className="text-[12px]">Skills</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[12px]"
                    >
                      {s}
                      <button
                        aria-label={`Remove ${s}`}
                        onClick={() => removeSkill(s)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {profile.skills.length === 0 && (
                    <p className="text-[13px] text-muted-foreground">
                      No skills added yet.
                    </p>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    list="onboarding-skill-options"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSkill.trim()) {
                        addSkill(newSkill.trim());
                        setNewSkill("");
                      }
                    }}
                    placeholder="Add a skill"
                    className="h-9 rounded-full"
                  />
                  <datalist id="onboarding-skill-options">
                    {ALL_SKILLS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => {
                      if (newSkill.trim()) {
                        addSkill(newSkill.trim());
                        setNewSkill("");
                      }
                    }}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
                Step 3 of 4
              </p>
              <h1 className="mt-1.5 text-[24px] font-semibold">
                Connect your profiles
              </h1>
              <p className="mt-2 text-[14px] text-muted-foreground">
                Optional, but employers viewing your applications may want to
                see these.
              </p>

              <div className="mt-5 space-y-4">
                <div className="grid gap-1.5">
                  <Label className="flex items-center gap-1.5 text-[12px]">
                    <Linkedin className="size-3.5" /> LinkedIn profile
                  </Label>
                  <Input
                    value={profile.linkedinUrl ?? ""}
                    onChange={(e) =>
                      updateProfile({ linkedinUrl: e.target.value || null })
                    }
                    placeholder="https://linkedin.com/in/your-name"
                    className="h-9 rounded-xl"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="flex items-center gap-1.5 text-[12px]">
                    <Github className="size-3.5" /> GitHub profile
                  </Label>
                  <Input
                    value={profile.githubUrl ?? ""}
                    onChange={(e) =>
                      updateProfile({ githubUrl: e.target.value || null })
                    }
                    placeholder="https://github.com/your-name"
                    className="h-9 rounded-xl"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="flex items-center gap-1.5 text-[12px]">
                    <Globe className="size-3.5" /> Portfolio website
                  </Label>
                  <Input
                    value={profile.portfolioUrl ?? ""}
                    onChange={(e) =>
                      updateProfile({ portfolioUrl: e.target.value || null })
                    }
                    placeholder="https://your-portfolio.com"
                    className="h-9 rounded-xl"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <PartyPopper className="size-6" />
              </span>
              <h1 className="mt-4 text-[24px] font-semibold">
                You're all set, {profile.name || "there"}.
              </h1>
              <p className="mt-2 text-[14px] text-muted-foreground">
                Your profile is ready. You can always update your CV, skills or
                links later from your Profile page.
              </p>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={goBack}
              disabled={step === 0}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={goNext}
                >
                  Skip
                </Button>
                <Button className="rounded-full" onClick={goNext}>
                  Continue <ArrowRight className="size-4" />
                </Button>
              </div>
            ) : (
              <Button className="rounded-full px-6" onClick={finish}>
                Go to dashboard <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
