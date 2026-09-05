import { createFileRoute } from "@tanstack/react-router";
import { Layers, MapPin, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AUSTRALIA_VIEW, CITIES } from "@/data/jobs";
import { usePathly } from "@/lib/pathly-store";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/pathly/AppShell";
import { BackBar } from "@/components/pathly/BackBar";
import { FilterPanel } from "@/components/pathly/FilterPanel";
import { JobDrawer } from "@/components/pathly/JobDrawer";
import { JobFloatingCard } from "@/components/pathly/JobFloatingCard";
import { MapCanvas } from "@/components/pathly/MapCanvas";
import { MatchBadge } from "@/components/pathly/MatchBadge";
import { SearchBar } from "@/components/pathly/SearchBar";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Opportunity Map — Pathly" },
      {
        name: "description",
        content:
          "Explore Australian jobs on an interactive map, with personalised AI match scores for every opportunity.",
      },
      { property: "og:title", content: "Opportunity Map — Pathly" },
      {
        property: "og:description",
        content: "Australian opportunities, mapped around you — with live AI match scoring.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const {
    filteredJobs,
    matchFor,
    unlockedJobIds,
    simulatedSkill,
    setSimulatedSkill,
    filters,
    setFilters,
    markViewed,
  } = usePathly();
  const [mode, setMode] = useState<"pins" | "heatmap">("pins");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const selected = filteredJobs.find((j) => j.id === selectedId) ?? null;

  const density = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of filteredJobs) {
      const key = `${j.suburb}, ${j.city}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const max = Math.max(1, ...counts.values());
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count,
        label:
          count / max > 0.75
            ? "Very high"
            : count / max > 0.5
              ? "High"
              : count / max > 0.28
                ? "Medium"
                : "Emerging",
      }));
  }, [filteredJobs]);

  const tierCounts = useMemo(() => {
    let strong = 0,
      potential = 0,
      gap = 0;
    for (const j of filteredJobs) {
      const t = matchFor(j).tier;
      if (t === "strong") strong++;
      else if (t === "potential") potential++;
      else gap++;
    }
    return { strong, potential, gap };
  }, [filteredJobs, matchFor]);

  return (
    <AppShell bare>
      <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
        <div className="pointer-events-auto absolute top-4 left-4 z-30">
          <BackBar floating />
        </div>
        <MapCanvas
          jobs={filteredJobs}
          matchFor={matchFor}
          mode={mode}
          selectedId={selectedId}
          unlockedJobIds={unlockedJobIds}
          focus={focus}
          onSelect={(id) => {
            setSelectedId(id);
            if (id) markViewed(id);
          }}
        />

        {/* top controls */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-4">
          <div className="pointer-events-auto mx-auto flex w-full max-w-[1400px] flex-col gap-2.5">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 sm:max-w-md">
                <SearchBar onFocusCity={setFocus} />
              </div>
              <FilterPanel />
              <div className="glass hidden h-10 items-center gap-1 rounded-full p-1 sm:flex">
                {(["pins", "heatmap"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-all",
                      mode === m ? "bg-foreground text-background" : "text-muted-foreground",
                    )}
                  >
                    {m === "pins" ? <MapPin className="size-3.5" /> : <Layers className="size-3.5" />}
                    {m === "pins" ? "Pins" : "Heatmap"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setFilters({ city: null });
                  setFocus({ ...AUSTRALIA_VIEW });
                }}
                className="glass rounded-full px-3 py-1.5 text-[12px] font-medium"
              >
                All Australia
              </button>
              {CITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setFilters({ city: c.name });
                    setFocus({ lat: c.lat, lng: c.lng, zoom: c.zoom });
                  }}
                  className={cn(
                    "glass rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                    filters.city === c.name && "bg-foreground/90 text-background",
                  )}
                >
                  {c.name}
                </button>
              ))}
              <div className="sm:hidden">
                <button
                  onClick={() => setMode(mode === "pins" ? "heatmap" : "pins")}
                  className="glass rounded-full px-3 py-1.5 text-[12px] font-medium"
                >
                  {mode === "pins" ? "Heatmap" : "Pins"}
                </button>
              </div>
            </div>

            {simulatedSkill && (
              <div className="glass animate-rise flex w-fit items-center gap-2 rounded-full py-1.5 pr-2 pl-3 text-[12px] font-medium">
                <Sparkles className="size-3.5 text-strong" />
                Simulating {simulatedSkill} · {unlockedJobIds.length} opportunities unlocked
                <button
                  aria-label="Turn off simulation"
                  onClick={() => setSimulatedSkill(null)}
                  className="grid size-5 place-items-center rounded-full hover:bg-accent"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* legend / density */}
        <div className="pointer-events-none absolute bottom-4 left-3 z-20 hidden w-[260px] flex-col gap-2 sm:left-4 lg:flex">
          <div className="glass pointer-events-auto rounded-3xl p-4">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Your match spread
            </p>
            <div className="mt-2.5 space-y-1.5 text-[12px]">
              {(
                [
                  ["strong", "Strong match", tierCounts.strong],
                  ["potential", "Potential match", tierCounts.potential],
                  ["gap", "Skill gap", tierCounts.gap],
                ] as const
              ).map(([tier, label, count]) => (
                <div key={tier} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      tier === "strong" ? "bg-strong" : tier === "potential" ? "bg-potential" : "bg-gap",
                    )}
                  />
                  <span className="flex-1 text-muted-foreground">{label}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          {mode === "heatmap" && (
            <div className="glass animate-rise pointer-events-auto rounded-3xl p-4">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Opportunity density
              </p>
              <div className="mt-2.5 space-y-1.5 text-[12px]">
                {density.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="flex-1 truncate">{d.name}</span>
                    <span className="text-muted-foreground">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* results list */}
        <div className="pointer-events-none absolute top-0 right-0 z-20 hidden h-full w-[330px] flex-col p-4 pt-[104px] xl:flex">
          <div className="glass pointer-events-auto flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
            <div className="border-b border-border/60 px-4 py-3">
              <p className="text-[13px] font-semibold">{filteredJobs.length} opportunities</p>
              <p className="text-[12px] text-muted-foreground">
                {filters.city ?? "Across Australia"}
                {filters.query ? ` · "${filters.query}"` : ""}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredJobs.map((j) => {
                const m = matchFor(j);
                return (
                  <button
                    key={j.id}
                    onClick={() => {
                      setSelectedId(j.id);
                      markViewed(j.id);
                      setFocus({ lat: j.lat, lng: j.lng, zoom: 13 });
                    }}
                    className={cn(
                      "w-full border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-accent/60",
                      selectedId === j.id && "bg-accent/80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{j.title}</p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {j.company} · {j.suburb}
                        </p>
                      </div>
                      <MatchBadge score={m.score} tier={m.tier} showLabel={false} />
                    </div>
                  </button>
                );
              })}
              {filteredJobs.length === 0 && (
                <p className="p-4 text-[13px] text-muted-foreground">
                  No opportunities match these filters yet. Try widening your search.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* floating job card */}
        {selected && (
          <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 xl:left-[calc(50%-160px)]">
            <JobFloatingCard
              job={selected}
              onClose={() => setSelectedId(null)}
              onOpenDetails={() => setDrawerOpen(true)}
            />
          </div>
        )}

        <JobDrawer
          job={selected}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onSelectJob={(id) => setSelectedId(id)}
        />
      </div>
    </AppShell>
  );
}
