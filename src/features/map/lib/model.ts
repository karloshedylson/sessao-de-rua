import { distanceKm, walkMinutes } from "@/lib/geo";
import type { Cinema } from "@/types";
import { EDGE_LABELS, LANDMARKS, NEIGHBORHOODS } from "../data/landmarks";
import { LABEL_LEFT, METRO_LINES, STATIONS } from "../data/metro";
import { ROUTES } from "../data/routes";
import { PARKS, STREETS } from "../data/streets";
import type { LatLng } from "../types";

/** Dimensões do espaço SVG do mapa. */
export const MAP_W = 1000;
export const MAP_H = 781;

type Point = [number, number];

/** lat/lng → coordenadas SVG (recorte fixo do centro expandido de São Paulo). */
export function project(lat: number, lng: number): Point {
  return [
    Math.round(((lng + 46.7) / 0.074) * MAP_W * 10) / 10,
    Math.round(((-23.527 - lat) / 0.053) * MAP_H * 10) / 10,
  ];
}

/** Inverso de `project`: coordenadas SVG → [lng, lat]. */
export function unproject(x: number, y: number): [lng: number, lat: number] {
  return [(x / MAP_W) * 0.074 - 46.7, -23.527 - (y / MAP_H) * 0.053];
}

/** "x,y x,y …" (formato das polilinhas do modelo) → lista de [lng, lat]. */
export function pointsToLngLat(points: string): [number, number][] {
  return points.split(" ").map((p) => {
    const [x, y] = p.split(",").map(Number);
    return unproject(x, y);
  });
}

/** Enquadramento inicial do mapa: [[oeste, sul], [leste, norte]] (o mesmo recorte do desenho). */
export const FULL_BOUNDS: [[number, number], [number, number]] = [
  [-46.7, -23.58],
  [-46.626, -23.527],
];

/** Pixels SVG por km no recorte. */
export const PX_PER_KM = MAP_W / (0.074 * 111.32 * Math.cos((23.55 * Math.PI) / 180));

const toPoints = (pts: Point[]) => pts.map((p) => p.join(",")).join(" ");

export type MetroLineRef = { color: string; name: string };
export type Station = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  /** Estação de integração (mais de uma linha). */
  interchange: boolean;
  labelLeft: boolean;
};
export type NearestStation = { id: string; name: string; km: number; min: number; lines: MetroLineRef[] };
export type WalkEdge = {
  a: string;
  b: string;
  km: number;
  min: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mx: number;
  my: number;
};
export type MapStreet = { name: string; kind: string; points: string; lx: number; ly: number; angle: number };
export type MapPark = {
  name: string;
  cx: number;
  cy: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  kind: string;
  big: boolean;
  labelY: number;
};
export type MapRoute = {
  id: string;
  name: string;
  mode: "walk" | "metro";
  points: string;
  stops: string[];
  stationIds: string[];
  pairs: [string, string][];
  meta: string;
};

export type MapModel = {
  cinemaPoints: Record<string, Point>;
  stations: Station[];
  lines: { color: string; points: string }[];
  nearest: Record<string, NearestStation>;
  walkEdges: WalkEdge[];
  streets: MapStreet[];
  parks: MapPark[];
  hoods: { name: string; x: number; y: number }[];
  landmarks: { name: string; x: number; y: number; side: 1 | -1 }[];
  edgeLabels: { text: string; x: number; y: number; className: string }[];
  routes: MapRoute[];
};

/** Ponto e ângulo de um rótulo ao longo de uma polilinha, na fração `fr` do comprimento. */
function labelAlong(pp: Point[], fr: number) {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < pp.length; i++) {
    const d = Math.hypot(pp[i][0] - pp[i - 1][0], pp[i][1] - pp[i - 1][1]);
    seg.push(d);
    total += d;
  }
  let t = total * fr;
  for (let i = 0; i < seg.length; i++) {
    if (t <= seg[i] || i === seg.length - 1) {
      const a = pp[i];
      const b = pp[i + 1];
      const u = Math.min(1, t / seg[i]);
      let ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
      if (ang > 90) ang -= 180;
      if (ang < -90) ang += 180;
      return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, angle: ang };
    }
    t -= seg[i];
  }
  return { x: pp[0][0], y: pp[0][1], angle: 0 };
}

