import { useEffect, useRef, useState } from "react";

type Pt = { id: string; name: string; lat: number | null; lng: number | null; hasSite: boolean };
declare global { interface Window { google?: any; __initScaleMap?: () => void } }

let loader: Promise<void> | null = null;
function loadMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve) => {
    window.__initScaleMap = () => resolve();
    const s = document.createElement("script");
    const env = import.meta.env as Record<string, string | undefined>;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"]}&loading=async&callback=__initScaleMap&channel=${env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"]}&language=fr`;
    s.async = true;
    document.head.appendChild(s);
  });
  return loader;
}

export function ProspectMap({ points, onSelect }: { points: Pt[]; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadMaps().then(() => {
      if (!ref.current || map.current) return;
      map.current = new window.google.maps.Map(ref.current, {
        center: { lat: 46.6, lng: 2.4 }, zoom: 5, clickableIcons: false, disableDefaultUI: true, zoomControl: true,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const g = window.google.maps;
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];
    const bounds = new g.LatLngBounds();
    points.forEach((p) => {
      if (p.lat == null || p.lng == null) return;
      const m = new g.Marker({
        position: { lat: p.lat, lng: p.lng }, map: map.current, title: p.name,
        icon: { path: g.SymbolPath.CIRCLE, scale: 9, fillColor: p.hasSite ? "#7a8a80" : "#e8622c", fillOpacity: 1, strokeColor: "#1f2e27", strokeWeight: 2 },
      });
      m.addListener("click", () => onSelect(p.id));
      markers.current.push(m);
      bounds.extend({ lat: p.lat, lng: p.lng });
    });
    if (markers.current.length) map.current.fitBounds(bounds, 40);
  }, [ready, points, onSelect]);

  return <div ref={ref} className="h-[420px] w-full rounded-2xl border-2 border-ink bg-muted" />;
}
