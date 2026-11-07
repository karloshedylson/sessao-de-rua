"use client";

import { useExplorer } from "@/features/explorer/components/explorer-provider";
import { pluralize } from "@/lib/format";

/** Lista lateral de cinemas, com a contagem de sessões do dia. */
export function CinemaList({ onSelect }: { onSelect: (id: string) => void }) {
  const { map, view } = useExplorer();
  return (
    <>
      <div className="lh">
        <h3>Cinemas</h3>
      </div>
      <ul className="clist">
        {view.rows.map(({ cinema, total }) => (
          <li key={cinema.id}>
            <button
              type="button"
              className={`citem${total ? "" : " zero"}${view.inRoute(cinema.id) ? "" : " dim"}`}
              onClick={() => onSelect(cinema.id)}
              aria-label={`${cinema.name}, ${pluralize(total, "sessão", "sessões")}, mostrar no mapa`}
            >
              <span className="c-num">{total}</span>
              <span className="c-main">
                <b>{cinema.short}</b>
                <small>
                  {cinema.bairro} · Metrô {map.nearest[cinema.id].name}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