/** Monta toda a geometria derivada do mapa a partir dos cinemas. Função pura. */
export function buildMapModel(cinemas: Cinema[]): MapModel {
  const cinemaPoints: Record<string, Point> = {};
  const byId: Record<string, Cinema> = {};
  for (const c of cinemas) {
    cinemaPoints[c.id] = project(c.lat, c.lng);
    byId[c.id] = c;
  }

  const lineRefs: Record<string, MetroLineRef[]> = {};
  for (const l of METRO_LINES) {
    for (const id of l.st) (lineRefs[id] ||= []).push({ color: l.color, name: l.name });
  }

  const stations: Station[] = Object.entries(STATIONS).map(([id, [name, lat, lng]]) => {
    const [x, y] = project(lat, lng);
    return {
      id,
      name,
      lat,
      lng,
      x,
      y,
      interchange: (lineRefs[id] || []).length > 1 || id === "paulista" || id === "consol",
      labelLeft: !!LABEL_LEFT[id],
    };
  });
  const stationById: Record<string, Station> = {};
  for (const s of stations) stationById[s.id] = s;

  const lines = METRO_LINES.map((l) => {
    const pts: Point[] = [];
    if (l.pre) pts.push(project(l.pre[0], l.pre[1]));
    for (const id of l.st) pts.push([stationById[id].x, stationById[id].y]);
    if (l.post) pts.push(project(l.post[0], l.post[1]));
    return { color: l.color, points: toPoints(pts) };
  });
  // Conexão Paulista ↔ Consolação (baldeação entre as linhas 2 e 4).
  const paulista = stationById.paulista;
  const consol = stationById.consol;
  lines.push({ color: "#9AA0A6", points: `${paulista.x},${paulista.y} ${consol.x},${consol.y}` });

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

  const walkEdges: WalkEdge[] = [];
  for (let i = 0; i < cinemas.length; i++) {
    for (let j = i + 1; j < cinemas.length; j++) {
      const a = cinemas[i];
      const b = cinemas[j];
      const km = distanceKm(a.lat, a.lng, b.lat, b.lng);
      if (km > 2.0) continue;
      const pa = cinemaPoints[a.id];
      const pb = cinemaPoints[b.id];
      walkEdges.push({
        a: a.id,
        b: b.id,
        km,
        min: walkMinutes(km),
        x1: pa[0],
        y1: pa[1],
        x2: pb[0],
        y2: pb[1],
        mx: (pa[0] + pb[0]) / 2,
        my: (pa[1] + pb[1]) / 2,
      });
    }
  }

  const streets: MapStreet[] = STREETS.map((s) => {
    const pp = s.path.map(([lat, lng]: LatLng) => project(lat, lng));
    const lp = labelAlong(pp, s.labelAt);
    return { name: s.name, kind: s.kind, points: toPoints(pp), lx: lp.x, ly: lp.y, angle: lp.angle };
  });

  const parks: MapPark[] = PARKS.map((p) => {
    const [cx, cy] = project(p.lat, p.lng);
    const w = (p.widthM / 1000) * PX_PER_KM;
    const h = (p.heightM / 1000) * PX_PER_KM;
    return {
      name: p.name,
      cx,
      cy,
      x: +(cx - w / 2).toFixed(1),
      y: +(cy - h / 2).toFixed(1),
      w: +w.toFixed(1),
      h: +h.toFixed(1),
      rotate: p.rotate,
      kind: p.kind,
      big: p.big,
      labelY: p.name.includes("Ibirapuera") ? cy - h / 2 + 14 : cy,
    };
  });

  const routes: MapRoute[] = ROUTES.map((r) => {
    const pts: Point[] = r.path.map((ref) => {
      const id = ref.slice(2);
      return ref[0] === "c" ? cinemaPoints[id] : [stationById[id].x, stationById[id].y];
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
      points: toPoints(pts),
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
    streets,
    parks,
    hoods: NEIGHBORHOODS.map((h) => {
      const [x, y] = project(h.lat, h.lng);
      return { name: h.name, x, y };
    }),
    landmarks: LANDMARKS.map((m) => {
      const [x, y] = project(m.lat, m.lng);
      return { name: m.name, x, y, side: m.side };
    }),
    edgeLabels: EDGE_LABELS,
    routes,
  };
}
