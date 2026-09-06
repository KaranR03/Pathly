import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  Check,
  Clock,
  MapPin,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Job } from "@/data/jobs";
import { formatSalary } from "@/lib/matching";
import { usePathly } from "@/lib/pathly-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MatchBadge, MatchRing } from "./MatchBadge";
import { TRACKING_STAGE } from "@/lib/application-stages";
import { ApplyDialog } from "./ApplyDialog";

export function JobDrawer({
  job,
  open,
  onOpenChange,
  onSelectJob,
}: {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectJob?: (jobId: string) => void;
}) {
  const {
    matchFor,
    savedJobIds,
    toggleSaved,
    setStage,
    jobs,
    markViewed,
    gapAnalysis,
    applications,
  } = usePathly();
  const [applyOpen, setApplyOpen] = useState(false);

  if (!job) return null;
  const match = matchFor(job);
  const saved = savedJobIds.includes(job.id);
  const isRealEmployerJob = job.source === "employer";
  const isTracked = applications.some((a) => a.jobId === job.id);
  const missingAll = [...match.missing, ...match.missingPreferred];
  const nearby = jobs
    .filter((j) => j.id !== job.id && j.city === job.city)
    .slice(0, 4);
  const gapImpact = gapAnalysis.gaps.find((g) => missingAll.includes(g.skill));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto border-l border-border/70 bg-card p-0 sm:max-w-[460px]"
      >
        <div className="sticky top-0 z-10 border-b border-border/60 bg-card/85 px-6 pt-6 pb-4 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] leading-tight font-semibold">
                {job.title}
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {job.company}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {job.suburb} {job.state}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wallet className="size-3.5" />{" "}
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" /> {job.jobType} ·{" "}
                  {job.arrangement}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {job.postedDaysAgo === 0
                    ? "Posted today"
                    : `Posted ${job.postedDaysAgo}d ago`}
                </span>
              </div>
            </div>
            <MatchRing score={match.score} tier={match.tier} />
          </div>

          <div className="mt-4 flex gap-2">
            {!isRealEmployerJob && isTracked ? (
              <Button className="flex-1 rounded-full" asChild>
                <Link to="/applications">Track application</Link>
              </Button>
            ) : (
              <Button
                className="flex-1 rounded-full"
                onClick={() => {
                  if (isRealEmployerJob) {
                    setApplyOpen(true);
                    markViewed(job.id);
                    return;
                  }
                  setStage(job.id, TRACKING_STAGE);
                  markViewed(job.id);
                  toast.success("Applied — now tracking", {
                    description:
                      "Follow its progress from your Applications board.",
                  });
                }}
              >
                {isRealEmployerJob ? "Apply with verification" : "Apply now"}
              </Button>
            )}
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => toggleSaved(job.id)}
            >
              {saved ? (
                <BookmarkCheck className="size-4" />
              ) : (
                <Bookmark className="size-4" />
              )}
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>

        {isRealEmployerJob && (
          <ApplyDialog job={job} open={applyOpen} onOpenChange={setApplyOpen} />
        )}

        <div className="space-y-6 px-6 py-5">
          <section className="rounded-2xl bg-secondary/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Your match
              </p>
              <MatchBadge score={match.score} tier={match.tier} />
            </div>
            <div className="mt-3 grid gap-3 text-[13px]">
              <div>
                <p className="mb-1.5 font-medium">You already match</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.matched.length ? (
                    match.matched.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 rounded-full bg-strong-soft px-2 py-0.5 text-[12px] text-strong"
                      >
                        <Check className="size-3" /> {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-muted-foreground">
                      Add skills to your profile to see overlaps.
                    </span>
                  )}
                </div>
              </div>
              {match.partial.length > 0 && (
                <div>
                  <p className="mb-1.5 font-medium">Partly covered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.partial.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-potential-soft px-2 py-0.5 text-[12px] text-potential"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {missingAll.length > 0 && (
                <div>
                  <p className="mb-1.5 font-medium">Skills to strengthen</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingAll.map((s) => (
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
              {match.experienceGap > 0 && (
                <p className="text-[12px] text-muted-foreground">
                  Experience gap: the employer prefers {job.yearsPreferred}{" "}
                  years of experience.
                </p>
              )}
              {match.tier !== "strong" && (
                <p className="rounded-xl bg-card p-3 text-[12px] leading-relaxed text-muted-foreground">
                  You can still apply. These are the areas where strengthening
                  your profile could improve your competitiveness.
                </p>
              )}
            </div>
          </section>

          {gapImpact && (
            <section>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Career gap impact
              </p>
              <p className="mt-2 text-[13px] leading-relaxed">
                Learning{" "}
                <span className="font-semibold">{gapImpact.skill}</span> could
                lift your strong matches from{" "}
                <span className="font-semibold">{gapImpact.currentStrong}</span>{" "}
                to{" "}
                <span className="font-semibold text-strong">
                  {gapImpact.projectedStrong}
                </span>
                .
              </p>
              <Link
                to="/career-gap"
                className="mt-2 inline-block text-[13px] font-medium underline underline-offset-4"
              >
                Build missing skills
              </Link>
            </section>
          )}

          {job.companyBlurb && (
            <section>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                About the company
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {job.companyBlurb}
              </p>
            </section>
          )}

          <section>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              About the role
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {job.description}
            </p>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Required skills
              </p>
              <ul className="mt-2 space-y-1 text-[13px]">
                {job.required.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Preferred skills
              </p>
              <ul className="mt-2 space-y-1 text-[13px] text-muted-foreground">
                {job.preferred.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Similar jobs nearby
            </p>
            <div className="mt-2 divide-y divide-border/70">
              {nearby.map((n) => {
                const m = matchFor(n);
                return (
                  <button
                    key={n.id}
                    onClick={() => onSelectJob?.(n.id)}
                    className="flex w-full items-center gap-3 py-2.5 text-left transition-opacity hover:opacity-70"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {n.title}
                      </p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {n.company} · {n.suburb}
                      </p>
                    </div>
                    <MatchBadge
                      score={m.score}
                      tier={m.tier}
                      showLabel={false}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
