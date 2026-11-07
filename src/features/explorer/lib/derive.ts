import { normalizeText } from "@/lib/format";
import { isoToDate, toMinutes } from "@/lib/time";
import type { ScheduleData } from "@/services/sessions/repository";
import type { Cinema, Film, Screening } from "@/types";
import type { MapModel } from "@/features/map/lib/model";
import type { ExplorerState } from "../types";

export type CinemaRow = {
  cinema: Cinema;
  items: { film: Film; times: string[]; room: string }[];
  total: number;
};

export type FilmGroup = {
  film: Film;
  rows: { cinema: Cinema; times: string[]; room: string }[];
};

export type FilmStat = { film: Film; sessions: number; cinemas: number };

export type ExplorerView = {
  rows: CinemaRow[];
  rowById: Record<string, CinemaRow>;
  /** Linhas visíveis na seção de sessões (com sessões e respeitando seleção/roteiro). */
  visible: CinemaRow[];
  totalSessions: number;
  byFilm: FilmGroup[];
  filmStats: FilmStat[];
  featured: FilmStat | null;
  todayCount: number;
  isPast: (time: string) => boolean;
  inRoute: (cinemaId: string) => boolean;
};

/**
 * Aplica filtros do estado à programação e devolve tudo o que as seções precisam.
 * Função pura: `nowMin` < 0 significa "horário desconhecido" (render do servidor),
 * quando nenhuma sessão é tratada como já iniciada.
 */
export function deriveView(data: ScheduleData, state: ExplorerState, nowMin: number, map: MapModel): ExplorerView {
  const filmById: Record<string, Film> = {};
  for (const f of data.films) filmById[f.id] = f;

  const route = state.route ? (map.routes.find((r) => r.id === state.route) ?? null) : null;
  const inRoute = (id: string) => !route || route.stops.includes(id);
  const isPast = (t: string) => state.day === 0 && nowMin >= 0 && toMinutes(t) < nowMin;
  const q = normalizeText(state.query.trim());

  const timeOk = (t: string) => {
    const m = toMinutes(t);
    if (state.period === "tarde" && m >= 1080) return false;
    if (state.period === "noite" && m < 1080) return false;
    return true;
  };
  const filmOk = (f: Film) =>
    (state.lang === "all" || f.language === state.lang) &&
    (!state.selectedFilm || f.id === state.selectedFilm) &&
    (!q || normalizeText(`${f.title} ${f.genre ?? ""} ${f.country ?? ""}`).includes(q));

  const dayData = data.schedule.byDay[state.day] ?? {};

  const rows: CinemaRow[] = data.cinemas
    .map((cinema) => {
      const items: CinemaRow["items"] = [];
      if (state.bairro === "all" || cinema.bairro === state.bairro) {
        for (const s of dayData[cinema.id] ?? []) {
          const film = filmById[s.filmId];
          if (!film || !filmOk(film)) continue;
          const times = s.times.filter((t) => timeOk(t) && !isPast(t));
          if (times.length) items.push({ film, times, room: s.room });
        }
      }
      return { cinema, items, total: items.reduce((n, i) => n + i.times.length, 0) };
    })
    .sort((a, b) => a.cinema.short.localeCompare(b.cinema.short, "pt-BR"));

  const rowById: Record<string, CinemaRow> = {};
  for (const r of rows) rowById[r.cinema.id] = r;

  const visible = rows.filter(
    (r) => r.total > 0 && (!state.selectedCinema || r.cinema.id === state.selectedCinema) && inRoute(r.cinema.id),
  );
  const totalSessions = visible.reduce((n, r) => n + r.total, 0);

  const groups = new Map<string, FilmGroup>();
  for (const r of visible) {
    for (const it of r.items) {
      let g = groups.get(it.film.id);
      if (!g) groups.set(it.film.id, (g = { film: it.film, rows: [] }));
      g.rows.push({ cinema: r.cinema, times: it.times, room: it.room });
    }
  }
  const byFilm = [...groups.values()].sort((a, b) => a.film.title.localeCompare(b.film.title, "pt-BR"));

  // Contagem por filme no dia (sessões que já começaram não contam), para o cartaz.
  const counts: Record<string, { sessions: number; cinemas: Set<string> }> = {};
  for (const c of data.cinemas) {
    for (const s of dayData[c.id] ?? ([] as Screening[])) {
      const n = s.times.filter((t) => !isPast(t)).length;
      if (!n) continue;
      const e = (counts[s.filmId] ||= { sessions: 0, cinemas: new Set() });
      e.sessions += n;
      e.cinemas.add(c.id);
    }
  }
  // Só filmes com sessão no dia: quem não tem fica fora da lista de cartazes.
  const filmStats: FilmStat[] = data.films
    .map((film) => ({
      film,
      sessions: counts[film.id]?.sessions ?? 0,
      cinemas: counts[film.id]?.cinemas.size ?? 0,
    }))
    .filter((s) => s.sessions > 0);
  const featured = filmStats.reduce<FilmStat | null>(
    (best, s) => (!best || s.sessions > best.sessions ? s : best),
    null,
  );

  let todayCount = 0;
  for (const c of data.cinemas) {
    for (const s of data.schedule.byDay[0]?.[c.id] ?? []) {
      for (const t of s.times) if (toMinutes(t) >= Math.max(nowMin, 0)) todayCount++;
    }
  }

  return { rows, rowById, visible, totalSessions, byFilm, filmStats, featured, todayCount, isPast, inRoute };
}

/** Rótulos de dia usados em títulos e na barra de dias. */
export function dayLabels(iso: string, dayIndex: number) {
  const d = isoToDate(iso);
  const dm = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  const long =
    dayIndex === 0
      ? `hoje, ${dm}`
      : dayIndex === 1
        ? `amanhã, ${dm}`
        : d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const short =
    dayIndex === 0
      ? "Hoje"
      : dayIndex === 1
        ? "Amanhã"
        : d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "");
  return { long, short };
}
