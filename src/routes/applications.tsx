import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatSalary } from "@/lib/matching";
import { usePathly, type AppStage } from "@/lib/pathly-store";
import { useAuth } from "@/lib/auth";
import { fetchMyApplications, type ApplicationRecord } from "@/lib/employer-db";
import { AppShell } from "@/components/pathly/AppShell";
import { MatchBadge } from "@/components/pathly/MatchBadge";
import { cn } from "@/lib/utils";
import {
  APPLICATION_PIPELINE_STAGES,
  APPLICATION_STAGES,
} from "@/lib/application-stages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications — Pathly" },
      {
        name: "description",
        content:
          "Track every Australian role you've saved, applied to, interviewed for or been offered, in one clean board.",
      },
      { property: "og:title", content: "Applications — Pathly" },
      {
        property: "og:description",
        content:
          "A calm kanban tracker for your job applications across Australia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationsPage,
});

const authenticityTier = (score: number) =>
  score >= 75 ? "strong" : score >= 45 ? "potential" : "gap";

const tierStyles: Record<string, string> = {
  strong: "bg-strong-soft text-strong",
  potential: "bg-potential-soft text-potential",
  gap: "bg-gap-soft text-gap",
};

function ApplicationsPage() {
  const {
    applications,
    savedJobIds,
    jobs,
    matchFor,
    setStage,
    removeApplication,
    toggleSaved,
  } = usePathly();
  const { user, isGuest } = useAuth();
  const [verified, setVerified] = useState<Map<string, ApplicationRecord>>(
    new Map(),
  );

  useEffect(() => {
    if (!user || isGuest) {
      setVerified(new Map());
      return;
    }
    void fetchMyApplications(user.id).then((rows) => {
      setVerified(new Map(rows.map((r) => [r.jobId, r])));
    });
  }, [user, isGuest]);

  const savedApplicationIds = applications
    .filter((application) => application.stage === "Saved")
    .map((application) => application.jobId);
  const savedIds = Array.from(
    new Set([...savedJobIds, ...savedApplicationIds]),
  );

  const cards = APPLICATION_STAGES.map((stage) => {
    const items =
      stage === "Saved"
        ? savedIds
            .filter(
              (id) =>
                !applications.some(
                  (application) =>
                    application.jobId === id && application.stage !== "Saved",
                ),
            )
            .map(
              (id) =>
                applications.find(
                  (application) =>
                    application.jobId === id && application.stage === "Saved",
                ) ?? { jobId: id, stage: "Saved" as AppStage, date: "" },
            )
        : applications.filter((a) => a.stage === stage);
    return { stage, items };
  });

  const total = cards.reduce((n, c) => n + c.items.length, 0);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
          Applications
        </p>
        <h1 className="mt-1.5 text-[28px] font-semibold sm:text-[34px]">
          Your pipeline
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          {total === 0
            ? "Save or apply to a role on the map and it will appear here."
            : `${total} opportunities in progress.`}
        </p>

        <div className="mt-7 grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map(({ stage, items }) => (
            <section key={stage} className="rounded-3xl bg-secondary/50 p-3">
              <div className="flex items-center justify-between px-1.5 pb-2">
                <p className="text-[12px] font-semibold">{stage}</p>
                <span className="text-[12px] text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {items.map((a) => {
                  const job = jobs.find((j) => j.id === a.jobId);
                  if (!job) return null;
                  const m = matchFor(job);
                  const hasSavedApplication = applications.some(
                    (application) =>
                      application.jobId === job.id && application.stage === "Saved",
                  );
                  return (
                    <article
                      key={a.jobId}
                      className="rounded-2xl border border-border/70 bg-card p-3 shadow-[var(--shadow-soft)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">
                            {job.title}
                          </p>
                          <p className="truncate text-[12px] text-muted-foreground">
                            {job.company}
                          </p>
                        </div>
                        <button
                          aria-label="Remove"
                          onClick={() => {
                            if (stage === "Saved") {
                              if (savedJobIds.includes(job.id)) toggleSaved(job.id);
                              if (hasSavedApplication) removeApplication(job.id);
                              return;
                            }
                            removeApplication(job.id);
                          }}
                          className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {job.suburb} {job.state} ·{" "}
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </p>
                      {a.date && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Updated {a.date}
                        </p>
                      )}
                      {verified.get(job.id)?.verification && (
                        <p
                          className={cn(
                            "mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            tierStyles[
                              authenticityTier(
                                verified.get(job.id)!.verification!
                                  .authenticityScore,
                              )
                            ],
                          )}
                        >
                          Verified{" "}
                          {
                            verified.get(job.id)!.verification!
                              .authenticityScore
                          }
                          %
                        </p>
                      )}
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <MatchBadge
                          score={m.score}
                          tier={m.tier}
                          showLabel={false}
                        />
                        <Select
                          value={stage}
                          onValueChange={(v) => setStage(job.id, v as AppStage)}
                        >
                          <SelectTrigger className="h-7 rounded-full border-border px-2.5 text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {APPLICATION_PIPELINE_STAGES.map((s) => (
                              <SelectItem
                                key={s}
                                value={s}
                                className="text-[12px]"
                              >
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </article>
                  );
                })}
                {items.length === 0 && (
                  <p className="px-1.5 py-4 text-[12px] text-muted-foreground">
                    Nothing here yet.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
