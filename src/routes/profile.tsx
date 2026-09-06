import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  FileText,
  Github,
  Globe,
  Linkedin,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { parseCv } from "@/lib/cv.functions";

import { toast } from "sonner";
import { ALL_INDUSTRIES, ALL_SKILLS } from "@/data/jobs";
import { usePathly } from "@/lib/pathly-store";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/pathly/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExperienceLevel, JobType } from "@/data/jobs";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Pathly" },
      {
        name: "description",
        content:
          "Upload your CV, let Pathly detect your skills, and tune the preferences behind every match score.",
      },
      { property: "og:title", content: "Your Profile — Pathly" },
      {
        property: "og:description",
        content:
          "Your skills, preferences and CV — the inputs behind every Pathly match.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const {
    profile,
    updateProfile,
    addSkill,
    removeSkill,
    applyParsedCv,
    savedJobIds,
    applications,
    gapAnalysis,
  } = usePathly();
  const parse = useServerFn(parseCv);
  const [newSkill, setNewSkill] = useState("");
  const [detected, setDetected] = useState<string[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

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
          ? `${cv.skills.length} skills read from your CV — match scores updated.`
          : "We read your CV but couldn't identify clear skills. Add a few manually below.",
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
    <AppShell>
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
          Profile
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold sm:text-[34px]">
          {profile.name}
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          {profile.careerGoal} · {profile.location} · {savedJobIds.length} saved
          · {applications.length} applications
        </p>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              CV / resume
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
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-secondary/40 p-6 text-center">
              {profile.resumeName ? (
                <div className="flex items-center justify-center gap-2 text-[13px]">
                  <FileText className="size-4" /> {profile.resumeName}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  Upload your CV (PDF, .docx or .txt) and Pathly will read your
                  real skills and experience.
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
              <p className="mt-2 text-[11px] text-muted-foreground">
                Text-based files only — scanned images can't be read.
              </p>
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
                <Button className="mt-4 rounded-full" asChild>
                  <Link to="/map">
                    Start exploring jobs <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            )}

            <div className="mt-5">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Your skills
              </p>
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
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  list="skill-options"
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
                <datalist id="skill-options">
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
              {gapAnalysis.gaps.length > 0 && (
                <p className="mt-3 text-[12px] text-muted-foreground">
                  Commonly missing near you:{" "}
                  {gapAnalysis.gaps
                    .slice(0, 3)
                    .map((g) => g.skill)
                    .join(", ")}
                </p>
              )}
            </div>

            <div className="mt-5 border-t border-border/60 pt-5">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Profile links
              </p>
              <div className="mt-3 space-y-3">
                <div className="grid gap-1.5">
                  <Label className="flex items-center gap-1.5 text-[12px]">
                    <Linkedin className="size-3.5" /> LinkedIn
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
                    <Github className="size-3.5" /> GitHub
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
                    <Globe className="size-3.5" /> Portfolio
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
            </div>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Preferences
            </p>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-1.5">
                <Label className="text-[12px]">Name</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-[12px]">Location</Label>
                <Input
                  value={profile.location}
                  onChange={(e) => updateProfile({ location: e.target.value })}
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-[12px]">Career interest</Label>
                <Input
                  value={profile.careerGoal}
                  onChange={(e) =>
                    updateProfile({ careerGoal: e.target.value })
                  }
                  className="h-9 rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-[12px]">Experience level</Label>
                <Select
                  value={profile.experienceLevel}
                  onValueChange={(v) => {
                    const years: Record<string, number> = {
                      "No experience": 0,
                      "Entry level": 1,
                      Junior: 2,
                      "Mid-level": 4,
                      Senior: 7,
                    };
                    updateProfile({
                      experienceLevel: v as ExperienceLevel,
                      yearsExperience: years[v] ?? 1,
                    });
                  }}
                >
                  <SelectTrigger className="h-9 rounded-xl">
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

              <div>
                <Label className="text-[12px]">Preferred industries</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ALL_INDUSTRIES.slice(0, 12).map((i) => {
                    const on = profile.preferredIndustries.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          updateProfile({
                            preferredIndustries: on
                              ? profile.preferredIndustries.filter(
                                  (x) => x !== i,
                                )
                              : [...profile.preferredIndustries, i],
                          })
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                          on
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {i}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-[12px]">Preferred job types</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(
                    [
                      "Full-time",
                      "Part-time",
                      "Casual",
                      "Contract",
                      "Internship",
                      "Graduate",
                    ] as const
                  ).map((t) => {
                    const on = profile.preferredJobTypes.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() =>
                          updateProfile({
                            preferredJobTypes: on
                              ? profile.preferredJobTypes.filter((x) => x !== t)
                              : [...profile.preferredJobTypes, t as JobType],
                          })
                        }
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                          on
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <Label className="text-[12px]">Maximum commute</Label>
                  <span className="text-[12px] font-medium">
                    {profile.maxCommuteMinutes} minutes
                  </span>
                </div>
                <Slider
                  className="mt-2"
                  value={[profile.maxCommuteMinutes]}
                  min={10}
                  max={120}
                  step={5}
                  onValueChange={([v]) =>
                    updateProfile({ maxCommuteMinutes: v ?? 45 })
                  }
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
