"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import { useMemo } from "react";
import MapGL, { Layer, Marker, ScaleControl, Source, type LayerProps } from "react-map-gl/maplibre";
import { useExplorer } from "@/features/explorer/components/explorer-provider";
import type { MapViewport } from "../hooks/use-map-viewport";
import { MAX_ZOOM } from "../hooks/use-map-viewport";
import { buildBasemapStyle } from "../lib/basemap-style";
import { FULL_BOUNDS, pointsToLngLat, unproject } from "../lib/model";

type Props = { viewport: MapViewport; onPickCinema: (id: string) => void };

/** Registra o protocolo `pmtiles://` uma única vez (leitura do arquivo de tiles por Range requests). */
let protocolReady = false;
function ensurePmtilesProtocol() {
  if (protocolReady) return;
  maplibregl.addProtocol("pmtiles", new Protocol().tile);
  // Worker servido pelo próprio projeto (copiado por scripts/copy-maplibre-worker.mjs).
  maplibregl.setWorkerUrl(`${window.location.origin}/map/maplibre-gl-worker.mjs`);
  protocolReady = true;
}

/** Limite de navegação: a área coberta pelo arquivo de tiles ([oeste, sul, leste, norte]). */
const MAX_BOUNDS: [number, number, number, number] = [-46.74, -23.61, -46.6, -23.5];

const INK = "#1b1514";
const GOLD = "#f4b53f";
const FONT = ["Noto Sans Medium"];

/** Largura que cresce com o zoom: [zoom, valor, zoom, valor, …]. */
const byZoom = (...stops: unknown[]) => ["interpolate", ["linear"], ["zoom"], ...stops] as never;

const line = (coords: [number, number][], properties: Record<string, unknown> = {}) => ({
  type: "Feature" as const,
  properties,
  geometry: { type: "LineString" as const, coordinates: coords },
});
const point = (coord: [number, number], properties: Record<string, unknown> = {}) => ({
  type: "Feature" as const,
  properties,
  geometry: { type: "Point" as const, coordinates: coord },
});
const collection = (features: ReturnType<typeof line | typeof point>[]) => ({
  type: "FeatureCollection" as const,
  features,
});

