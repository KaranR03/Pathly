import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { usePathly } from "@/lib/pathly-store";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/pathly/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/career-gap")({
  head: () => ({
    meta: [
      { title: "Career Gap & Opportunity Simulator — Pathly" },
      {
        name: "description",
        content:
          "See which missing skills are holding you back, and simulate how many more Australian jobs you'd strongly match after learning them.",
      },
      { property: "og:title", content: "Career Gap — Pathly" },
      {
        property: "og:description",
        content: "Simulate what happens to your job matches when you learn a new skill.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CareerGapPage,
});

function CareerGapPage() {
  const { gapAnalysis, profile, filters, setFilters, simulatedSkill, setSimulatedSkill, jobs } =
    usePathly();
  const [openSkill, setOpenSkill] = useState<string | null>(gapAnalysis.gaps[0]?.skill ?? null);
  const selected = gapAnalysis.gaps.find((g) => g.skill === openSkill) ?? gapAnalysis.gaps[0];
  const scope = filters.city ?? "Australia";

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
              Career Gap
            </p>
            <h1 className="mt-1.5 max-w-xl text-[28px] leading-tight font-semibold sm:text-[34px]">
              You currently strongly match {gapAnalysis.strongCount} {profile.careerGoal} and related
              opportunities around {scope}.
            </h1>
            <p className="mt-2 max-w-xl text-[14px] text-muted-foreground">
              Another {gapAnalysis.potentialCount} roles are within reach. Here's what's standing
              between you and them.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Brisbane", "Sydney", "Melbourne"].map((c) => (
              <button
                key={c}
                onClick={() => setFilters({ city: filters.city === c ? null : c })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  filters.city === c
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Your biggest opportunity gaps
            </p>
            <div className="mt-3 divide-y divide-border/70">
              {gapAnalysis.gaps.map((g) => (
                <button
                  key={g.skill}
                  onClick={() => setOpenSkill(g.skill)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                    openSkill === g.skill ? "bg-accent/70" : "hover:bg-accent/40",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium">{g.skill}</p>
                    <p className="text-[12px] text-muted-foreground">
                      Appears in {g.jobsTotal} jobs you almost match
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold text-strong">
                    +{Math.max(0, g.projectedStrong - g.currentStrong)}
                  </span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </button>
              ))}
              {gapAnalysis.gaps.length === 0 && (
                <p className="py-4 text-[13px] text-muted-foreground">
                  No significant gaps in this area — you're a strong candidate across the board.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Opportunity Simulator
              </p>
            </div>
            {selected ? (
              <>
                <h2 className="mt-3 text-[22px] font-semibold">What if I learn {selected.skill}?</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  If you add {selected.skill} to your profile:
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Stat label="Current strong" value={selected.currentStrong} />
                  <Stat label="Potential strong" value={selected.projectedStrong} accent />
                  <Stat
                    label="Additional"
                    value={`+${Math.max(0, selected.projectedStrong - selected.currentStrong)}`}
                    accent
                  />
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-strong transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (selected.projectedStrong / Math.max(1, jobs.length)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      Top locations unlocked
                    </p>
                    <ul className="mt-2 space-y-1 text-[13px]">
                      {(selected.topSuburbs.length ? selected.topSuburbs : ["—"]).map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      Industries unlocked
                    </p>
                    <ul className="mt-2 space-y-1 text-[13px]">
                      {(selected.industries.length ? selected.industries : ["—"]).map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    className="rounded-full"
                    onClick={() => setSimulatedSkill(selected.skill)}
                    disabled={simulatedSkill === selected.skill}
                  >
                    <TrendingUp className="size-4" />
                    {simulatedSkill === selected.skill ? "Simulation active" : "Simulate on map"}
                  </Button>
                  <Button variant="secondary" className="rounded-full" asChild>
                    <Link to="/map">View unlocked jobs</Link>
                  </Button>
                  <Button variant="ghost" className="rounded-full" asChild>
                    <Link to="/learning" search={{ skill: selected.skill }}>
                      Learn {selected.skill}
                    </Link>
                  </Button>
                  {simulatedSkill && (
                    <Button
                      variant="ghost"
                      className="rounded-full text-muted-foreground"
                      onClick={() => setSimulatedSkill(null)}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-4 text-[13px] text-muted-foreground">
                Nothing to simulate right now — try widening your location.
              </p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-[22px] font-semibold", accent && "text-strong")}>{value}</p>
    </div>
  );
}
