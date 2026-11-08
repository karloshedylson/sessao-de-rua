import { readFile } from "node:fs/promises";
import { CINEMAS } from "@/data/mock/cinemas";
import { todayInSaoPaulo } from "@/lib/time";
import { fetchHtml } from "../http";
import { parseCsv, parseMinutes, parseRating, parseTime, prettyTitle } from "../text";
import type { CinemaAdapter, ScrapedSession } from "../types";

/** Cinemas do Recife que vêm da planilha. A Fundação (Derby, Porto, Museu) vem da Velox (adaptador `fundacao`). */
const RECIFE = CINEMAS.filter((c) => c.city === "recife");
const FROM_VELOX = new Set(["fundacao-derby", "fundacao-porto", "fundacao-museu"]);
const RECIFE_IDS = RECIFE.map((c) => c.id).filter((id) => !FROM_VELOX.has(id));

/** "Cinema São Luiz" → "cinema sao luiz": sem acento, minúsculo, pontuação vira espaço. */
const looseKey = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Outros jeitos de escrever o nome de cada cinema (além do código, do nome completo e do nome curto). */
const ALIASES: Record<string, string[]> = {
  saoluiz: ["cine sao luiz", "sao luiz"],
  "teatro-parque": ["cine teatro do parque", "teatro do parque", "cinema do parque", "cinema teatro do parque"],
  "fundacao-derby": ["cine fundacao derby", "cinema da fundacao derby", "fundacao derby", "cinema derby"],
  "fundacao-museu": ["cine fundacao museu", "cinema da fundacao museu", "fundacao museu", "cinema do museu"],
  "fundacao-porto": ["cine fundacao porto", "cinema da fundacao porto", "fundacao porto", "cinema da fundacao porto digital", "cinema do porto", "porto digital"],
  apipucos: ["cine apipucos", "cineapipucos", "cineapipucos parque apipucos", "cine apipucos parque apipucos", "parque apipucos", "parque de apipucos", "apipucos"],
  ufpe: ["cine ufpe", "cinema ufpe", "cinema da ufpe", "ufpe"],
};

/** Aceita o código ("saoluiz"), o nome completo ou curto e as variações acima. Nome ambíguo ("Cinema da Fundação") não casa. */
const CINEMA_LOOKUP = new Map<string, string>();
for (const c of RECIFE) {
  for (const name of [c.id, c.name, c.short, ...(ALIASES[c.id] ?? [])]) CINEMA_LOOKUP.set(looseKey(name), c.id);
}

const REQUIRED = ["cinema", "data", "hora", "filme"] as const;
type Optional = "sala" | "link" | "ano" | "duracao" | "classificacao" | "genero" | "pais" | "idioma" | "cartaz" | "tmdb";
type Column = (typeof REQUIRED)[number] | Optional;

/** "Duração" → "duracao": sem acento, minúsculo, sem espaços nas pontas. */
const normalizeHeader = (h: string) =>
  h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** dd/mm/aaaa, d/m/aa ou aaaa-mm-dd → `aaaa-mm-dd` (ou null se não for uma data real). */
