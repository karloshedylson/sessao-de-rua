"use client";

import { Poster } from "@/components/ui/poster";
import { dayLabels } from "@/features/explorer/lib/derive";
import { useExplorer } from "@/features/explorer/components/explorer-provider";
import { joinMeta, languageLabel } from "@/features/sessions/lib/labels";
import { pluralize } from "@/lib/format";

export function PosterWall() {
  const { data, state, view, patch, scrollToSection } = useExplorer();
  const { long } = dayLabels(data.schedule.days[state.day], state.day);

  return (
    <section className="sec paper" id="cartaz" aria-labelledby="cartaz-titulo">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <p className="eyebrow">Em cartaz</p>
            <h2 id="cartaz-titulo">Filmes de {long}</h2>
          </div>
        </div>
        <div className="posters">
          {view.filmStats.map(({ film, sessions, cinemas }) => (
            <article key={film.id} className={`fcard${sessions ? "" : " dim"}`}>
              <button
                type="button"
                className="fbtn"
                aria-label={`Ver sessões de ${film.title}`}
                onClick={() => {
                  patch({ selectedFilm: film.id, selectedCinema: null, route: null });
                  scrollToSection("sessoes");
                }}
              >
                <Poster film={film} />
              </button>
              <h3>{film.title}</h3>
              <p className="fmeta">
                {joinMeta([film.genre, film.minutes ? `${film.minutes} min` : null, languageLabel(film)])}
              </p>
              <p className="fcount">
                {sessions
                  ? `${pluralize(sessions, "sessão", "sessões")} em ${pluralize(cinemas, "cinema", "cinemas")}`
                  : "Sem sessões neste dia"}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
