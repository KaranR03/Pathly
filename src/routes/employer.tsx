import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, HelpCircle, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ALL_SKILLS,
  CITIES,
  type Arrangement,
  type ExperienceLevel,
  type Job,
  type JobType,
} from "@/data/jobs";
import { usePathly } from "@/lib/pathly-store";
import { useAuth } from "@/lib/auth";
import { matchJob } from "@/lib/matching";
import {
  fetchApplicantsForMyJobs,
  insertEmployerJob,
  updateApplicationStatus,
  type ApplicationRecord,
} from "@/lib/employer-db";
import { AppShell } from "@/components/pathly/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/employer")({
  head: () => ({
    meta: [
      { title: "Post an Opportunity — Pathly for Employers" },
      {
        name: "description",
        content:
          "Australian startups and local businesses can post a role — pay, hours and location — and receive verified applicants.",
      },
      { property: "og:title", content: "Post an Opportunity — Pathly" },
      {
        property: "og:description",
        content: "Tell us about the role. We'll put it on the map.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmployerPage,
});

const JOB_TYPES: JobType[] = [
  "Full-time",
  "Part-time",
  "Casual",
  "Contract",
  "Internship",
  "Graduate",
];
const ARRANGEMENTS: Arrangement[] = ["On-site", "Hybrid", "Remote"];
const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "No experience",
  "Entry level",
  "Junior",
  "Mid-level",
  "Senior",
];

interface RoleForm {
  company: string;
  companyBlurb: string;
  title: string;
  description: string;
  jobType: JobType;
  arrangement: Arrangement;
  experience: ExperienceLevel;
  payPeriod: "year" | "hour";
  salaryMin: string;
  salaryMax: string;
  city: string;
  suburb: string;
  industry: string;
  required: string[];
  preferred: string[];
}

function SkillTagInput({
  label,
  values,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  values: string[];
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const listId = `skill-options-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const commit = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue("");
    }
  };
  return (
    <div className="grid gap-1.5">
      <Label className="text-[12px]">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {values.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[12px]"
          >
            {s}
            <button
              type="button"
              aria-label={`Remove ${s}`}
              onClick={() => onRemove(s)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {values.length === 0 && (
          <p className="text-[12px] text-muted-foreground">None added yet.</p>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          list={listId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          className="h-9 rounded-full"
        />
        <datalist id={listId}>
          {ALL_SKILLS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full"
          onClick={commit}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function EmployerPage() {
  const { user, isGuest } = useAuth();
  const { profile, profileReady, addEmployerJob, refreshEmployerJobs } =
    usePathly();
  const [form, setForm] = useState<RoleForm>({
    company: profile.companyName ?? "",
    companyBlurb: profile.companyBlurb ?? "",
    title: "",
    description: "",
    jobType: "Full-time",
    arrangement: "On-site",
    experience: "Junior",
    payPeriod: "year",
    salaryMin: "",
    salaryMax: "",
    city: CITIES[0]!.name,
    suburb: "",
    industry: "Technology",
    required: [],
    preferred: [],
  });
  const [publishing, setPublishing] = useState(false);

  // profile.companyName/companyBlurb load asynchronously from Supabase, so
  // the useState initializer above often runs before they arrive — resync
  // once the profile is actually ready, but only into fields the employer
  // hasn't already typed something into.
  useEffect(() => {
    if (!profileReady) return;
    setForm((f) => ({
      ...f,
      company: f.company || profile.companyName || f.company,
      companyBlurb: f.companyBlurb || profile.companyBlurb || f.companyBlurb,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileReady]);

  const patch = (fields: Partial<RoleForm>) =>
    setForm((f) => ({ ...f, ...fields }));

  const publish = async () => {
    const salaryMin = Number(form.salaryMin);
    const salaryMax = Number(form.salaryMax);

    if (!form.company.trim() || !form.title.trim()) {
      toast.error("Add a company and role title before publishing.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Add a short job description before publishing.");
      return;
    }
    if (!form.suburb.trim()) {
      toast.error("Add a suburb so applicants know where this role is.");
      return;
    }
    if (
      !form.salaryMin ||
      !form.salaryMax ||
      Number.isNaN(salaryMin) ||
      Number.isNaN(salaryMax) ||
      salaryMin <= 0 ||
      salaryMax <= 0
    ) {
      toast.error("Add a valid pay range.");
      return;
    }
    if (salaryMin > salaryMax) {
      toast.error("The minimum pay can't be higher than the maximum.");
      return;
    }

    const city = CITIES.find((c) => c.name === form.city)!;
    const job: Job = {
      id: `employer-${Date.now()}`,
      title: form.title.trim(),
      company: form.company.trim(),
      industry: form.industry,
      suburb: form.suburb.trim(),
      city: city.name,
      state: city.state,
      lat: city.lat + 0.014,
      lng: city.lng + 0.012,
      salaryMin,
      salaryMax,
      salaryPeriod: form.payPeriod,
      jobType: form.jobType,
      arrangement: form.arrangement,
      experience: form.experience,
      yearsPreferred: form.experience === "No experience" ? 0 : 2,
      postedDaysAgo: 0,
      companySize: "Startup",
      required: form.required,
      preferred: form.preferred,
      description: form.description.trim(),
      companyBlurb: form.companyBlurb.trim() || undefined,
    };

    if (user && !isGuest) {
      setPublishing(true);
      const created = await insertEmployerJob(user.id, job);
      setPublishing(false);
      if (created) {
        await refreshEmployerJobs();
        toast.success("Role published", {
          description: `${job.title} is live — real applicants can now apply with verification.`,
        });
        patch({
          title: "",
          description: "",
          salaryMin: "",
          salaryMax: "",
          suburb: "",
          required: [],
          preferred: [],
        });
        return;
      }
      toast.error("Couldn't publish to the database", {
        description:
          "Saved to this browser only for now — try again to make it live for applicants.",
      });
    }

    addEmployerJob(job);
    toast.success("Role published", {
      description: `${job.title} is now live on the map in ${job.suburb}.`,
    });
    patch({
      title: "",
      description: "",
      salaryMin: "",
      salaryMax: "",
      suburb: "",
      required: [],
      preferred: [],
    });
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
          For employers
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold sm:text-[34px]">
          Post a role
        </h1>
        <p className="mt-2 max-w-xl text-[14px] text-muted-foreground">
          Tell us about the company and the role. No résumé needed on your side
          — that's what your applicants bring.
        </p>

        <Tabs defaultValue="post" className="mt-7">
          <TabsList>
            <TabsTrigger value="post">Post a role</TabsTrigger>
            <TabsTrigger value="applicants">Applicants</TabsTrigger>
          </TabsList>

          <TabsContent value="post" className="mt-5">
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="grid gap-4">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  About the company
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label className="text-[12px]">Company name</Label>
                    <Input
                      value={form.company}
                      onChange={(e) => patch({ company: e.target.value })}
                      placeholder="Your company name"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[12px]">Industry</Label>
                    <Input
                      value={form.industry}
                      onChange={(e) => patch({ industry: e.target.value })}
                      placeholder="Technology, Retail, Hospitality…"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[12px]">
                    About the company (optional)
                  </Label>
                  <Textarea
                    value={form.companyBlurb}
                    onChange={(e) => patch({ companyBlurb: e.target.value })}
                    rows={2}
                    placeholder="A short line applicants will see on the listing."
                    className="rounded-2xl"
                  />
                </div>

                <p className="mt-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  About the role
                </p>
                <div className="grid gap-1.5">
                  <Label className="text-[12px]">Role title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="Frontend Developer"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[12px]">Job description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => patch({ description: e.target.value })}
                    rows={4}
                    placeholder="What will they work on? What does a normal week look like?"
                    className="rounded-2xl"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label className="text-[12px]">Employment type</Label>
                    <Select
                      value={form.jobType}
                      onValueChange={(v) => patch({ jobType: v as JobType })}
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[12px]">Work arrangement</Label>
                    <Select
                      value={form.arrangement}
                      onValueChange={(v) =>
                        patch({ arrangement: v as Arrangement })
                      }
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ARRANGEMENTS.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-[12px]">Experience required</Label>
                  <Select
                    value={form.experience}
                    onValueChange={(v) =>
                      patch({ experience: v as ExperienceLevel })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="mt-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Pay
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label className="text-[12px]">Pay period</Label>
                    <Select
                      value={form.payPeriod}
                      onValueChange={(v) =>
                        patch({ payPeriod: v as "year" | "hour" })
                      }
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="year">Per year</SelectItem>
                        <SelectItem value="hour">Per hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[12px]">
                      Min {form.payPeriod === "hour" ? "$/hr" : "$/yr"}
                    </Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={form.salaryMin}
                      onChange={(e) => patch({ salaryMin: e.target.value })}
                      placeholder={form.payPeriod === "hour" ? "32" : "90000"}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[12px]">
                      Max {form.payPeriod === "hour" ? "$/hr" : "$/yr"}
                    </Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={form.salaryMax}
                      onChange={(e) => patch({ salaryMax: e.target.value })}
                      placeholder={form.payPeriod === "hour" ? "45" : "110000"}
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <p className="mt-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Where is the job situated?
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label className="text-[12px]">City</Label>
                    <Select
                      value={form.city}
                      onValueChange={(v) => patch({ city: v })}
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}, {c.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[12px]">Suburb</Label>
                    <Input
                      value={form.suburb}
                      onChange={(e) => patch({ suburb: e.target.value })}
                      placeholder="Fortitude Valley"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                <SkillTagInput
                  label="Required skills"
                  values={form.required}
                  onAdd={(s) =>
                    setForm((f) =>
                      f.required.includes(s)
                        ? f
                        : { ...f, required: [...f.required, s] },
                    )
                  }
                  onRemove={(s) =>
                    setForm((f) => ({
                      ...f,
                      required: f.required.filter((x) => x !== s),
                    }))
                  }
                  placeholder="Add a required skill"
                />
                <SkillTagInput
                  label="Preferred skills (optional)"
                  values={form.preferred}
                  onAdd={(s) =>
                    setForm((f) =>
                      f.preferred.includes(s)
                        ? f
                        : { ...f, preferred: [...f.preferred, s] },
                    )
                  }
                  onRemove={(s) =>
                    setForm((f) => ({
                      ...f,
                      preferred: f.preferred.filter((x) => x !== s),
                    }))
                  }
                  placeholder="Add a nice-to-have skill"
                />

                {(!user || isGuest) && (
                  <p className="text-[12px] text-muted-foreground">
                    Sign in before publishing so real applicants can find and
                    apply to this role.
                  </p>
                )}

                <div className="mt-2 flex gap-2">
                  <Button
                    className="rounded-full"
                    onClick={publish}
                    disabled={publishing}
                  >
                    {publishing ? "Publishing…" : "Publish to the map"}
                  </Button>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="applicants" className="mt-5">
            <ApplicantsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

const STATUS_OPTIONS = [
  "submitted",
  "reviewed",
  "shortlisted",
  "rejected",
] as const;

const authenticityTier = (score: number) =>
  score >= 75 ? "strong" : score >= 45 ? "potential" : "gap";

const tierStyles: Record<string, string> = {
  strong: "bg-strong-soft text-strong",
  potential: "bg-potential-soft text-potential",
  gap: "bg-gap-soft text-gap",
};

function ApplicantsPanel() {
  const { user, isGuest } = useAuth();
  const [rows, setRows] = useState<
    { job: Job; applications: ApplicationRecord[] }[] | null
  >(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || isGuest) {
      setRows([]);
      return;
    }
    setLoading(true);
    void fetchApplicantsForMyJobs(user.id).then((r) => {
      setRows(r);
      setLoading(false);
    });
  }, [user, isGuest]);

  if (!user || isGuest) {
    return (
      <p className="rounded-3xl border border-border/70 bg-card p-6 text-[13px] text-muted-foreground">
        Sign in to see applicants for the roles you've posted.
      </p>
    );
  }

  if (loading || rows === null) {
    return (
      <p className="rounded-3xl border border-border/70 bg-card p-6 text-[13px] text-muted-foreground">
        Loading applicants…
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-3xl border border-border/70 bg-card p-6 text-[13px] text-muted-foreground">
        You haven't published any roles yet — post one to start receiving
        verified applications.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {rows.map(({ job, applications }) => (
        <section
          key={job.id}
          className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h3 className="text-[16px] font-semibold">{job.title}</h3>
              <p className="text-[12px] text-muted-foreground">
                {job.suburb}, {job.state} · {applications.length} applicant
                {applications.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {applications.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              No applications yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {applications.map((application) => (
                <ApplicantCard
                  key={application.id}
                  job={job}
                  application={application}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function ApplicantCard({
  job,
  application,
}: {
  job: Job;
  application: ApplicationRecord;
}) {
  const [status, setStatus] = useState(application.status);
  const verification = application.verification;
  const missing = matchJob(job, {
    skills: application.resumeSkills,
    yearsExperience: application.resumeYearsExperience ?? 0,
  });
  const missingSkills = [...missing.missing, ...missing.missingPreferred];

  const changeStatus = async (next: string) => {
    setStatus(next);
    const { error } = await updateApplicationStatus(application.id, next);
    if (error) toast.error("Couldn't update status", { description: error });
  };

  return (
    <div className="rounded-2xl border border-border/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium">{application.applicantName}</p>
          <p className="text-[12px] text-muted-foreground">
            {application.resumeFileName}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
            {application.githubUsername && (
              <a
                href={`https://github.com/${application.githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                GitHub: {application.githubUsername}
              </a>
            )}
            {application.linkedinUrl && (
              <a
                href={application.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                LinkedIn profile
              </a>
            )}
          </div>
        </div>
        <Select value={status} onValueChange={(v) => void changeStatus(v)}>
          <SelectTrigger className="h-8 w-[140px] rounded-full border-border px-3 text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-[12px] capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {verification ? (
        <div className="mt-3 space-y-2.5">
          <div
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold",
              tierStyles[authenticityTier(verification.authenticityScore)],
            )}
          >
            Authenticity {verification.authenticityScore}%
          </div>
          <p className="text-[13px] text-muted-foreground">
            {verification.summary}
          </p>

          {verification.verifiedSkills.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-strong" /> Verified
              </p>
              <div className="flex flex-wrap gap-1.5">
                {verification.verifiedSkills.map((s) => (
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

          {verification.contradictions.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <AlertTriangle className="size-3.5 text-gap" /> Not backed up
                anywhere else
              </p>
              <ul className="space-y-0.5 text-[12px]">
                {verification.contradictions.map((c) => (
                  <li key={c.skill}>
                    <span className="font-medium">{c.skill}</span> — {c.note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verification.unverifiedSkills.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <HelpCircle className="size-3.5" /> Claimed, no public evidence
                either way
              </p>
              <div className="flex flex-wrap gap-1.5">
                {verification.unverifiedSkills.map((s) => (
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
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                Missing for this role
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-secondary px-2 py-0.5 text-[12px] text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-muted-foreground">
          No verification data on file.
        </p>
      )}
    </div>
  );
}
