"use client";

import { MapIcon, TicketIcon } from "@/components/shared/icons";
import { Poster } from "@/components/ui/poster";
import { SmoothLink } from "@/components/ui/smooth-link";
import { dayLabels } from "@/features/explorer/lib/derive";
import { useExplorer } from "@/features/explorer/components/explorer-provider";
import { METRO_LINES } from "@/features/map/data/metro";
import { filmMeta } from "@/features/sessions/lib/labels";
import { capitalize, pluralize, spellNumber } from "@/lib/format";

export function Hero() {
  const { data, state, view, map, patch, scrollToSection } = useExplorer();
  const { short } = dayLabels(data.schedule.days[state.day], state.day);
  const dayWord = state.day === 0 ? "hoje" : state.day === 1 ? "amanhã" : "neste dia";

  const featured = view.featured;
  const film = featured?.film;

  const pickFeatured = () => {
    if (!film) return;
    patch({ selectedFilm: film.id, selectedCinema: null, route: null });
    scrollToSection("sessoes");
  };

  // Caminhada entre duas salas citadas no texto de apoio (Belas Artes ↔ Espaço Augusta).
  const walk = map.walkEdges.find(
    (e) => (e.a === "belas" && e.b === "augusta") || (e.a === "augusta" && e.b === "belas"),
  );

  return (
    <section className="hero" id="topo" aria-labelledby="hero-titulo">
      <div className="wrap">
        <div className="hero-in">
          <div>
            <p className="eyebrow">Programação dos cinemas de rua · São Paulo</p>
            <div className="marquee">
              <h1 id="hero-titulo">
                <span>Cinema</span>
                <span className="r">de rua</span>
              </h1>
              <p className="marquee-sub">em São Paulo</p>
            </div>
            <p className="lede">
              {capitalize(spellNumber(data.cinemas.length))}{" "}
              {data.cinemas.length === 1 ? "sala de rua" : "salas de rua"}, um só circuito. Veja no mapa como elas se
              ligam pelo metrô, escolha a sessão e siga para o site do cinema.
            </p>
            <div className="cta">
              <SmoothLink className="btn btn-red" href="#mapa">
                <MapIcon />
                Explorar o mapa
              </SmoothLink>
              <SmoothLink className="btn btn-ghost" href="#cartaz">
                Em cartaz {dayWord}
              </SmoothLink>
            </div>
          </div>

          {film && featured && (
            <aside className="feat" aria-label="Destaque">
              <button type="button" className="fbtn" onClick={pickFeatured} aria-label={`Ver sessões de ${film.title}`}>
                <Poster film={film} />
              </button>
              <div>
                <p className="feat-k">Destaque · {short}</p>
                <h2>{film.title}</h2>
                <p className="fm">
                  {filmMeta(film)}
                </p>
                <p className="fc">
                  {featured.sessions
                    ? `${pluralize(featured.sessions, "sessão", "sessões")} em ${pluralize(featured.cinemas, "cinema", "cinemas")}`
                    : "Sem sessões neste dia"}
                </p>
                <button type="button" className="btn btn-red btn-sm" onClick={pickFeatured}>
                  <TicketIcon />
                  Ver sessões
                </button>
              </div>
            </aside>
          )}
        </div>

        <ul className="stats">
          <li>
            <b>{data.cinemas.length}</b>
            <span>cinemas de rua no mapa</span>
          </li>
          <li>
            <b>{view.todayCount}</b>
            <span>sessões ainda hoje</span>
          </li>
          <li>
            <b>{METRO_LINES.length}</b>
            <span>linhas de metrô ligam as salas</span>
          </li>
          {walk && (
            <li>
              <b>{walk.min} min</b>
              <span>a pé entre Belas Artes e Espaço Augusta</span>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
