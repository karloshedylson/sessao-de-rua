import { and, eq, gte, sql } from "drizzle-orm";
import { CINEMAS } from "@/data/mock/cinemas";
import { todayInSaoPaulo } from "@/lib/time";
import { db } from "@/db/client";
import { cinemas, films, scrapeRuns, sessions } from "@/db/schema";
import { titleKey } from "./text";
import type { CinemaAdapter, ScrapedSession } from "./types";

/** Garante que todos os cinemas do mapa existem no banco (as sessões referenciam `cinemas.id`). */
export async function syncCinemas(): Promise<void> {
  await db
    .insert(cinemas)
    .values(CINEMAS.map((c) => ({ ...c })))
    .onConflictDoUpdate({
      target: cinemas.id,
      set: {
        city: sql`excluded.city`,
        name: sql`excluded.name`,
        short: sql`excluded.short`,
        bairro: sql`excluded.bairro`,
        addr: sql`excluded.addr`,
        lat: sql`excluded.lat`,
        lng: sql`excluded.lng`,
        tag: sql`excluded.tag`,
        fullPrice: sql`excluded.full_price`,
        labelSide: sql`excluded.label_side`,
        website: sql`excluded.website`,
      },
    });
}

/**
 * Grava o resultado de um adaptador. Para cada cinema coberto, substitui as sessões de hoje em diante
 * (as passadas ficam). Se o site não devolveu nenhuma sessão, não apaga nada: trata como falha.
 */
export async function persistAdapter(adapter: CinemaAdapter, scraped: ScrapedSession[]): Promise<void> {
  if (scraped.length === 0) throw new Error("Nenhuma sessão encontrada (o layout do site pode ter mudado).");

  // Só interessa de hoje em diante; filmes que só têm sessões passadas não entram no banco.
  const today = todayInSaoPaulo();
  const found = scraped.filter((s) => s.day >= today);
  if (found.length === 0) throw new Error("O site só trouxe sessões já passadas.");

  // Filmes: um por título normalizado. Os metadados de várias sessões do mesmo filme se completam (vale o
  // primeiro valor não vazio de cada campo), e no banco só campos ainda vazios são preenchidos, para uma
  // fonte não apagar a outra.
  const byKey = new Map<string, { title: string; film: ScrapedSession["film"] }>();
  for (const s of found) {
    const key = titleKey(s.title);
    const acc = byKey.get(key) ?? { title: s.title, film: {} };
    for (const [field, value] of Object.entries(s.film)) {
      const f = acc.film as Record<string, unknown>;
      if (value !== undefined && value !== null && f[field] === undefined) f[field] = value;
    }
    byKey.set(key, acc);
  }

  const filmRows = await db
    .insert(films)
    .values(
      [...byKey.entries()].map(([key, { title, film }]) => ({
        title,
        titleKey: key,
        country: film.country ?? null,
        year: film.year ?? null,
        minutes: film.minutes ?? null,
        rating: film.rating ?? null,
        language: film.language ?? null,
        genre: film.genre ?? null,
        posterUrl: film.posterUrl ?? null,
        tmdbId: film.tmdbId ?? null,
      })),
    )
    .onConflictDoUpdate({
      target: films.titleKey,
      set: {
        country: sql`coalesce(${films.country}, excluded.country)`,
        year: sql`coalesce(${films.year}, excluded.year)`,
        minutes: sql`coalesce(${films.minutes}, excluded.minutes)`,
        rating: sql`coalesce(${films.rating}, excluded.rating)`,
        language: sql`coalesce(${films.language}, excluded.language)`,
        genre: sql`coalesce(${films.genre}, excluded.genre)`,
        // Cartaz do cinema: o mais recente prevalece (o cinema pode trocar a imagem). Ele só aparece no site
        // quando o TMDB não conhece o filme; o cartaz do TMDB fica em `poster_tmdb_url`.
        posterUrl: sql`coalesce(excluded.poster_url, ${films.posterUrl})`,
        // Um id informado à mão (planilha) vale mais que o encontrado pela busca automática. Se ele mudou, o
        // cartaz e a data da consulta do TMDB são zerados para o enriquecimento buscar de novo.
        posterTmdbUrl: sql`case when excluded.tmdb_id is not null and excluded.tmdb_id is distinct from ${films.tmdbId} then null else ${films.posterTmdbUrl} end`,
        tmdbCheckedAt: sql`case when excluded.tmdb_id is not null and excluded.tmdb_id is distinct from ${films.tmdbId} then null else ${films.tmdbCheckedAt} end`,
        tmdbId: sql`coalesce(excluded.tmdb_id, ${films.tmdbId})`,
      },
    })
    .returning({ id: films.id, titleKey: films.titleKey });
  const filmId = new Map(filmRows.map((f) => [f.titleKey, f.id]));

  await db.transaction(async (tx) => {
    for (const cinemaId of adapter.cinemaIds) {
      await tx.delete(sessions).where(and(eq(sessions.cinemaId, cinemaId), gte(sessions.day, today)));
    }
    const rows = found.map((s) => ({
      cinemaId: s.cinemaId,
      filmId: filmId.get(titleKey(s.title))!,
      day: s.day,
      startsAt: s.time,
      room: s.room,
      ticketUrl: s.ticketUrl,
      linkLevel: s.linkLevel,
    }));
    // Em lotes, para não estourar o limite de parâmetros do Postgres.
    for (let i = 0; i < rows.length; i += 500) await tx.insert(sessions).values(rows.slice(i, i + 500));
  });
}

/** Registra uma execução em `scrape_runs` por cinema coberto. */
export async function recordRun(
  adapter: CinemaAdapter,
  startedAt: Date,
  result: { found: ScrapedSession[] } | { error: string },
): Promise<void> {
  await db.insert(scrapeRuns).values(
    adapter.cinemaIds.map((cinemaId) => ({
      cinemaId,
      startedAt,
      finishedAt: new Date(),
      ok: "found" in result,
      sessionsFound: "found" in result ? result.found.filter((s) => s.cinemaId === cinemaId).length : 0,
      error: "error" in result ? result.error : null,
    })),
  );
}
