import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { formatSalary } from "@/lib/matching";
import { usePathly } from "@/lib/pathly-store";
import { AppShell } from "@/components/pathly/AppShell";
import { Button } from "@/components/ui/button";
import { MatchBadge } from "@/components/pathly/MatchBadge";
import { APPLICATION_STAGES } from "@/lib/application-stages";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Pathly" },
      {
        name: "description",
        content:
          "Your opportunity snapshot: strong matches, saved roles, applications and the one skill that would unlock the most Australian jobs.",
      },
      { property: "og:title", content: "Dashboard — Pathly" },
      {
        property: "og:description",
        content: "Your daily opportunity snapshot across Australia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const {
    profile,
    gapAnalysis,
    savedJobIds,
    applications,
    jobs,
    matchFor,
    recentlyViewed,
    setSimulatedSkill,
  } = usePathly();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const topGap = gapAnalysis.gaps[0];

  const recommended = [...jobs]
    .map((j) => ({ job: j, m: matchFor(j) }))
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 5);

  const nearby = jobs
    .filter((j) => profile.location.includes(j.city) && j.postedDaysAgo <= 3)
    .slice(0, 4);
  const trackedRoleCount = new Set([
    ...savedJobIds,
    ...applications.map((application) => application.jobId),
  ]).size;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
          {profile.location}
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold sm:text-[34px]">
          {greeting}, {profile.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">Your opportunity snapshot</p>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Strong matches" value={gapAnalysis.strongCount} tone="strong" />
          <Stat label="Potential matches" value={gapAnalysis.potentialCount} tone="potential" />
          <Stat label="Saved jobs" value={savedJobIds.length} />
          <Stat label="Tracked roles" value={trackedRoleCount} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
            <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <Sparkles className="size-3.5" /> Top skill to learn
            </p>
            <h2 className="mt-2 text-[26px] font-semibold">{topGap?.skill ?? "You're all set"}</h2>
            {topGap && (
              <>
                <p className="mt-1 text-[14px] text-muted-foreground">
                  Could potentially unlock{" "}
                  <span className="font-semibold text-strong">
                    +{Math.max(0, topGap.projectedStrong - topGap.currentStrong)} jobs
                  </span>{" "}
                  around you.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button className="rounded-full" asChild>
                    <Link to="/career-gap">Explore Career Gap</Link>
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => setSimulatedSkill(topGap.skill)}
                    asChild
                  >
                    <Link to="/map">Show me on the map</Link>
                  </Button>
                </div>
              </>
            )}
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Application progress
            </p>
            <div className="mt-3 space-y-2">
              {APPLICATION_STAGES.map((stage) => {
                const count =
                  stage === "Saved"
                    ? savedJobIds.length
                    : applications.filter((a) => a.stage === stage).length;
                const max = Math.max(1, savedJobIds.length, applications.length);
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="w-20 text-[12px] text-muted-foreground">{stage}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-foreground/70 transition-all duration-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[12px] font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
            <Link
              to="/applications"
              className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium underline underline-offset-4"
            >
              Open tracker <ArrowUpRight className="size-3.5" />
            </Link>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <JobList title="Recommended for you" items={recommended.map((r) => r.job.id)} />
          <JobList title="New nearby opportunities" items={nearby.map((j) => j.id)} />
        </div>

        {recentlyViewed.length > 0 && (
          <div className="mt-5">
            <JobList title="Recently viewed" items={recentlyViewed} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "strong" | "potential";
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-[var(--shadow-soft)]">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p
        className={
          "mt-1 text-[28px] font-semibold " +
          (tone === "strong" ? "text-strong" : tone === "potential" ? "text-potential" : "")
        }
      >
        {value}
      </p>
    </div>
  );
}

function JobList({ title, items }: { title: string; items: string[] }) {
  const { jobs, matchFor } = usePathly();
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <div className="mt-2 divide-y divide-border/70">
        {items.map((id) => {
          const job = jobs.find((j) => j.id === id);
          if (!job) return null;
          const m = matchFor(job);
          return (
            <Link
              key={id}
              to="/map"
              className="flex items-center gap-3 py-3 transition-opacity hover:opacity-70"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{job.title}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {job.company} · {job.suburb} {job.state} ·{" "}
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </p>
              </div>
              <MatchBadge score={m.score} tier={m.tier} showLabel={false} />
            </Link>
          );
        })}
        {items.length === 0 && (
          <p className="py-3 text-[12px] text-muted-foreground">Nothing to show yet.</p>
        )}
      </div>
    </section>
  );
}
