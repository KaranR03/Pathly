import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import type { JobMapProps } from "./JobMap.client";

const JobMap = lazy(() => import("./JobMap.client"));

function MapSkeleton() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-muted/60">
      <div className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground uppercase">
        <span className="size-1.5 animate-pulse rounded-full bg-foreground/40" />
        Loading map
      </div>
    </div>
  );
}

export function MapCanvas(props: JobMapProps) {
  return (
    <ClientOnly fallback={<MapSkeleton />}>
      <Suspense fallback={<MapSkeleton />}>
        <JobMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