function parseDate(raw: string): string | null {
  const s = raw.trim();
  let y: number, m: number, d: number;
  let hit = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (hit) [d, m, y] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  else if ((hit = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/))) [d, m, y] = [Number(hit[1]), Number(hit[2]), 2000 + Number(hit[3])];
  else if ((hit = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) [y, m, d] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  else if (/^\d{5}$/.test(s)) {
    // Número de série do Excel/Planilhas (dias desde 30/12/1899).
    const dt = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86_400_000);
    [y, m, d] = [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
  } else return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Aceita "14:30", "14:30:00", "9:05", "14h30" e "14h". Também a fração de dia que o Excel exporta em CSV
 * (0,8125 = 19:30), caso a planilha não seja publicada pelo Google.
 */
function parseHour(raw: string): string | null {
  const s = raw.trim().replace(",", ".");
  if (/^0?\.\d+$|^0$/.test(s)) {
    const minutes = Math.round(Number(s) * 1440);
    return minutes < 1440 ? `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}` : null;
  }
  return parseTime(s.replace(/^(\d{1,2}:\d{2}):\d{2}$/, "$1"));
}

function httpUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const intIn = (raw: string, min: number, max: number): number | null => {
  const n = raw.trim().match(/^\d+/)?.[0];
  const v = n ? Number(n) : NaN;
  return Number.isInteger(v) && v >= min && v <= max ? v : null;
};

/** Lê o CSV de uma URL (planilha publicada) ou de um arquivo local (testes). */
async function readSource(source: string): Promise<string> {
  if (/^https?:\/\//i.test(source)) return fetchHtml(source);
  return readFile(source.replace(/^file:\/\//i, ""), "utf8");
}

/**
 * Cinemas do Recife via planilha (Google Planilhas publicada em CSV, endereço em `SHEET_CSV_URL`).
 * Uma linha = uma sessão. Colunas obrigatórias: cinema, data, hora, filme. Opcionais: sala, link, ano, duracao,
 * classificacao, genero, pais, idioma, cartaz, tmdb. Linhas inválidas são ignoradas e listadas com o número da linha.
 * Link vazio → o clique vai ao site/Instagram do cinema; link preenchido → página do filme/evento.
 */
export const planilhaAdapter: CinemaAdapter = {
  id: "recife",
  cinemaIds: RECIFE_IDS,
  requires: ["SHEET_CSV_URL"],

  async scrape() {
    const source = process.env.SHEET_CSV_URL;
    if (!source) throw new Error("SHEET_CSV_URL não definida.");

    const table = parseCsv(await readSource(source));
    if (!table.length) throw new Error("A planilha está vazia.");

    // Cabeçalhos em qualquer ordem; os obrigatórios precisam existir.
    const header = table[0].map(normalizeHeader);
    const col = (name: Column) => header.indexOf(name);
    const missing = REQUIRED.filter((name) => col(name) < 0);
    if (missing.length) throw new Error(`Faltam colunas na planilha: ${missing.join(", ")}.`);
    const cell = (row: string[], name: Column) => (col(name) < 0 ? "" : (row[col(name)] ?? "").trim());

    const today = todayInSaoPaulo();
    const errors: string[] = [];
    const out: ScrapedSession[] = [];
    const seen = new Set<string>();
    let past = 0;
    let skippedVelox = 0;

    table.slice(1).forEach((row, i) => {
      const line = i + 2; // número da linha na planilha (a 1 é o cabeçalho)
      if (row.every((c) => !c.trim())) return; // linha em branco
      const fail = (why: string) => void errors.push(`linha ${line}: ${why}`);

      const cinemaId = CINEMA_LOOKUP.get(looseKey(cell(row, "cinema")));
      if (!cinemaId) return fail(`cinema "${cell(row, "cinema")}" desconhecido (use um destes códigos: ${RECIFE_IDS.join(", ")})`);
      if (FROM_VELOX.has(cinemaId)) {
        skippedVelox++;
        return;
      }
      const day = parseDate(cell(row, "data"));
      if (!day) return fail(`data "${cell(row, "data")}" inválida (use dd/mm/aaaa)`);
      const time = parseHour(cell(row, "hora"));
      if (!time) return fail(`hora "${cell(row, "hora")}" inválida (use HH:MM)`);
      // "(sessão gratuita)", "(entrada gratuita)"… são avisos do cinema, não parte do nome do filme.
      const title = prettyTitle(cell(row, "filme").replace(/\s*\([^)]*gratuit[^)]*\)/gi, ""));
      if (!title) return fail("filme em branco");

      const linkRaw = cell(row, "link");
      const link = linkRaw ? httpUrl(linkRaw) : null;
      if (linkRaw && !link) return fail(`link "${linkRaw}" inválido (precisa começar com http:// ou https://)`);
      const posterRaw = cell(row, "cartaz");
      const poster = posterRaw ? httpUrl(posterRaw) : null;
      if (posterRaw && !poster) return fail(`cartaz "${posterRaw}" inválido (precisa ser um endereço http/https)`);

      const yearRaw = cell(row, "ano");
      const year = yearRaw ? intIn(yearRaw, 1900, 2100) : null;
      if (yearRaw && year === null) return fail(`ano "${yearRaw}" inválido`);
      const minutesRaw = cell(row, "duracao");
      // "98", "98 min" ou "1h38": o que tem "h" vira minutos de verdade.
      const minutes = !minutesRaw
        ? null
        : /h/i.test(minutesRaw)
          ? ((m) => (m && m >= 1 && m <= 600 ? m : null))(parseMinutes(minutesRaw))
          : intIn(minutesRaw, 1, 600);
      if (minutesRaw && minutes === null) return fail(`duracao "${minutesRaw}" inválida (minutos, de 1 a 600)`);
      const ratingRaw = cell(row, "classificacao");
      const rating = ratingRaw ? parseRating(ratingRaw) : undefined;
      if (ratingRaw && !rating) return fail(`classificacao "${ratingRaw}" inválida (L, 10, 12, 14, 16 ou 18)`);
      const langRaw = normalizeHeader(cell(row, "idioma"));
      const language = !langRaw ? undefined : /^(nac|nacional)/.test(langRaw) ? "nac" : /^(leg|legendado|dublado)/.test(langRaw) ? "leg" : null;
      if (language === null) return fail(`idioma "${cell(row, "idioma")}" inválido (nacional ou legendado)`);
      const tmdbRaw = cell(row, "tmdb");
      const tmdbId = tmdbRaw ? intIn(tmdbRaw, 1, 999_999_999) : null;
      if (tmdbRaw && tmdbId === null) return fail(`tmdb "${tmdbRaw}" inválido (número do filme no TMDB)`);

      if (day < today) {
        past++;
        return;
      }
      const room = cell(row, "sala") || null;
      const key = `${cinemaId}|${title.toLowerCase()}|${day}|${time}|${room ?? ""}`;
      if (seen.has(key)) return;
      seen.add(key);

      out.push({
        cinemaId,
        title,
        day,
        time,
        room,
        ticketUrl: link,
        linkLevel: link ? "film" : "cinema",
        film: {
          year: year ?? undefined,
          minutes: minutes ?? undefined,
          rating,
          genre: cell(row, "genero") || undefined,
          country: cell(row, "pais") || undefined,
          language,
          posterUrl: poster ?? undefined,
          tmdbId: tmdbId ?? undefined,
        },
      });
    });

    if (past) console.log(`  (${past} linhas com data passada ignoradas)`);
    if (skippedVelox) console.log(`  (${skippedVelox} linhas da Fundação ignoradas: essas sessões vêm da Velox; pode apagá-las da planilha)`);
    if (errors.length) {
      console.warn(`  ⚠ ${errors.length} linha(s) ignorada(s) por erro de preenchimento:`);
      for (const e of errors.slice(0, 25)) console.warn(`    - ${e}`);
      if (errors.length > 25) console.warn(`    … e mais ${errors.length - 25}`);
    }
    if (!out.length) throw new Error(`Nenhuma sessão válida na planilha${errors.length ? " (veja os erros acima)" : ""}.`);
    return out;
  },
};
