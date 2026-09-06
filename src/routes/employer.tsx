import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
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
          "Australian startups and local businesses can describe a role in plain English and Pathly turns it into a structured listing on the map.",
      },
      { property: "og:title", content: "Post an Opportunity — Pathly" },
      {
        property: "og:description",
        content: "Describe the role in a sentence. Pathly drafts the listing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmployerPage,
});

const EXAMPLE =
  "We're a Brisbane startup looking for a React developer studying at university who can work 2 days per week.";

interface Draft {
  title: string;
  company: string;
  suburb: string;
  city: string;
  state: string;
  jobType: JobType;
  arrangement: Arrangement;
  experience: ExperienceLevel;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  industry: string;
}

/** Mock AI parsing of a plain-English brief. Swap for a real model call later. */
function parseBrief(text: string, company: string): Draft {
  const lower = text.toLowerCase();
  const city =
    CITIES.find((c) => lower.includes(c.name.toLowerCase())) ?? CITIES[0]!;
  const isReact = /react|frontend|front-end/.test(lower);
  const isData = /data|analyst|sql|analytics/.test(lower);
  const isDesign = /design|figma|ux/.test(lower);
  const partTime = /2 days|part.time|two days|casual/.test(lower);
  const student = /student|university|studying|intern/.test(lower);

  const title = isReact
    ? student
      ? "Frontend Developer Intern"
      : "Frontend Developer"
    : isData
      ? student
        ? "Data Analyst Intern"
        : "Data Analyst"
      : isDesign
        ? "Product Designer"
        : "Team Member";

  const skills = isReact
    ? ["React", "JavaScript", "Git"]
    : isData
      ? ["SQL", "Excel", "Python"]
      : isDesign
        ? ["Figma"]
        : ["Excel"];

  const suburbByCity: Record<string, string> = {
    Brisbane: "Fortitude Valley",
    Sydney: "Surry Hills",
    Melbourne: "Collingwood",
    Perth: "Perth CBD",
    Adelaide: "Adelaide CBD",
    Canberra: "Canberra City",
    "Gold Coast": "Southport",
  };

  return {
    title,
    company: company.trim() || "Your company",
    suburb: suburbByCity[city.name] ?? city.name,
    city: city.name,
    state: city.state,
    jobType: partTime
      ? student
        ? "Internship"
        : "Part-time"
      : student
        ? "Graduate"
        : "Full-time",
    arrangement: /remote/.test(lower)
      ? "Remote"
      : /hybrid/.test(lower)
        ? "Hybrid"
        : "On-site",
    experience: student ? "No experience" : "Junior",
    skills,
    salaryMin: student ? 55000 : 90000,
    salaryMax: student ? 65000 : 110000,
    industry: isData ? "Technology" : isReact ? "Technology" : "Small Business",
  };
}

function EmployerPage() {
  const { user, isGuest } = useAuth();
  const { addEmployerJob, refreshEmployerJobs } = usePathly();
  const [company, setCompany] = useState("Reefline");
  const [brief, setBrief] = useState(EXAMPLE);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [thinking, setThinking] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const generate = () => {
    setThinking(true);
    setTimeout(() => {
      setDraft(parseBrief(brief, company));
      setThinking(false);
    }, 900);
  };

  const publish = async () => {
    if (!draft) return;
    const city = CITIES.find((c) => c.name === draft.city)!;
    const job: Job = {
      id: `employer-${Date.now()}`,
      title: draft.title,
      company: draft.company,
      industry: draft.industry,
      suburb: draft.suburb,
      city: draft.city,
      state: draft.state,
      lat: city.lat + 0.014,
      lng: city.lng + 0.012,
      salaryMin: draft.salaryMin,
      salaryMax: draft.salaryMax,
      jobType: draft.jobType,
      arrangement: draft.arrangement,
      experience: draft.experience,
      yearsPreferred: draft.experience === "No experience" ? 0 : 2,
      postedDaysAgo: 0,
      companySize: "Startup",
      required: draft.skills,
      preferred: [],
      description: brief,
    };

    if (user && !isGuest) {
      setPublishing(true);
      const created = await insertEmployerJob(user.id, job);
      setPublishing(false);
      if (created) {
        await refreshEmployerJobs();
        toast.success("Opportunity published", {
          description: `${draft.title} is live — real applicants can now apply with verification.`,
        });
        setDraft(null);
        return;
      }
      toast.error("Couldn't publish to the database", {
        description:
          "Saved to this browser only for now — try again to make it live for applicants.",
      });
    }

    addEmployerJob(job);
    toast.success("Opportunity published", {
      description: `${draft.title} is now live on the map in ${draft.suburb}.`,
    });
    setDraft(null);
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
          For employers
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold sm:text-[34px]">
          Describe the role. We'll draft the listing.
        </h1>
        <p className="mt-2 max-w-xl text-[14px] text-muted-foreground">
          Built for Australian startups and local businesses — write it the way
          you'd say it out loud.
        </p>

        <Tabs defaultValue="post" className="mt-7">
          <TabsList>
            <TabsTrigger value="post">Post a role</TabsTrigger>
            <TabsTrigger value="applicants">Applicants</TabsTrigger>
          </TabsList>

          <TabsContent value="post" className="mt-5">
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-[12px]">Company</Label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[12px]">
                    What are you looking for?
                  </Label>
                  <Textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    rows={4}
                    className="rounded-2xl"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="rounded-full"
                    onClick={generate}
                    disabled={thinking}
                  >
                    <Sparkles className="size-4" />
                    {thinking ? "Drafting…" : "Draft with AI"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => setBrief(EXAMPLE)}
                  >
                    Use example
                  </Button>
                </div>
                {(!user || isGuest) && (
                  <p className="text-[12px] text-muted-foreground">
                    Sign in before publishing so real applicants can find and
                    apply to this role.
                  </p>
                )}
              </div>
            </section>

            {draft && (
              <section className="animate-rise mt-5 rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Review draft
                </p>
                <h2 className="mt-2 text-[22px] font-semibold">
                  {draft.title}
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  {draft.company}
                </p>

                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Location"
                    value={`${draft.suburb}, ${draft.city} ${draft.state}`}
                  />
                  <Field
                    label="Job type"
                    value={`${draft.jobType} · ${draft.arrangement}`}
                  />
                  <Field label="Experience" value={draft.experience} />
                  <Field
                    label="Salary guide"
                    value={`$${draft.salaryMin / 1000},000–$${draft.salaryMax / 1000},000 AUD`}
                  />
                  <Field label="Industry" value={draft.industry} />
                  <Field label="Skills" value={draft.skills.join(", ")} />
                </dl>

                <div className="mt-5 flex gap-2">
                  <Button
                    className="rounded-full"
                    onClick={publish}
                    disabled={publishing}
                  >
                    {publishing ? "Publishing…" : "Publish to the map"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => setDraft(null)}
                  >
                    Discard
                  </Button>
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="applicants" className="mt-5">
            <ApplicantsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-[14px]">{value}</dd>
    </div>
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
