import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { ALL_INDUSTRIES, ALL_SKILLS, AUSTRALIA_VIEW, CITIES } from "@/data/jobs";
import { usePathly, type Filters } from "@/lib/pathly-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function activeFilterCount(f: Filters) {
  return (
    f.jobTypes.length +
    f.arrangements.length +
    f.experience.length +
    f.industries.length +
    f.skills.length +
    f.companySizes.length +
    f.tiers.length +
    (f.minSalary ? 1 : 0) +
    (f.city ? 1 : 0)
  );
}

export function FilterPanel({
  onFocusCity,
}: {
  onFocusCity?: (view: { lat: number; lng: number; zoom: number }) => void;
}) {
  const { filters, setFilters, resetFilters, filteredJobs } = usePathly();
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters);

  const toggle = <K extends keyof Filters>(key: K, value: Filters[K] extends (infer U)[] ? U : never) => {
    const list = filters[key] as unknown as unknown[];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    setFilters({ [key]: next } as unknown as Partial<Filters>);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="glass inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium">
          <SlidersHorizontal className="size-4" />
          Filters
          {count > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-foreground text-[10px] text-background">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full gap-0 overflow-y-auto bg-card p-0 sm:max-w-[380px]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/85 px-6 py-4 backdrop-blur-xl">
          <div>
            <h2 className="text-[16px] font-semibold">Filters</h2>
            <p className="text-[12px] text-muted-foreground">
              {filteredJobs.length} opportunities shown
            </p>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={resetFilters}>
            Reset
          </Button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <Group label="AI match">
            {(["strong", "potential", "gap"] as const).map((t) => (
              <Chip key={t} active={filters.tiers.includes(t)} onClick={() => toggle("tiers", t)}>
                {t === "strong" ? "Strong match" : t === "potential" ? "Potential match" : "Skill gap"}
              </Chip>
            ))}
          </Group>

          <Group label="City">
            {CITIES.map((c) => (
              <Chip
                key={c.name}
                active={filters.city === c.name}
                onClick={() => {
                  const active = filters.city === c.name;
                  setFilters({ city: active ? null : c.name });
                  onFocusCity?.(active ? AUSTRALIA_VIEW : { lat: c.lat, lng: c.lng, zoom: c.zoom });
                }}
              >
                {c.name}
              </Chip>
            ))}
          </Group>

          <Group label="Job type">
            {(
              ["Full-time", "Part-time", "Casual", "Contract", "Internship", "Graduate"] as const
            ).map((t) => (
              <Chip key={t} active={filters.jobTypes.includes(t)} onClick={() => toggle("jobTypes", t)}>
                {t}
              </Chip>
            ))}
          </Group>

          <Group label="Work arrangement">
            {(["On-site", "Hybrid", "Remote"] as const).map((t) => (
              <Chip
                key={t}
                active={filters.arrangements.includes(t)}
                onClick={() => toggle("arrangements", t)}
              >
                {t}
              </Chip>
            ))}
          </Group>

          <Group label="Experience">
            {(["No experience", "Entry level", "Junior", "Mid-level", "Senior"] as const).map((t) => (
              <Chip
                key={t}
                active={filters.experience.includes(t)}
                onClick={() => toggle("experience", t)}
              >
                {t}
              </Chip>
            ))}
          </Group>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Minimum salary
              </p>
              <span className="text-[12px] font-medium">
                {filters.minSalary ? `$${(filters.minSalary / 1000).toFixed(0)}k AUD` : "Any"}
              </span>
            </div>
            <Slider
              value={[filters.minSalary]}
              min={0}
              max={160000}
              step={5000}
              onValueChange={([v]) => setFilters({ minSalary: v ?? 0 })}
            />
          </div>

          <Group label="Company size">
            {(["Startup", "Small", "Medium", "Large"] as const).map((t) => (
              <Chip
                key={t}
                active={filters.companySizes.includes(t)}
                onClick={() => toggle("companySizes", t)}
              >
                {t}
              </Chip>
            ))}
          </Group>

          <Group label="Industry">
            {ALL_INDUSTRIES.map((t) => (
              <Chip
                key={t}
                active={filters.industries.includes(t)}
                onClick={() => toggle("industries", t)}
              >
                {t}
              </Chip>
            ))}
          </Group>

          <Group label="Skills">
            {ALL_SKILLS.map((t) => (
              <Chip key={t} active={filters.skills.includes(t)} onClick={() => toggle("skills", t)}>
                {t}
              </Chip>
            ))}
          </Group>
        </div>

        <div className="sticky bottom-0 border-t border-border/60 bg-card/90 px-6 py-4 backdrop-blur-xl">
          <Button className="w-full rounded-full" onClick={() => setOpen(false)}>
            Show {filteredJobs.length} opportunities
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
