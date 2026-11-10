import { and, asc, eq, gte, lte } from "drizzle-orm";
import { CINEMAS } from "@/data/mock/cinemas";
import { FILMS } from "@/data/mock/films";
import { hashString } from "@/lib/prng";
import { addDaysIso } from "@/lib/time";
import type { Film, FilmLanguage, Rating, Screening } from "@/types";
import type { ScheduleData, SessionsRepository } from "./repository";

const RATINGS: string[] = ["L", "10", "12", "14", "16", "18"];

/** Cartaz ilustrado determinístico: mesma paleta/motivos do protótipo, escolhidos pelo hash do título. */
function posterFor(title: string): Film["poster"] {
  return FILMS[hashString(title) % FILMS.length].poster;
}

/** Programação lida do Postgres (alimentado pelo scraper em `src/scraper`). */
export const dbSessionsRepository: SessionsRepository = {
  async getScheduleData(today) {
    // Import tardio: o cliente do banco exige DATABASE_URL e não deve ser carregado no modo mock.
    const { db } = await import("@/db/client");
    const { films, sessions } = await import("@/db/schema");

    const days = Array.from({ length: 7 }, (_, i) => addDaysIso(today, i));
    const rows = await db
      .select({
        cinemaId: sessions.cinemaId,
        day: sessions.day,
        time: sessions.startsAt,
        room: sessions.room,
        ticketUrl: sessions.ticketUrl,
        linkLevel: sessions.linkLevel,
        filmId: films.id,
        title: films.title,
        country: films.country,
        year: films.year,
        minutes: films.minutes,
        rating: films.rating,
        language: films.language,
        genre: films.genre,
        posterUrl: films.posterUrl,
        posterTmdbUrl: films.posterTmdbUrl,
        synopsis: films.synopsis,
        director: films.director,
        tmdbScore: films.tmdbScore,
        tmdbVotes: films.tmdbVotes,
      })
      .from(sessions)
      .innerJoin(films, eq(sessions.filmId, films.id))
      .where(and(gte(sessions.day, days[0]), lte(sessions.day, days[6])))
      .orderBy(asc(sessions.day), asc(sessions.startsAt));

    const filmMap = new Map<string, Film>();
    const byDay = days.map(() => Object.fromEntries(CINEMAS.map((c) => [c.id, [] as Screening[]])));

    for (const r of rows) {
      const dayIdx = days.indexOf(r.day);
      const list = byDay[dayIdx]?.[r.cinemaId];
      if (!list) continue;

      const filmId = String(r.filmId);
      if (!filmMap.has(filmId)) {
        filmMap.set(filmId, {
          id: filmId,
          title: r.title,
          country: r.country,
          year: r.year,
          minutes: r.minutes,
          rating: r.rating && RATINGS.includes(r.rating) ? (r.rating as Rating) : null,
          language: (r.language === "nac" ? "nac" : "leg") satisfies FilmLanguage,
          genre: r.genre,
          poster: posterFor(r.title),
          // Prioridade: cartaz do TMDB → cartaz do cinema → nenhum (o front cai no cartaz ilustrado).
          posterUrl: r.posterTmdbUrl ?? r.posterUrl,
          synopsis: r.synopsis,
          director: r.director,
          tmdbScore: r.tmdbScore,
          tmdbVotes: r.tmdbVotes,
        });
      }

      // O banco devolve "HH:mm:ss"; a UI usa "HH:mm".
      const time = r.time.slice(0, 5);
      let screening = list.find((s) => s.filmId === filmId && s.room === (r.room ?? ""));
      if (!screening) {
        screening = { filmId, times: [], room: r.room ?? "", links: {} };
        list.push(screening);
      }
      if (!screening.times.includes(time)) screening.times.push(time);
      if (r.ticketUrl) screening.links![time] = { url: r.ticketUrl, level: r.linkLevel };
    }

    return {
      cinemas: CINEMAS,
      films: [...filmMap.values()],
      schedule: { days, byDay },
    } satisfies ScheduleData;
  },
};
