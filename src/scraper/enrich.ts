import { and, eq, exists, gte, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { films, sessions } from "@/db/schema";
import { todayInSaoPaulo } from "@/lib/time";
import { createTmdbApi, resolveFilm } from "./tmdb";

const RECHECK_DAYS = 14;
const MAX_PER_RUN = 200;
const PAUSE_MS = 250;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Busca no TMDB, pelo nome, o cartaz dos filmes com sessão de hoje em diante. Prioridade dos cartazes no site:
 * TMDB → cartaz do cinema → nenhum (cartaz ilustrado). Por isso o cartaz do TMDB vai para a própria coluna
 * (`poster_tmdb_url`) e o do cinema (`poster_url`) fica intacto, como reserva.
 *
 * Quem já tem cartaz do TMDB não é consultado de novo. Quem não foi encontrado só é consultado de novo depois de
 * 14 dias; erros de rede não contam como consulta. Só se completa o que está vazio (ano, duração, gênero).
 */
export async function enrichFilms(key: string): Promise<{ found: number; notFound: string[]; failed: number }> {
  const api = createTmdbApi(key);
  const today = todayInSaoPaulo();
  const cutoff = new Date(Date.now() - RECHECK_DAYS * 86_400_000);

  const pending = await db
    .select({ id: films.id, title: films.title, year: films.year, tmdbId: films.tmdbId, minutes: films.minutes, genre: films.genre })
    .from(films)
    .where(
      and(
        isNull(films.posterTmdbUrl),
        or(isNull(films.tmdbCheckedAt), lt(films.tmdbCheckedAt, cutoff)),
        exists(db.select({ one: sql`1` }).from(sessions).where(and(eq(sessions.filmId, films.id), gte(sessions.day, today)))),
      ),
    )
    .limit(MAX_PER_RUN);

  let found = 0;
  let failed = 0;
  let consecutiveFailures = 0;
  const notFound: string[] = [];

  for (const film of pending) {
    try {
      const match = await resolveFilm({ title: film.title, year: film.year, tmdbId: film.tmdbId, minutes: film.minutes }, api);
      consecutiveFailures = 0;
      if (!match || !match.posterUrl) {
        await db.update(films).set({ tmdbCheckedAt: new Date(), ...(match ? { tmdbId: match.tmdbId } : {}) }).where(eq(films.id, film.id));
        notFound.push(match ? `${film.title} (achado no TMDB, mas sem imagem de cartaz)` : film.title);
        continue;
      }
      await db
        .update(films)
        .set({
          posterTmdbUrl: match.posterUrl,
          tmdbId: match.tmdbId,
          tmdbCheckedAt: new Date(),
          ...(film.year === null && match.year ? { year: match.year } : {}),
          ...(film.minutes === null && match.minutes ? { minutes: match.minutes } : {}),
          ...(film.genre === null && match.genre ? { genre: match.genre } : {}),
        })
        .where(eq(films.id, film.id));
      found++;
      console.log(`  ✓ ${film.title}  →  ${match.matchedTitle}${match.year ? ` (${match.year})` : ""}`);
    } catch (e) {
      failed++;
      consecutiveFailures++;
      console.warn(`  ✗ ${film.title}: ${e instanceof Error ? e.message : String(e)}`);
      if (consecutiveFailures >= 5) {
        console.warn("  Muitas falhas seguidas no TMDB: interrompendo; tenta de novo na próxima coleta.");
        break;
      }
    }
    await wait(PAUSE_MS);
  }
  return { found, notFound, failed };
}
