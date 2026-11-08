"use client";

import dynamic from "next/dynamic";
import { CloseIcon, MetroIcon, WalkIcon } from "@/components/shared/icons";
import { useExplorer } from "@/features/explorer/components/explorer-provider";
import { useMapViewport } from "../hooks/use-map-viewport";
import { CinemaDetail } from "./cinema-detail";
import { CinemaList } from "./cinema-list";
import { MapControls, MapHint } from "./map-controls";
import { MapLegend } from "./map-legend";

/** O mapa depende de `window` e é pesado (MapLibre): carregado só no navegador, depois da página. */
const MapCanvas = dynamic(() => import("./map-canvas").then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => <div className="map-gl map-loading" aria-busy="true" aria-label="Carregando o mapa" />,
});

export function MapSection() {
  const { map, data, state, patch, city } = useExplorer();
  const viewport = useMapViewport(city.bounds);
  const film = data.films.find((f) => f.id === state.selectedFilm);

  const selectCinema = (id: string, focus: boolean) => {
    patch({ selectedCinema: id });
    if (focus) viewport.focusOn(map.cinemaPoints[id]);
  };
  const togglePin = (id: string) => patch({ selectedCinema: state.selectedCinema === id ? null : id });

  const pickRoute = (id: string) => {
    if (state.route === id) {
      patch({ route: null });
      viewport.reset();
      return;
    }
    const route = map.routes.find((r) => r.id === id);
    if (!route) return;
    patch({ route: id, selectedCinema: null });
    viewport.fitPoints(route.coords);
  };

  return (
    <section className="sec" id="mapa" aria-labelledby="mapa-titulo">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <p className="eyebrow">O circuito</p>
            <h2 id="mapa-titulo">Mapa dos cinemas de rua</h2>
          </div>
        </div>

        {map.routes.length > 0 && (
          <div className="routes" role="group" aria-label="Roteiros sugeridos">
            <span className="routes-l">Roteiros</span>
            {map.routes.map((r) => {
              const on = state.route === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`rchip${on ? " on" : ""}`}
                  aria-pressed={on}
                  onClick={() => pickRoute(r.id)}
                >
                  <span className="ri">{r.mode === "walk" ? <WalkIcon /> : <MetroIcon />}</span>
                  <span className="rn">{r.name}</span>
                  <span className="rm">{r.meta}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mapgrid">
          <div className="maplist">
            <div className="maplist-in">
              {state.selectedCinema ? (
                <CinemaDetail onSelect={(id) => selectCinema(id, true)} />
              ) : (
                <CinemaList onSelect={(id) => selectCinema(id, true)} />
              )}
            </div>
          </div>

          <div className="mapwrap">
            <div className="mapcard">
              {/* `key`: ao trocar de cidade o mapa é recriado (novos tiles e enquadramento). */}
              <MapCanvas key={city.id} viewport={viewport} onPickCinema={togglePin} />
              {!film && <MapHint />}
              {film && (
                <div className="mapfilm">
                  <span>Onde passa: {film.title}</span>
                  <button
                    type="button"
                    onClick={() => patch({ selectedFilm: null })}
                    aria-label="Parar de filtrar pelo filme"
                  >
                    <CloseIcon />
                  </button>
                </div>
              )}
              <MapControls viewport={viewport} />
            </div>
            <MapLegend />
            <p className="mapnote">
              Mapa © OpenStreetMap e Protomaps.{" "}
              {city.hasMetro ? "Estações e cinemas em posições aproximadas." : "Cinemas em posições aproximadas."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
