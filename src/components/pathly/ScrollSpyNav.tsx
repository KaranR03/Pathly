import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "why", label: "Why sign in" },
  { id: "how-it-works", label: "How it works" },
  { id: "simulator", label: "Get started" },
] as const;

export function ScrollSpyNav() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Page sections"
      className="fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex"
    >
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="group flex items-center gap-2.5"
        >
          <span
            className={cn(
              "glass max-w-0 overflow-hidden rounded-full px-0 py-1 text-[11px] font-medium whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-[140px] group-hover:px-2.5 group-hover:opacity-100",
              active === s.id && "max-w-[140px] px-2.5 opacity-100",
            )}
          >
            {s.label}
          </span>
          <span
            className={cn(
              "size-2 shrink-0 rounded-full border border-foreground/30 bg-background/70 transition-all",
              active === s.id
                ? "scale-125 border-foreground bg-foreground"
                : "group-hover:bg-foreground/40",
            )}
          />
        </a>
      ))}
    </nav>
  );
}
