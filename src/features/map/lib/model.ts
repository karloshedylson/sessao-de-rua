import type { CityConfig } from "@/features/cities/config";
import { distanceKm, walkMinutes } from "@/lib/geo";
import type { Cinema } from "@/types";
import { LANDMARKS } from "../data/landmarks";
import { LABEL_LEFT, METRO_LINES, STATIONS } from "../data/metro";
import { ROUTES } from "../data/routes";

/** Posição no mapa: `[lng, lat]` (a ordem que o MapLibre usa). */
export type LngLat = [lng: number, lat: number];

export type MetroLineRef = { color: string; name: string };
export type Station = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Estação de integração (mais de uma linha). */
  interchange: boolean;
  labelLeft: boolean;
};
export type NearestStation = { id: string; name: string; km: number; min: number; lines: MetroLineRef[] };
export type WalkEdge = { a: string; b: string; km: number; min: number };
export type MapRoute = {
  id: string;
  name: string;
  mode: "walk" | "metro";
  coords: LngLat[];
  stops: string[];
  stationIds: string[];
  pairs: [string, string][];
  meta: string;
};

export type MapModel = {
  cinemaPoints: Record<string, LngLat>;
  stations: Station[];
  lines: { color: string; coords: LngLat[] }[];
  /** Metrô mais próximo de cada cinema. Vazio nas cidades sem metrô no mapa. */
  nearest: Record<string, NearestStation>;
  walkEdges: WalkEdge[];
  landmarks: { name: string; lng: number; lat: number; side: 1 | -1 }[];
  routes: MapRoute[];
};

/** Monta toda a geometria derivada do mapa a partir dos cinemas da cidade. Função pura. */
export function buildMapModel(cinemas: Cinema[], city: CityConfig): MapModel {
  const cinemaPoints: Record<string, LngLat> = {};
  const byId: Record<string, Cinema> = {};
  for (const c of cinemas) {
    cinemaPoints[c.id] = [c.lng, c.lat];
    byId[c.id] = c;
  }

  // Distâncias a pé entre cinemas valem em qualquer cidade (até 2 km, como antes).
  const walkEdges: WalkEdge[] = [];
  for (let i = 0; i < cinemas.length; i++) {
    for (let j = i + 1; j < cinemas.length; j++) {
      const a = cinemas[i];
      const b = cinemas[j];
      const km = distanceKm(a.lat, a.lng, b.lat, b.lng);
      if (km > 2.0) continue;
      walkEdges.push({ a: a.id, b: b.id, km, min: walkMinutes(km) });
    }
  }

  if (!city.hasMetro) {
    return { cinemaPoints, stations: [], lines: [], nearest: {}, walkEdges, landmarks: [], routes: [] };
  }

  const lineRefs: Record<string, MetroLineRef[]> = {};
  for (const l of METRO_LINES) {
    for (const id of l.st) (lineRefs[id] ||= []).push({ color: l.color, name: l.name });
  }

  const stations: Station[] = Object.entries(STATIONS).map(([id, [name, lat, lng]]) => ({
    id,
    name,
    lat,
    lng,
    interchange: (lineRefs[id] || []).length > 1 || id === "paulista" || id === "consol",
    labelLeft: !!LABEL_LEFT[id],
  }));
  const stationById: Record<string, Station> = {};
  for (const s of stations) stationById[s.id] = s;

  const lines = METRO_LINES.map((l) => {
    const pts: LngLat[] = [];
    if (l.pre) pts.push([l.pre[1], l.pre[0]]);
    for (const id of l.st) pts.push([stationById[id].lng, stationById[id].lat]);
    if (l.post) pts.push([l.post[1], l.post[0]]);
    return { color: l.color, coords: pts };
  });
  // Conexão Paulista ↔ Consolação (baldeação entre as linhas 2 e 4).
  const paulista = stationById.paulista;
  const consol = stationById.consol;
  lines.push({
    color: "#9AA0A6",
    coords: [
      [paulista.lng, paulista.lat],
      [consol.lng, consol.lat],
    ],
  });

  const nearest: Record<string, NearestStation> = {};
  for (const c of cinemas) {
    let best: { id: string; name: string; km: number } | null = null;
    for (const s of stations) {
      const km = distanceKm(c.lat, c.lng, s.lat, s.lng);
      if (!best || km < best.km) best = { id: s.id, name: s.name, km };
    }
    if (!best) continue;
    nearest[c.id] = {
      ...best,
      min: walkMinutes(best.km),
      lines: lineRefs[best.id] || [{ color: "#00876A", name: "Linha 2-Verde" }],
    };
  }

  const routes: MapRoute[] = ROUTES.map((r) => {
    const coords: LngLat[] = r.path.map((ref) => {
      const id = ref.slice(2);
      return ref[0] === "c" ? cinemaPoints[id] : [stationById[id].lng, stationById[id].lat];
    });
    const stops = r.path.filter((x) => x[0] === "c").map((x) => x.slice(2));
    const pairs: [string, string][] = [];
    for (let i = 1; i < stops.length; i++) pairs.push([stops[i - 1], stops[i]]);
    let meta: string;
    if (r.mode === "walk") {
      const min = pairs.reduce(
        (sum, [a, b]) => sum + walkMinutes(distanceKm(byId[a].lat, byId[a].lng, byId[b].lat, byId[b].lng)),
        0,
      );
      meta = `${stops.length} salas · ${min} min a pé`;
    } else {
      meta = `${stops.length} salas · ${r.via}`;
    }
    return {
      id: r.id,
      name: r.name,
      mode: r.mode,
      coords,
      stops,
      stationIds: r.path.filter((x) => x[0] === "s").map((x) => x.slice(2)),
      pairs,
      meta,
    };
  });

  return {
    cinemaPoints,
    stations,
    lines,
    nearest,
    walkEdges,
    landmarks: LANDMARKS.map((m) => ({ name: m.name, lng: m.lng, lat: m.lat, side: m.side })),
    routes,
  };
}
