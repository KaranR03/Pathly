import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const HeroMap = lazy(() => import("./HeroMap.client"));

export function HeroMapBackdrop() {
  return (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <HeroMap />
      </Suspense>
    </ClientOnly>
  );
}
