import { createFileRoute } from "@tanstack/react-router";
import { Clock, ExternalLink, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { COURSES, type Course } from "@/data/courses";
import { usePathly } from "@/lib/pathly-store";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/pathly/AppShell";

const searchSchema = z.object({ skill: z.string().optional() });

export const Route = createFileRoute("/learning")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Learning Paths — Pathly" },
      {
        name: "description",
        content:
          "Trusted course recommendations for every skill gap Pathly finds, with free and paid options clearly compared.",
      },
      { property: "og:title", content: "Learning Paths — Pathly" },
      {
        property: "og:description",
        content: "Close your skill gaps with free and paid learning paths, ranked on quality.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LearningPage,
});

function LearningPage() {
  const { skill } = Route.useSearch();
  const { gapAnalysis } = usePathly();
  const gapSkills = gapAnalysis.gaps.map((g) => g.skill);
  const skillList = Array.from(new Set([...gapSkills, ...COURSES.map((c) => c.skill)]));
  const [active, setActive] = useState<string>(skill ?? gapSkills[0] ?? "Power BI");
  const [cost, setCost] = useState<Course["cost"] | null>(null);
  const [level, setLevel] = useState<Course["level"] | null>(null);
  const [mode, setMode] = useState<Course["mode"] | null>(null);
  const [maxHours, setMaxHours] = useState<number | null>(null);

  const courses = COURSES.filter((c) => c.skill === active)
    .filter((c) => (cost ? c.cost === cost : true))
    .filter((c) => (level ? c.level === level : true))
    .filter((c) => (mode ? c.mode === mode : true))
    .filter((c) => (maxHours ? c.hours <= maxHours : true))
    .sort((a, b) => b.quality - a.quality);

  const gap = gapAnalysis.gaps.find((g) => g.skill === active);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
          Learning
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold sm:text-[34px]">Close the gap</h1>
        <p className="mt-2 max-w-xl text-[14px] text-muted-foreground">
          Recommendations are ranked by quality and fit — never by who paid. Sponsored options are
          labelled and stay in their earned position.
        </p>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {skillList.map((s) => (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                active === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
              {gapSkills.includes(s) && active !== s && (
                <span className="ml-1.5 text-gap">•</span>
              )}
            </button>
          ))}
        </div>

        {gap && (
          <div className="mt-5 rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
            <p className="text-[13px]">
              Learning <span className="font-semibold">{gap.skill}</span> could lift your strong
              matches from <span className="font-semibold">{gap.currentStrong}</span> to{" "}
              <span className="font-semibold text-strong">{gap.projectedStrong}</span> — about{" "}
              <span className="font-semibold text-strong">
                +{Math.max(0, gap.projectedStrong - gap.currentStrong)} opportunities
              </span>
              .
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-1.5">
          <FilterChip active={cost === "Free"} onClick={() => setCost(cost === "Free" ? null : "Free")}>
            Free
          </FilterChip>
          <FilterChip active={cost === "Paid"} onClick={() => setCost(cost === "Paid" ? null : "Paid")}>
            Paid
          </FilterChip>
          {(["Beginner", "Intermediate", "Advanced"] as const).map((l) => (
            <FilterChip key={l} active={level === l} onClick={() => setLevel(level === l ? null : l)}>
              {l}
            </FilterChip>
          ))}
          {(["Online", "In-person"] as const).map((m) => (
            <FilterChip key={m} active={mode === m} onClick={() => setMode(mode === m ? null : m)}>
              {m}
            </FilterChip>
          ))}
          <FilterChip active={maxHours === 15} onClick={() => setMaxHours(maxHours ? null : 15)}>
            Under 15 hours
          </FilterChip>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <article
              key={c.id}
              className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] text-muted-foreground">{c.provider}</p>
                  <h2 className="mt-0.5 text-[16px] leading-snug font-semibold">{c.title}</h2>
                </div>
                {c.sponsored && (
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Sponsored
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                <span className={cn("font-medium", c.cost === "Free" ? "text-strong" : "text-foreground")}>
                  {c.cost}
                </span>
                <span>{c.level}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" /> ~{c.hours} hours
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {c.mode}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5" /> {c.rating}
                </span>
              </div>
              <a
                href={c.url}
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium underline underline-offset-4"
              >
                View learning path <ExternalLink className="size-3.5" />
              </a>
            </article>
          ))}
          {courses.length === 0 && (
            <p className="text-[13px] text-muted-foreground">
              No learning paths match these filters. Try clearing a filter.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
