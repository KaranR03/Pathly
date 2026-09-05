import * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { PATHLY_BASEMAP_STYLE } from "./JobMap.client";

// Purely decorative, non-interactive backdrop — no job data, no pins, no controls.
export default function HeroMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: PATHLY_BASEMAP_STYLE,
      center: [134, -26],
      zoom: 3.4,
      interactive: false,
      attributionControl: false,
    });
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
    };
  }, []);

  return <div ref={containerRef} aria-hidden className="h-full w-full" />;
}
