import type { Cinema, Film, LinkLevel, SessionLink } from "@/types";
import type { ScheduleData } from "@/services/sessions/repository";
import type { NearestStation } from "@/features/map/lib/model";

/** Site do cinema, ou uma busca enquanto a URL oficial não está mapeada. */
export function cinemaHref(cinema: Cinema): string {
  return cinema.website ?? `https://www.google.com/search?q=${encodeURIComponent(`${cinema.name} São Paulo sessões`)}`;
}

/** Destino ao clicar numa sessão: o link mais específico disponível (sessão > filme > site do cinema). */
export function sessionTarget(cinema: Cinema, link?: SessionLink): { href: string; level: LinkLevel } {
  return link ? { href: link.url, level: link.level } : { href: cinemaHref(cinema), level: "cinema" };
}

/** Link de um horário específico na programação do dia, se o scraper achou um. */
export function findSessionLink(
  data: ScheduleData,
  day: number,
  cinemaId: string,
  filmId: string,
  time: string,
): SessionLink | undefined {
  return data.schedule.byDay[day]?.[cinemaId]?.find((s) => s.filmId === filmId)?.links?.[time];
}

/** Texto de acessibilidade/rótulo conforme onde o clique leva. */
export function targetLabel(level: LinkLevel): string {
  if (level === "session") return "Abre a compra desta sessão em nova aba";
  if (level === "film") return "Abre a página do filme no site do cinema em nova aba";
  return "Abre o site do cinema em nova aba";
}

export function mapsHref(cinema: Cinema): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cinema.addr}, São Paulo`)}`;
}

export function metroLabel(near: NearestStation): string {
  return `Metrô ${near.name} · ${near.min} min a pé`;
}

/** Junta só as partes que existem ("Drama · 93 min"), pois filmes reais nem sempre trazem todos os campos. */
export function joinMeta(parts: (string | number | null | undefined)[]): string {
  return parts.filter((p) => p !== null && p !== undefined && p !== "").join(" · ");
}

export function languageLabel(film: Film): string {
  return film.language === "nac" ? "Nacional" : "Legendado";
}

export function filmMeta(film: Film): string {
  return joinMeta([film.genre, film.country, film.minutes ? `${film.minutes} min` : null, languageLabel(film)]);
}
