"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/shared/icons";
import { Poster, Rating } from "@/components/ui/poster";
import { useExplorer } from "@/features/explorer/components/explorer-provider";
import { joinMeta } from "@/features/sessions/lib/labels";
import { pluralize } from "@/lib/format";
import { scoreOf } from "../lib/info";

/**
 * "Sobre o filme": janela com sinopse, direção e nota (TMDB). Abre por cima da página (no celular, como uma
 * folha que sobe da base), fecha com Esc, no X ou tocando fora, e devolve o foco a quem a abriu (comportamento
 * nativo do <dialog>). A ação principal continua sendo ver as sessões do filme.
 */
export function FilmDialog() {
  const { data, state, view, patch, go } = useExplorer();
  const ref = useRef<HTMLDialogElement>(null);
  const film = state.detailFilm ? data.films.find((f) => f.id === state.detailFilm) : undefined;
  const stat = film ? view.filmStats.find((s) => s.film.id === film.id) : undefined;

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (film && !dlg.open) dlg.showModal();
    if (!film && dlg.open) dlg.close();
  }, [film]);

  const score = film ? scoreOf(film) : null;

  return (
    <dialog
      ref={ref}
      className="fdlg"
      aria-labelledby="fdlg-title"
      onClose={() => patch({ detailFilm: null })}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      {film && (
        <div className="fdlg-in">
          <button type="button" className="fdlg-x" onClick={() => ref.current?.close()} aria-label="Fechar">
            <CloseIcon />
          </button>

          <div className="fdlg-poster">
            <Poster film={film} />
          </div>

          <header className="fdlg-head">
            <h2 id="fdlg-title">{film.title}</h2>
            <p className="fdlg-meta">
              <span>
                {joinMeta([film.year ? String(film.year) : null, film.minutes ? `${film.minutes} min` : null, film.genre])}
              </span>
              <Rating rating={film.rating} />
            </p>
            {score && (
              <p className="fdlg-score" aria-label={score.label}>
                <strong>
                  <span aria-hidden="true">★</span> {score.text}
                </strong>
                <span className="of" aria-hidden="true">
                  /10
                </span>
              </p>
            )}
          </header>

          <div className="fdlg-text">
            {film.director && (
              <p className="fdlg-fact">
                <span>Direção</span>
                {film.director}
              </p>
            )}
            {film.synopsis && (
              <>
                <h3>Sinopse</h3>
                <p className="fdlg-syn">{film.synopsis}</p>
              </>
            )}
            <div className="fdlg-cta">
              {stat ? (
                <button
                  type="button"
                  className="btn btn-red"
                  onClick={() => {
                    go("/sessoes", { selectedFilm: film.id, selectedCinema: null, route: null, detailFilm: null });
                  }}
                >
                  Ver {pluralize(stat.sessions, "sessão", "sessões")}
                </button>
              ) : (
                <p className="fdlg-none">Sem sessões neste dia.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
