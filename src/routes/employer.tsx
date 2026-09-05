import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CITIES, type Arrangement, type ExperienceLevel, type Job, type JobType } from "@/data/jobs";
import { usePathly } from "@/lib/pathly-store";
import { AppShell } from "@/components/pathly/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const city = CITIES.find((c) => lower.includes(c.name.toLowerCase())) ?? CITIES[0]!;
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
    jobType: partTime ? (student ? "Internship" : "Part-time") : student ? "Graduate" : "Full-time",
    arrangement: /remote/.test(lower) ? "Remote" : /hybrid/.test(lower) ? "Hybrid" : "On-site",
    experience: student ? "No experience" : "Junior",
    skills,
    salaryMin: student ? 55000 : 90000,
    salaryMax: student ? 65000 : 110000,
    industry: isData ? "Technology" : isReact ? "Technology" : "Small Business",
  };
}

function EmployerPage() {
  const { addEmployerJob } = usePathly();
  const [company, setCompany] = useState("Reefline");
  const [brief, setBrief] = useState(EXAMPLE);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [thinking, setThinking] = useState(false);

  const generate = () => {
    setThinking(true);
    setTimeout(() => {
      setDraft(parseBrief(brief, company));
      setThinking(false);
    }, 900);
  };

  const publish = () => {
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
          Built for Australian startups and local businesses — write it the way you'd say it out
          loud.
        </p>

        <section className="mt-7 rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
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
              <Label className="text-[12px]">What are you looking for?</Label>
              <Textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={4}
                className="rounded-2xl"
              />
            </div>
            <div className="flex gap-2">
              <Button className="rounded-full" onClick={generate} disabled={thinking}>
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
          </div>
        </section>

        {draft && (
          <section className="animate-rise mt-5 rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Review draft
            </p>
            <h2 className="mt-2 text-[22px] font-semibold">{draft.title}</h2>
            <p className="text-[13px] text-muted-foreground">{draft.company}</p>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Location" value={`${draft.suburb}, ${draft.city} ${draft.state}`} />
              <Field label="Job type" value={`${draft.jobType} · ${draft.arrangement}`} />
              <Field label="Experience" value={draft.experience} />
              <Field
                label="Salary guide"
                value={`$${draft.salaryMin / 1000},000–$${draft.salaryMax / 1000},000 AUD`}
              />
              <Field label="Industry" value={draft.industry} />
              <Field label="Skills" value={draft.skills.join(", ")} />
            </dl>

            <div className="mt-5 flex gap-2">
              <Button className="rounded-full" onClick={publish}>
                Publish to the map
              </Button>
              <Button variant="ghost" className="rounded-full" onClick={() => setDraft(null)}>
                Discard
              </Button>
            </div>
          </section>
        )}
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