/** Mapa real (tiles Protomaps locais, na paleta ilustrada) com metrô, caminhadas, roteiro e pinos por cima. */
export function MapCanvas({ viewport, onPickCinema }: Props) {
  const { map, data, state, view } = useExplorer();

  // Cliente apenas (este componente é carregado com ssr: false), então `window` existe.
  ensurePmtilesProtocol();
  const style = useMemo(() => buildBasemapStyle(window.location.origin), []);

  const route = state.route ? (map.routes.find((r) => r.id === state.route) ?? null) : null;
  const selected = state.selectedCinema;
  const selectedStation = selected ? map.nearest[selected]?.id : null;
  const nearIds = useMemo(() => new Set(data.cinemas.map((c) => map.nearest[c.id]?.id)), [data.cinemas, map]);

  const metroLines = useMemo(
    () => collection(map.lines.map((l) => line(pointsToLngLat(l.points), { color: l.color }))),
    [map.lines],
  );

  const stations = useMemo(
    () =>
      collection(
        map.stations.map((s) =>
          point([s.lng, s.lat], {
            name: s.name,
            interchange: s.interchange,
            left: s.labelLeft,
            // Rótulo sempre visível nas estações relevantes; as demais só com zoom.
            always: nearIds.has(s.id) || s.id === selectedStation || !!route?.stationIds.includes(s.id),
          }),
        ),
      ),
    [map.stations, nearIds, selectedStation, route],
  );

  const routeLine = useMemo(
    () => (route ? collection([line(pointsToLngLat(route.points))]) : collection([])),
    [route],
  );

  const landmarks = useMemo(
    () =>
      collection(
        map.landmarks.map((m) =>
          point(unproject(m.x, m.y), { name: m.name, left: m.side < 0, minzoom: m.name === "Conjunto Nacional" ? 15 : 0 }),
        ),
      ),
    [map.landmarks],
  );

  const textBase = {
    "text-font": FONT,
    "text-size": byZoom(12, 10, 16, 12),
    "text-allow-overlap": false,
  };

  const layerProps: Record<string, LayerProps> = {
    routeCase: {
      id: "route-case",
      type: "line",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": INK, "line-width": byZoom(12, 8, 16, 14) },
    },
    routeFill: {
      id: "route-fill",
      type: "line",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": GOLD, "line-width": byZoom(12, 4.5, 16, 8) },
    },
    metroCase: {
      id: "metro-case",
      type: "line",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": INK, "line-width": byZoom(12, 5.5, 16, 10) },
    },
    metroLine: {
      id: "metro-line",
      type: "line",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": ["get", "color"], "line-width": byZoom(12, 3, 16, 6) },
    },
    stationDot: {
      id: "station-dot",
      type: "circle",
      paint: {
        "circle-color": "#ffffff",
        "circle-stroke-color": INK,
        "circle-stroke-width": 2,
        // Um único "interpolate" por expressão: a condição vai dentro de cada parada do zoom.
        "circle-radius": byZoom(12, ["case", ["get", "interchange"], 4.5, 3.2], 16, ["case", ["get", "interchange"], 8, 6]),
      },
    },
    stationLabel: {
      id: "station-label",
      type: "symbol",
      filter: ["any", ["get", "always"], [">=", ["zoom"], 14.5]],
      layout: {
        ...textBase,
        "text-field": ["get", "name"],
        "text-anchor": ["case", ["get", "left"], "right", "left"],
        "text-offset": ["case", ["get", "left"], ["literal", [-0.9, 0]], ["literal", [0.9, 0]]],
      },
      paint: { "text-color": INK, "text-halo-color": "#ffffff", "text-halo-width": 2 },
    },
    landmarkDot: {
      id: "landmark-dot",
      type: "circle",
      filter: ["<=", ["get", "minzoom"], ["zoom"]],
      paint: { "circle-color": INK, "circle-radius": 4, "circle-stroke-color": "#fffdf8", "circle-stroke-width": 1.5 },
    },
    landmarkLabel: {
      id: "landmark-label",
      type: "symbol",
      filter: ["<=", ["get", "minzoom"], ["zoom"]],
      layout: {
        ...textBase,
        "text-field": ["get", "name"],
        "text-anchor": ["case", ["get", "left"], "right", "left"],
        "text-offset": ["case", ["get", "left"], ["literal", [-0.8, 0]], ["literal", [0.8, 0]]],
      },
      paint: { "text-color": INK, "text-halo-color": "#fffdf8", "text-halo-width": 2 },
    },
  };

  const pins = data.cinemas
    .map((c) => ({
      c,
      total: view.rowById[c.id]?.total ?? 0,
      isSel: selected === c.id,
      dim: !view.inRoute(c.id),
    }))
    .sort((a, b) => Number(a.isSel) - Number(b.isSel));

  return (
    <div className="map-gl">
      <MapGL
        ref={(instance) => viewport.attachMap(instance)}
        mapLib={maplibregl}
        mapStyle={style}
        initialViewState={{ bounds: FULL_BOUNDS, fitBoundsOptions: { padding: 24 } }}
        maxZoom={MAX_ZOOM}
        minZoom={10}
        maxBounds={MAX_BOUNDS}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        cooperativeGestures
        locale={{
          "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl + rolagem para aproximar o mapa",
          "CooperativeGesturesHandler.MacHelpText": "Use ⌘ + rolagem para aproximar o mapa",
          "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa",
        }}
        attributionControl={{ compact: true }}
        onLoad={(e) => {
          e.target.touchZoomRotate.disableRotation();
          viewport.onReady();
        }}
        onMove={() => viewport.onMove()}        style={{ width: "100%", height: "100%" }}
        aria-label="Mapa do centro expandido de São Paulo com os cinemas de rua, as linhas de metrô e os caminhos a pé entre as salas"
      >
        <ScaleControl position="bottom-left" unit="metric" maxWidth={100} />

        {route && (
          <Source id="route" type="geojson" data={routeLine}>
            <Layer {...layerProps.routeCase} />
            <Layer {...layerProps.routeFill} />
          </Source>
        )}

        <Source id="metro" type="geojson" data={metroLines}>
          <Layer {...layerProps.metroCase} />
          <Layer {...layerProps.metroLine} />
        </Source>
        <Source id="stations" type="geojson" data={stations}>
          <Layer {...layerProps.stationDot} />
          <Layer {...layerProps.stationLabel} />
        </Source>

        <Source id="landmarks" type="geojson" data={landmarks}>
          <Layer {...layerProps.landmarkDot} />
          <Layer {...layerProps.landmarkLabel} />
        </Source>

        {pins.map(({ c, total, isSel, dim }) => (
          <Marker
            key={c.id}
            longitude={c.lng}
            latitude={c.lat}
            anchor="bottom"
            style={{ zIndex: isSel ? 3 : total ? 2 : 1 }}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onPickCinema(c.id);
            }}
          >
            <div
              className={`gl-pin${total ? "" : " zero"}${isSel ? " sel" : ""}${dim ? " dim" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`${c.name}: ${total} ${total === 1 ? "sessão" : "sessões"}`}
              aria-pressed={isSel}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPickCinema(c.id);
                }
              }}
            >
              <svg className="gl-pin-svg" width="32" height="40" viewBox="-16 -40 32 40" aria-hidden="true">
                <ellipse className="pin-sh" cx="0" cy="0" rx="7" ry="3" />
                {isSel && <circle className="pin-pulse" cx="0" cy="-25" r="16" />}
                <path className="pin-b" d="M0 0 C-3 -8 -14 -13 -14 -25 A14 14 0 1 1 14 -25 C14 -13 3 -8 0 0 Z" />
                <text className="pin-n" x="0" y="-20.5">
                  {total}
                </text>
              </svg>
              <span className={`gl-pin-lb ${c.labelSide > 0 ? "r" : "l"}`}>{c.short}</span>
            </div>
          </Marker>
        ))}
      </MapGL>
    </div>
  );
}
