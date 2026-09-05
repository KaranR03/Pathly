import { Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CITIES } from "@/data/jobs";
import { SAMPLE_QUERIES, interpretQuery } from "@/lib/nl-search";
import { usePathly } from "@/lib/pathly-store";

export function SearchBar({
  onFocusCity,
}: {
  onFocusCity: (city: { lat: number; lng: number; zoom: number }) => void;
}) {
  const { filters, setFilters, setSimulatedSkill } = usePathly();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const run = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const result = interpretQuery(text);
    setFilters(result.patch);
    if (result.simulateSkill) setSimulatedSkill(result.simulateSkill);
    const city = CITIES.find((c) => c.name === result.patch.city);
    if (city) onFocusCity({ lat: city.lat, lng: city.lng, zoom: city.zoom });
    toast(result.explanation, {
      description: result.simulateSkill
        ? `Opportunity simulator on: ${result.simulateSkill}`
        : "Interpreted by Pathly AI search",
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="glass flex h-12 items-center gap-2 rounded-full px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 140)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run(value);
          }}
          placeholder="Search roles, suburbs, or ask a question"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
        />
        {(value || filters.query) && (
          <button
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              setFilters({ query: "" });
            }}
            className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="glass animate-rise absolute top-14 right-0 left-0 z-20 rounded-3xl p-2">
          <p className="px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Ask Pathly AI
          </p>
          {SAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setValue(q);
                run(q);
              }}
              className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-accent"
            >
              <Sparkles className="size-3.5 shrink-0 text-muted-foreground" />
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
