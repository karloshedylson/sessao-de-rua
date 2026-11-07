"use client";

import type { SVGProps } from "react";
import type { MapViewport } from "../hooks/use-map-viewport";

function Glyph(props: SVGProps<SVGSVGElement>) {
  return <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" {...props} />;
}

export function MapControls({ viewport }: { viewport: MapViewport }) {
  return (
    <div className="mapctl">
      <button type="button" onClick={viewport.zoomIn} aria-label="Aproximar" disabled={viewport.atMaxZoom}>
        <Glyph>
          <path d="M12 5v14M5 12h14" />
        </Glyph>
      </button>
      <button type="button" onClick={viewport.zoomOut} aria-label="Afastar" disabled={viewport.isFull}>
        <Glyph>
          <path d="M5 12h14" />
        </Glyph>
      </button>
      <button type="button" onClick={viewport.reset} aria-label="Ver o mapa inteiro" disabled={viewport.isFull}>
        <Glyph>
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </Glyph>
      </button>
    </div>
  );
}

export function MapHint() {
  return (
    <div className="maphint">
      <Glyph>
        <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5v-2a1.5 1.5 0 0 1 3 0V12M14 10.5a1.5 1.5 0 0 1 3 0V12M17 11.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a6 6 0 0 1-4.7-2.3L4 15.5a1.6 1.6 0 0 1 2.4-2.1L8 15" />
      </Glyph>
      Toque num pino · arraste para mover · duplo clique aproxima
    </div>
  );
}
