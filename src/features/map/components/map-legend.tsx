"use client";

import { useExplorer } from "@/features/explorer/components/explorer-provider";
import { METRO_LINES } from "../data/metro";

export function MapLegend() {
  const { city, map } = useExplorer();
  return (
    <div className="legend" aria-label="Legenda do mapa">
      <span className="lg">
        <span className="lg-pin" />
        Cinema · nº de sessões
      </span>
      {city.hasMetro &&
        METRO_LINES.map((l) => (
          <span key={l.id} className="lg">
            <span className="lg-line" style={{ background: l.color }} />
            {l.name.replace("Linha ", "")}
          </span>
        ))}
      {map.routes.length > 0 && (
        <span className="lg">
          <span className="lg-route" />
          Roteiro
        </span>
      )}
    </div>
  );
}
