import { cn } from "@/lib/utils";
import { TIER_LABEL, type MatchTier } from "@/lib/matching";

const tierClasses: Record<MatchTier, string> = {
  strong: "bg-strong-soft text-strong",
  potential: "bg-potential-soft text-potential",
  gap: "bg-gap-soft text-gap",
};

const dotClasses: Record<MatchTier, string> = {
  strong: "bg-strong",
  potential: "bg-potential",
  gap: "bg-gap",
};

export function MatchBadge({
  score,
  tier,
  className,
  showLabel = true,
}: {
  score: number;
  tier: MatchTier;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tierClasses[tier],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotClasses[tier])} />
      {score}% {showLabel && <span className="font-medium opacity-80">{TIER_LABEL[tier]}</span>}
    </span>
  );
}

export function MatchRing({ score, tier }: { score: number; tier: MatchTier }) {
  const stroke = tier === "strong" ? "var(--strong)" : tier === "potential" ? "var(--potential)" : "var(--gap)";
  const r = 26;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative size-[68px] shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-semibold">{score}%</div>
    </div>
  );
}
