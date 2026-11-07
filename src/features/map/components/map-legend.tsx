import { METRO_LINES } from "../data/metro";

export function MapLegend() {
  return (
    <div className="legend" aria-label="Legenda do mapa">
      <span className="lg">
        <span className="lg-pin" />
        Cinema · nº de sessões
      </span>
      {METRO_LINES.map((l) => (
        <span key={l.id} className="lg">
          <span className="lg-line" style={{ background: l.color }} />
          {l.name.replace("Linha ", "")}
        </span>
      ))}
      <span className="lg">
        <span className="lg-route" />
        Roteiro
      </span>
    </div>
  );
}
