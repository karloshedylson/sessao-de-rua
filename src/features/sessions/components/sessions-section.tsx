"use client";

import { ChevronDownIcon, CloseIcon, PinIcon, SearchIcon } from "@/components/shared/icons";
import { Poster, Rating } from "@/components/ui/poster";
import { dayLabels } from "@/features/explorer/lib/derive";
import { useExplorer } from "@/features/explorer/components/explorer-provider";
import type { GroupBy, LangFilter, Period } from "@/features/explorer/types";
import { pluralize } from "@/lib/format";
import { filmMeta, joinMeta, metroLabel } from "../lib/labels";
import { SessionTime } from "./session-time";

const PERIODS: [Period, string][] = [
  ["all", "Todos"],
  ["tarde", "Até 18h"],
  ["noite", "Após 18h"],
];
const LANGS: [LangFilter, string][] = [
  ["all", "Todos"],
  ["nac", "Nacional"],
  ["leg", "Legendado"],
];

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          className={value === key ? "on" : ""}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function FilterBar() {
  const { state, patch, city } = useExplorer();
  return (
    <div className="fbar">
      <label className="search">
        <SearchIcon />
        <input
          type="search"
          value={state.query}
          onChange={(e) => patch({ query: e.target.value })}
          placeholder="Buscar filme, gênero ou país"
          aria-label="Buscar filme, gênero ou país"
        />
      </label>
      <label className="fld">
        <span>Bairro</span>
        <span className="selw">
          <select
            value={state.bairro}
            onChange={(e) => patch({ bairro: e.target.value, selectedCinema: null })}
            aria-label="Bairro"
          >
            <option value="all">Todos os bairros</option>
            {city.bairros.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <ChevronDownIcon />
        </span>
      </label>
      <div className="fld">
        <span>Horário</span>
        <Segmented label="Horário" options={PERIODS} value={state.period} onChange={(period) => patch({ period })} />
      </div>
      <div className="fld">
        <span>Idioma</span>
        <Segmented label="Idioma" options={LANGS} value={state.lang} onChange={(lang) => patch({ lang })} />
      </div>
    </div>
  );
}

function ActiveChips() {
  const { state, data, map, patch, resetFilters } = useExplorer();
  const chips: { label: string; aria: string; clear: () => void }[] = [];
  const film = data.films.find((f) => f.id === state.selectedFilm);
  const cinema = data.cinemas.find((c) => c.id === state.selectedCinema);
  const route = map.routes.find((r) => r.id === state.route);
  if (film)
    chips.push({
      label: `Filme: ${film.title}`,
      aria: "Remover filtro de filme",
      clear: () => patch({ selectedFilm: null }),
    });
  if (cinema)
    chips.push({
      label: `Cinema: ${cinema.short}`,
      aria: "Mostrar todos os cinemas",
      clear: () => patch({ selectedCinema: null }),
    });
  if (route)
    chips.push({ label: `Roteiro: ${route.name}`, aria: "Remover roteiro", clear: () => patch({ route: null }) });
  if (state.bairro !== "all")
    chips.push({
      label: `Bairro: ${state.bairro}`,
      aria: "Remover filtro de bairro",
      clear: () => patch({ bairro: "all" }),
    });
  if (!chips.length) return null;

  return (
    <div className="chips">
      {chips.map((c) => (
        <span key={c.label} className="chip">
          {c.label}
          <button type="button" onClick={c.clear} aria-label={c.aria}>
            <CloseIcon />
          </button>
        </span>
      ))}
      <button type="button" className="linkbtn" onClick={resetFilters}>
        Limpar tudo
      </button>
    </div>
  );
}

function CinemaCards() {
  const { map, view, patch, scrollToSection } = useExplorer();
  return (
    <div className="sgrid">
      {view.visible.map(({ cinema, items }) => (
        <article key={cinema.id} className="scard">
          <header className="scard-h">
            <div>
              <span className="tag">{cinema.tag}</span>
              <h3>{cinema.name}</h3>
              <p className="addr">
                {cinema.addr}
                {map.nearest[cinema.id] ? ` · ${metroLabel(map.nearest[cinema.id])}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="mini"
              onClick={() => {
                patch({ selectedCinema: cinema.id });
                scrollToSection("mapa");
              }}
            >
              <PinIcon />
              No mapa
            </button>
          </header>
          {items.map(({ film, times, room }) => (
            <div key={`${film.id}-${room}`} className="srow">
              <div className="srow-f">
                <Rating rating={film.rating} />
                <div>
                  <h4>{film.title}</h4>
                  <p>
                    {joinMeta([filmMeta(film), room])}
                  </p>
                </div>
              </div>
              <div className="times">
                {times.map((t) => (
                  <SessionTime key={t} cinema={cinema} film={film} time={t} past={view.isPast(t)} />
                ))}
              </div>
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}

function FilmCards() {
  const { view } = useExplorer();
  return (
    <div className="sgrid">
      {view.byFilm.map(({ film, rows }) => (
        <article key={film.id} className="scard">
          <header className="scard-h">
            <div className="fhead">
              <Poster film={film} size="sm" />
              <div>
                <Rating rating={film.rating} />
                <h3>{film.title}</h3>
                <p className="addr">{filmMeta(film)}</p>
              </div>
            </div>
          </header>
          {rows.map(({ cinema, times, room }) => (
            <div key={`${cinema.id}-${room}`} className="srow">
              <div className="srow-f">
                <div>
                  <h4>{cinema.short}</h4>
                  <p>
                    {joinMeta([cinema.bairro, room])}
                  </p>
                </div>
              </div>
              <div className="times">
                {times.map((t) => (
                  <SessionTime key={t} cinema={cinema} film={film} time={t} past={view.isPast(t)} />
                ))}
              </div>
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}

export function SessionsSection() {
  const { state, data, view, patch, resetFilters } = useExplorer();
  const { long } = dayLabels(data.schedule.days[state.day], state.day);
  const empty = view.visible.length === 0;
  const groupOptions: [GroupBy, string][] = [
    ["cinema", "Cinema"],
    ["filme", "Filme"],
  ];

  return (
    <section className="sec" id="sessoes" aria-labelledby="sessoes-titulo">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <p className="eyebrow">Programação</p>
            <h2 id="sessoes-titulo">Sessões</h2>
          </div>
          <div className="fld">
            <span>Ver por</span>
            <Segmented
              label="Agrupar sessões por"
              options={groupOptions}
              value={state.groupBy}
              onChange={(groupBy) => patch({ groupBy })}
            />
          </div>
        </div>

        <FilterBar />
        <ActiveChips />

        <p className="summary" aria-live="polite">
          {pluralize(view.totalSessions, "sessão", "sessões")} em {pluralize(view.visible.length, "cinema", "cinemas")}{" "}
          <span>· {long}</span>
        </p>

        {empty ? (
          <div className="empty">
            <h3>Nenhuma sessão por aqui</h3>
            <p>Com esses filtros não há sessões neste dia. Tente outro dia ou limpe os filtros.</p>
            <div className="cta">
              <button type="button" className="btn btn-red btn-sm" onClick={resetFilters}>
                Limpar filtros
              </button>
              {state.day < 6 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => patch({ day: state.day + 1 })}>
                  Ver amanhã
                </button>
              )}
            </div>
          </div>
        ) : state.groupBy === "cinema" ? (
          <CinemaCards />
        ) : (
          <FilmCards />
        )}
      </div>
    </section>
  );
}
