import { titleKey } from "./text";

/**
 * Busca de cartaz e metadados no TMDB (The Movie Database), pelo nome do filme.
 * Uso gratuito só para fins não comerciais e com crédito ao TMDB (veja o rodapé do site).
 * Chave em `TMDB_API_KEY`: aceita a "chave de API (v3)" ou o "token de acesso de leitura (v4)".
 */

const API = "https://api.themoviedb.org/3";
export const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

export type TmdbSearchResult = {
  id: number;
  title?: string;
  original_title?: string;
  release_date?: string;
  popularity?: number;
  poster_path?: string | null;
};
export type TmdbDetails = TmdbSearchResult & {
  runtime?: number | null;
  genres?: { id: number; name: string }[];
  overview?: string | null;
  vote_average?: number | null;
  vote_count?: number | null;
  /** Vem junto na mesma chamada (`append_to_response=credits`). */
  credits?: { crew?: { job?: string; name?: string }[] };
};

/** Acesso à API; injetável para testar a lógica sem rede. */
export type TmdbApi = {
  search(query: string, year?: number): Promise<TmdbSearchResult[]>;
  details(id: number): Promise<TmdbDetails | null>;
};

export type FilmLookup = {
  title: string;
  year: number | null;
  tmdbId: number | null;
  /** Duração informada pelo cinema, se houver: serve para recusar um casamento de título com outro filme. */
  minutes?: number | null;
};

/** Diferença máxima (em minutos) entre a duração do cinema e a do TMDB para aceitar o casamento. */
export const MAX_RUNTIME_DIFF = 25;
export type FilmMatch = {
  tmdbId: number;
  posterUrl: string | null;
  year: number | null;
  minutes: number | null;
  genre: string | null;
  synopsis: string | null;
  director: string | null;
  /** Nota média (0–10) e número de votos; null quando ninguém votou. */
  score: number | null;
  votes: number | null;
  /** Título que o TMDB usa (para conferir a olho no log). */
  matchedTitle: string;
};

/**
 * Tira do título o que não faz parte do nome do filme: "(Relançamento)", "+ curta …" e sessões duplas ("A + B"
 * fica só "A"), "#festival", "- sessão especial" e prefixos de ciclo ("Clássicos no Marquise: …").
 */
export function cleanTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, " ")
    .replace(/\s+\+\s+.*$/, "")
    .replace(/^(cl[aá]ssicos?|corujão|cineclube|cine ?clube|mostra|festival|sess[aã]o|pr[eé]-?estreia)\b[^:–-]*[:–-]\s+/i, "")
    .replace(/\s*#\S+/g, "")
    .replace(/\s+[-–]\s+(sess[aã]o|pr[eé]-?estreia|relan[cç]amento|exibi[cç][aã]o)\b.*$/i, "")
    .replace(/\b(dublado|legendado|3d|2d|imax)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s:–-]+$/g, "")
    .trim();
}

const yearOf = (date?: string): number | null => {
  const y = Number(date?.slice(0, 4));
  return Number.isInteger(y) && y > 1800 ? y : null;
};

/**
 * Escolhe, entre os resultados, o que tem o MESMO título (normalizado, sem acento nem pontuação) em português
 * ou no original; se o ano do filme é conhecido, o do TMDB precisa estar a até 1 ano. Entre vários, o mais popular.
 * Sem certeza, devolve null: é melhor ficar sem cartaz do que mostrar o de outro filme.
 */
export function pickBest(results: TmdbSearchResult[], wantedTitle: string, year: number | null): TmdbSearchResult | null {
  const key = titleKey(cleanTitle(wantedTitle));
  if (!key) return null;
  const exact = results.filter((r) => titleKey(r.title ?? "") === key || titleKey(r.original_title ?? "") === key);
  const fits = year
    ? exact.filter((r) => {
        const y = yearOf(r.release_date);
        return y !== null && Math.abs(y - year) <= 1;
      })
    : exact;
  return fits.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))[0] ?? null;
}

/** Nomes de quem dirigiu (cargo "Director"), sem repetir, no máximo três. Null se o TMDB não informa. */
export function directorsOf(d: TmdbDetails): string | null {
  const names = (d.credits?.crew ?? []).filter((c) => c.job === "Director" && c.name).map((c) => c.name!.trim());
  const unique = [...new Set(names)].slice(0, 3);
  return unique.length ? unique.join(", ") : null;
}

/** Procura o filme (ou usa o id informado à mão) e devolve cartaz e metadados, ou null se não achou com certeza. */
export async function resolveFilm(film: FilmLookup, api: TmdbApi): Promise<FilmMatch | null> {
  let id = film.tmdbId;
  if (id === null) {
    const query = cleanTitle(film.title);
    if (!query) return null;
    // Com o ano a busca é mais precisa; se ele estiver errado na origem, tenta de novo sem ele.
    let hit = pickBest(await api.search(query, film.year ?? undefined), film.title, film.year);
    if (!hit && film.year) hit = pickBest(await api.search(query), film.title, film.year);
    if (!hit) return null;
    id = hit.id;
  }
  const d = await api.details(id);
  if (!d) return null;
  // Título igual mas duração muito diferente: provavelmente é outro filme (ex.: dois "Naza"). Só vale para a busca
  // automática; um id informado à mão por uma pessoa nunca é recusado.
  if (film.tmdbId === null && film.minutes && d.runtime && Math.abs(film.minutes - d.runtime) > MAX_RUNTIME_DIFF) {
    return null;
  }
  return {
    tmdbId: id,
    posterUrl: d.poster_path ? `${POSTER_BASE}${d.poster_path}` : null,
    year: yearOf(d.release_date),
    minutes: d.runtime && d.runtime > 0 ? d.runtime : null,
    genre: d.genres?.length ? d.genres.slice(0, 2).map((g) => g.name).join(", ") : null,
    synopsis: d.overview?.trim() || null,
    director: directorsOf(d),
    score: d.vote_count && d.vote_count > 0 && d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
    votes: d.vote_count && d.vote_count > 0 ? d.vote_count : null,
    matchedTitle: d.title ?? d.original_title ?? "",
  };
}

/** Cliente real da API. A chave v3 vai na URL; o token v4 (começa com "eyJ") vai no cabeçalho. */
export function createTmdbApi(key: string): TmdbApi {
  const bearer = key.startsWith("eyJ");
  const get = async <T>(path: string, params: Record<string, string | number | undefined>): Promise<T | null> => {
    const url = new URL(`${API}${path}`);
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
    if (!bearer) url.searchParams.set("api_key", key);
    const res = await fetch(url, {
      headers: { accept: "application/json", ...(bearer ? { authorization: `Bearer ${key}` } : {}) },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 404) return null;
    if (res.status === 401) throw new Error("TMDB recusou a chave (401). Confira TMDB_API_KEY.");
    if (!res.ok) throw new Error(`TMDB respondeu HTTP ${res.status}`);
    return (await res.json()) as T;
  };
  return {
    async search(query, year) {
      const data = await get<{ results?: TmdbSearchResult[] }>("/search/movie", {
        query,
        language: "pt-BR",
        include_adult: "false",
        year,
      });
      return data?.results ?? [];
    },
    details: (id) => get<TmdbDetails>(`/movie/${id}`, { language: "pt-BR", append_to_response: "credits" }),
  };
}
