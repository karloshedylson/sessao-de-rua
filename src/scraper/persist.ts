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

  // Filmes: um por título normalizado; preenche só campos ainda vazios, para uma fonte não apagar a outra.
  const byKey = new Map<string, ScrapedSession>();
  for (const s of found) if (!byKey.has(titleKey(s.title))) byKey.set(titleKey(s.title), s);

  const filmRows = await db
    .insert(films)
    .values(
      [...byKey.entries()].map(([key, s]) => ({
        title: s.title,
        titleKey: key,
        country: s.film.country ?? null,
        year: s.film.year ?? null,
        minutes: s.film.minutes ?? null,
        rating: s.film.rating ?? null,
        language: s.film.language ?? null,
        genre: s.film.genre ?? null,
        posterUrl: s.film.posterUrl ?? null,
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
        // O cartaz mais recente prevalece (o cinema pode trocar a imagem).
        posterUrl: sql`coalesce(excluded.poster_url, ${films.posterUrl})`,
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
