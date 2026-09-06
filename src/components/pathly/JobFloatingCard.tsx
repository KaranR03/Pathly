import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Check, Sparkles, X } from "lucide-react";
import type { Job } from "@/data/jobs";
import { formatSalary } from "@/lib/matching";
import { usePathly } from "@/lib/pathly-store";
import { MatchBadge } from "./MatchBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TRACKING_STAGE } from "@/lib/application-stages";

export function JobFloatingCard({
  job,
  onClose,
  onOpenDetails,
}: {
  job: Job;
  onClose: () => void;
  onOpenDetails: () => void;
}) {
  const { matchFor, savedJobIds, toggleSaved, setStage } = usePathly();
  const match = matchFor(job);
  const saved = savedJobIds.includes(job.id);

  return (
    <div className="animate-rise glass w-[min(360px,calc(100vw-2rem))] rounded-3xl p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{job.title}</p>
          <p className="truncate text-[13px] text-muted-foreground">
            {job.company}
          </p>
          <p className="truncate text-[12px] text-muted-foreground">
            {job.suburb} {job.state}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close job card"
          className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <MatchBadge score={match.score} tier={match.tier} />
        <span className="text-[12px] text-muted-foreground">
          {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-[12px]">
        {match.matched.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Skills matched
            </p>
            <div className="flex flex-wrap gap-1.5">
              {match.matched.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full bg-strong-soft px-2 py-0.5 text-strong"
                >
                  <Check className="size-3" /> {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {[...match.missing, ...match.missingPreferred].length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Skills to strengthen
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[...match.missing, ...match.missingPreferred]
                .slice(0, 4)
                .map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 rounded-full"
          onClick={onOpenDetails}
        >
          View job
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full"
          onClick={() => {
            if (job.source === "employer") {
              // Real employer-posted jobs require the verified-apply flow in the job detail drawer.
              onOpenDetails();
              return;
            }
            setStage(job.id, TRACKING_STAGE);
            toast.success("Added to your tracker", {
              description: `${job.title} · ${job.company}`,
            });
          }}
        >
          Track
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label={saved ? "Remove saved job" : "Save job"}
          className="rounded-full"
          onClick={() => toggleSaved(job.id)}
        >
          {saved ? (
            <BookmarkCheck className="size-4" />
          ) : (
            <Bookmark className="size-4" />
          )}
        </Button>
      </div>
      <Link
        to="/career-gap"
        className="mt-2 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Sparkles className="size-3.5" /> Analyse skill gap
      </Link>
    </div>
  );
}
