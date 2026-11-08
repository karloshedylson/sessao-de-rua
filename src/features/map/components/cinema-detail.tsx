"use client";

import { ChevronLeftIcon, PinIcon } from "@/components/shared/icons";
import { SmoothLink } from "@/components/ui/smooth-link";
import { useExplorer } from "@/features/explorer/components/explorer-provider";
import { dayLabels } from "@/features/explorer/lib/derive";
import { cinemaHref, findSessionLink, mapsHref, sessionTarget, targetLabel } from "@/features/sessions/lib/labels";
import { formatKm } from "@/lib/format";
import { toMinutes } from "@/lib/time";

/** Painel de detalhe do cinema selecionado: metrô, vizinhos a pé e próximas sessões. */
export function CinemaDetail({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, map, state, view, patch } = useExplorer();
  const id = state.selectedCinema;
  const cinema = data.cinemas.find((c) => c.id === id);
  if (!cinema) return null;

  const near = map.nearest[cinema.id];
  const row = view.rowById[cinema.id];
  const { short: dayShort } = dayLabels(data.schedule.days[state.day], state.day);

  const neighbors = map.walkEdges
    .filter((e) => e.a === cinema.id || e.b === cinema.id)
    .sort((a, b) => a.min - b.min)
    .map((e) => {
      const otherId = e.a === cinema.id ? e.b : e.a;
      return { cinema: data.cinemas.find((c) => c.id === otherId), min: e.min };
    })
    .filter((n): n is { cinema: NonNullable<typeof n.cinema>; min: number } => !!n.cinema);

  const next = (row?.items ?? [])
    .flatMap((it) => it.times.filter((t) => !view.isPast(t)).map((t) => ({ t, film: it.film })))
    .sort((a, b) => toMinutes(a.t) - toMinutes(b.t))
    .slice(0, 5);

  return (
    <article className="detail" aria-live="polite">
      <button type="button" className="back" onClick={() => patch({ selectedCinema: null })}>
        <ChevronLeftIcon />
        Todos os cinemas
      </button>
      <span className="tag">{cinema.tag}</span>
      <h3>{cinema.name}</h3>
      <p className="addr">
        {cinema.addr} · {cinema.bairro}
      </p>
      {near && (
        <ul className="facts">
          <li>
            {near.lines.map((l) => (
              <span key={l.name} className="ldot" style={{ background: l.color }} title={l.name} />
            ))}
            <span>
              Metrô {near.name} · {near.km < 1.2 ? `${near.min} min a pé` : `${formatKm(near.km)} a pé`}
            </span>
          </li>
        </ul>
      )}

      {neighbors.length > 0 && (
        <>
          <p className="subh">Dá para ir a pé</p>
          <div className="nearby">
            {neighbors.map((n) => (
              <button key={n.cinema.id} type="button" className="nb" onClick={() => onSelect(n.cinema.id)}>
                {n.cinema.short} <em>{n.min} min</em>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="subh">Próximas sessões · {dayShort}</p>
      {next.length > 0 ? (
        <div className="next">
          {next.map((x) => {
            const { href, level } = sessionTarget(cinema, findSessionLink(data, state.day, cinema.id, x.film.id, x.t));
            return (
              <a
                key={`${x.film.id}-${x.t}`}
                className="nx"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${x.film.title} às ${x.t}. ${targetLabel(level)}`}
              >
                <span className="tm">{x.t}</span>
                <span className="ti">{x.film.title}</span>
                <span className="go">{level === "session" ? "Comprar" : "Ver no site"}</span>
              </a>
            );
          })}
        </div>
      ) : (
        <p className="muted">
          Nenhuma sessão com os filtros atuais neste dia.{" "}
          <a href={cinemaHref(cinema)} target="_blank" rel="noopener noreferrer">
            Ver a programação no site do cinema
          </a>
        </p>
      )}

      <div className="detail-actions">
        <SmoothLink className="btn btn-red btn-sm" href="#sessoes">
          Programação completa
        </SmoothLink>
        <a className="btn btn-ghost btn-sm" href={mapsHref(cinema)} target="_blank" rel="noopener noreferrer">
          <PinIcon dot={false} />
          Como chegar
        </a>
      </div>
    </article>
  );
}
