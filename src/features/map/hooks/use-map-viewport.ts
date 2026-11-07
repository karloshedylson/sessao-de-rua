"use client";

import { useCallback, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { FULL_BOUNDS, unproject } from "../lib/model";

export const MAX_ZOOM = 17;
const FIT_PADDING = 24;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const anim = () => ({ duration: reducedMotion() ? 0 : 400 });

/**
 * Controle de zoom e enquadramento do mapa real (MapLibre). Mantém a mesma API do antigo mapa SVG:
 * `focusOn` e `fitPoints` recebem coordenadas do espaço SVG do modelo e são convertidas para lng/lat.
 */
export function useMapViewport() {
  const mapRef = useRef<MapRef | null>(null);
  const fullZoom = useRef<number | null>(null);
  const [flags, setFlags] = useState({ isFull: true, atMaxZoom: false });

  /** Recalcula `isFull`/`atMaxZoom`; só re-renderiza quando algum valor muda. */
  const sync = useCallback(() => {
    const m = mapRef.current;
    if (!m || fullZoom.current === null) return;
    const z = m.getZoom();
    const next = { isFull: z <= fullZoom.current + 0.05, atMaxZoom: z >= MAX_ZOOM - 0.05 };
    setFlags((prev) => (prev.isFull === next.isFull && prev.atMaxZoom === next.atMaxZoom ? prev : next));
  }, []);

  /** Chamado quando o mapa terminou de carregar: o zoom do enquadramento inicial é o "mapa inteiro". */
  const onReady = useCallback(() => {
    const m = mapRef.current;
    if (!m) return;
    fullZoom.current = m.getZoom();
    m.getMap().setMinZoom(Math.max(10, fullZoom.current - 0.3));
    sync();
  }, [sync]);

  const reset = useCallback(() => {
    mapRef.current?.fitBounds(FULL_BOUNDS, { padding: FIT_PADDING, ...anim() });
  }, []);

  const focusOn = useCallback(([x, y]: [number, number]) => {
    const m = mapRef.current;
    if (!m) return;
    const min = (fullZoom.current ?? 12) + 1.6;
    m.easeTo({ center: unproject(x, y), zoom: Math.max(m.getZoom(), min), ...anim() });
  }, []);

  const fitPoints = useCallback((pts: [number, number][]) => {
    const m = mapRef.current;
    if (!m || !pts.length) return;
    const lngLat = pts.map(([x, y]) => unproject(x, y));
    const lngs = lngLat.map((p) => p[0]);
    const lats = lngLat.map((p) => p[1]);
    m.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 70, maxZoom: 16, ...anim() },
    );
  }, []);

  /** Callback de `ref` do componente do mapa: guarda a instância para os controles. */
  const attachMap = useCallback((instance: MapRef | null) => {
    mapRef.current = instance;
  }, []);

  return {
    attachMap,
    onReady,
    onMove: sync,
    isFull: flags.isFull,
    atMaxZoom: flags.atMaxZoom,
    zoomIn: () => mapRef.current?.zoomIn(anim()),
    zoomOut: () => mapRef.current?.zoomOut(anim()),
    reset,
    focusOn,
    fitPoints,
  };
}

export type MapViewport = ReturnType<typeof useMapViewport>;
