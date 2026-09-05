import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Consistent back affordance. Uses history when there is somewhere to go back to,
 * otherwise falls back to a sensible parent page.
 */
export function BackBar({
  fallbackTo = "/dashboard",
  fallbackLabel = "Dashboard",
  className,
  floating = false,
}: {
  fallbackTo?: string;
  fallbackLabel?: string;
  className?: string;
  floating?: boolean;
}) {
  const router = useRouter();
  const canGoBack = useRouterState({
    select: (s) => s.location.state.__TSR_index !== undefined && s.location.state.__TSR_index > 0,
  });

  const base = cn(
    "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-[13px] font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground",
    floating && "shadow-md",
    className,
  );

  if (canGoBack) {
    return (
      <button type="button" onClick={() => router.history.back()} className={base} aria-label="Go back">
        <ArrowLeft className="size-4" />
        Back
      </button>
    );
  }

  return (
    <Link to={fallbackTo} className={base} aria-label={`Back to ${fallbackLabel}`}>
      <ArrowLeft className="size-4" />
      {fallbackLabel}
    </Link>
  );
}
