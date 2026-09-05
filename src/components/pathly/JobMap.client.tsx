import * as maplibregl from "maplibre-gl";
import type { Map as MlMap, MapMouseEvent, Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { Job } from "@/data/jobs";
import { TIER_COLOR, type MatchResult } from "@/lib/matching";

export interface JobMapProps {
  jobs: Job[];
  matchFor: (job: Job) => MatchResult;
  mode: "pins" | "heatmap";
  selectedId: string | null;
  unlockedJobIds: string[];
  focus: { lat: number; lng: number; zoom: number } | null;
  onSelect: (jobId: string | null) => void;
}

// Light-grey canvas basemap (key-less raster) — quiet enough for match-coloured pins.
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: "Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#f3f3f1" } },
    { id: "base", type: "raster", source: "base", paint: { "raster-saturation": -0.3 } },
  ],
};

export default function JobMap(props: JobMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const readyRef = useRef(false);
  const propsRef = useRef(props);
  propsRef.current = props;

  // ---- init ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [props.focus?.lng ?? 137.5, props.focus?.lat ?? -27.5],
      zoom: props.focus?.zoom ?? 3.6,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
      "bottom-right",
    );
    // Keep the canvas matched to its container (layout can settle after init).
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    map.on("click", (e: MapMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement | null;
      if (!target?.closest(".pathly-marker")) propsRef.current.onSelect(null);
    });
    map.on("load", () => {
      map.addSource("jobs-heat", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "jobs-heat-layer",
        type: "heatmap",
        source: "jobs-heat",
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 1.2, 12, 2.4],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 18, 9, 40, 14, 70],
          "heatmap-opacity": 0.75,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(255,255,255,0)",
            0.2,
            "rgba(180,205,220,0.55)",
            0.4,
            "rgba(120,175,200,0.7)",
            0.6,
            "rgba(233,196,106,0.8)",
            0.8,
            "rgba(224,138,90,0.85)",
            1,
            "rgba(196,84,63,0.9)",
          ],
        },
      });
      readyRef.current = true;
      syncHeat();
      syncMarkers();
    });
    mapRef.current = map;
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- markers ----
  const syncMarkers = () => {
    const map = mapRef.current;
    if (!map) return;
    const { jobs, matchFor, mode, selectedId, unlockedJobIds, onSelect } = propsRef.current;
    const wanted = new Set(jobs.map((j) => j.id));

    for (const [id, marker] of markersRef.current) {
      if (!wanted.has(id) || mode === "heatmap") {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
    if (mode === "heatmap") return;

    for (const job of jobs) {
      const match = matchFor(job);
      const unlocked = unlockedJobIds.includes(job.id);
      const selected = selectedId === job.id;
      const existing = markersRef.current.get(job.id);
      const el = (existing?.getElement() ?? document.createElement("button")) as HTMLButtonElement;
      if (!existing) {
        el.className = "pathly-marker";
        el.type = "button";
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onSelect(job.id);
        });
      }
      el.setAttribute("data-unlocked", String(unlocked));
      el.setAttribute("aria-label", `${job.title} at ${job.company}, ${match.score}% match`);
      const color = TIER_COLOR[match.tier];
      const size = selected ? 40 : 28;
      el.style.cssText = `width:${size}px;height:${size}px;border-radius:999px;border:2.5px solid #fff;background:${color};box-shadow:0 2px 10px rgba(20,22,28,.28);display:grid;place-items:center;color:#fff;font-size:${
        selected ? 11 : 10
      }px;font-weight:650;letter-spacing:-.02em;padding:0;`;
      el.textContent = `${match.score}`;
      if (!existing) {
        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([job.lng, job.lat])
          .addTo(map);
        markersRef.current.set(job.id, marker);
      }
    }
  };

  const syncHeat = () => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const { jobs, mode } = propsRef.current;
    const src = map.getSource("jobs-heat") as maplibregl.GeoJSONSource | undefined;
    src?.setData({
      type: "FeatureCollection",
      features: jobs.map((j) => ({
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [j.lng, j.lat] },
      })),
    });
    if (map.getLayer("jobs-heat-layer")) {
      map.setLayoutProperty("jobs-heat-layer", "visibility", mode === "heatmap" ? "visible" : "none");
    }
  };

  useEffect(() => {
    if (!readyRef.current) return;
    syncMarkers();
    syncHeat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.jobs, props.mode, props.selectedId, props.unlockedJobIds, props.matchFor]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.focus) return;
    map.flyTo({
      center: [props.focus.lng, props.focus.lat],
      zoom: props.focus.zoom,
      duration: 1400,
      essential: true,
    });
  }, [props.focus]);

  return <div ref={containerRef} className="h-full w-full" />;
}
