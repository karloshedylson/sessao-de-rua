import { todayInSaoPaulo } from "@/lib/time";
import { fetchHtml, fetchText } from "../http";
import { absoluteUrl, parseRating, parseTime, prettyTitle, titleKey } from "../text";
import type { CinemaAdapter, ScrapedSession } from "../types";

const BASE = "https://www.veloxtickets.com";
const PARTNER = `${BASE}/Parceiro/P-FUNDJOAQUIM`;
const PAGE_URL = `${PARTNER}/Local/Cinema/Recife/Fundacao-Joaquim-Nabuco/FJN`;
const SESSIONS_URL = `${PARTNER}/AjaxService/LocalDetail/ServiceGetSessions`;
const MAX_DAYS = 14;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type VeloxSchedule = { startTime?: string; url?: string; id?: string; disable?: boolean };
type VeloxRoom = { roomName?: string; filters?: { fCod?: string }[]; schedules?: VeloxSchedule[] };
type VeloxFilm = {
  event?: { eventTitle?: string; posterImageURL?: string; duration?: number; genre?: string; typeRating?: string };
  rooms?: VeloxRoom[];
};

/** A sala diz a unidade ("Cinema da Fundação/Derby"). Sala que não reconhecemos não vira sessão. */
function unitOf(roomName: string): string | null {
  const k = titleKey(roomName);
  if (/\bderby\b/.test(k)) return "fundacao-derby";
  if (/\bporto\b/.test(k)) return "fundacao-porto";
  if (/\bmuseu\b/.test(k)) return "fundacao-museu";
  return null;
}

/** A resposta do serviço é um JSON dentro de uma string: lê uma ou duas vezes, conforme vier. */
function parseVelox(text: string): unknown {
  const first: unknown = JSON.parse(text);
  return typeof first === "string" ? JSON.parse(first) : first;
}

/** Dias com programação, lidos de `var eventDatesData = [...]` no HTML da página. */
function programmedDays(html: string, today: string): string[] {
  const raw = html.match(/var eventDatesData\s*=\s*(\[[\s\S]*?\])\s*;/)?.[1];
  if (!raw) throw new Error("Lista de dias não encontrada na página da Velox (o layout pode ter mudado).");
  const dates = JSON.parse(raw) as { date?: string; disabled?: boolean }[];
  return dates
    .filter((d) => d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && !d.disabled && d.date >= today)
    .map((d) => d.date!)
    .slice(0, MAX_DAYS);
}

/**
 * Cinema da Fundação (Derby, Porto Digital e Museu), pela bilheteria Velox Tickets. A página é um esqueleto: a
 * programação vem, dia a dia, do serviço `ServiceGetSessions` que a própria página chama. Cada sessão traz o
 * link de compra exato (nível "session"). As três unidades são um único "local" (FJN) na Velox; a unidade está
 * no nome da sala.
 */
export const fundacaoAdapter: CinemaAdapter = {
  id: "fundacao",
  cinemaIds: ["fundacao-derby", "fundacao-porto", "fundacao-museu"],

  async scrape() {
    const days = programmedDays(await fetchHtml(PAGE_URL), todayInSaoPaulo());
    if (!days.length) throw new Error("A Velox não lista nenhum dia com programação.");

    const out: ScrapedSession[] = [];
    const seen = new Set<string>();
    const unknownRooms = new Set<string>();

    for (const day of days) {
      await wait(500);
      const url = `${SESSIONS_URL}?${new URLSearchParams({ date: day, localCode: "FJN", cityCode: "recife" })}`;
      const films = parseVelox(await fetchText(url, "application/json")) as VeloxFilm[];
      if (!Array.isArray(films)) throw new Error(`Resposta inesperada da Velox para ${day}.`);

      for (const f of films) {
        const title = prettyTitle(f.event?.eventTitle ?? "");
        if (!title) continue;
        for (const room of f.rooms ?? []) {
          const cinemaId = unitOf(room.roomName ?? "");
          if (!cinemaId) {
            unknownRooms.add(room.roomName ?? "(sem nome)");
            continue;
          }
          const codes = (room.filters ?? []).map((x) => (x.fCod ?? "").toUpperCase());
          const language = codes.includes("LEG") ? "leg" : codes.some((c) => c.startsWith("NAC")) ? "nac" : undefined;
          for (const s of room.schedules ?? []) {
            const time = parseTime(s.startTime ?? "");
            if (!time || s.disable) continue;
            const key = s.id ?? `${cinemaId}|${title}|${day}|${time}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const ticketUrl = absoluteUrl(s.url, BASE) ?? null;
            out.push({
              cinemaId,
              title,
              day,
              time,
              room: null,
              ticketUrl,
              linkLevel: ticketUrl ? "session" : "cinema",
              film: {
                minutes: f.event?.duration && f.event.duration > 0 ? f.event.duration : undefined,
                genre: f.event?.genre || undefined,
                rating: parseRating(f.event?.typeRating ?? ""),
                posterUrl: absoluteUrl(f.event?.posterImageURL, BASE),
                language,
              },
            });
          }
        }
      }
    }

    if (unknownRooms.size) console.warn(`  ⚠ salas não reconhecidas (sessões ignoradas): ${[...unknownRooms].join("; ")}`);
    if (!out.length) throw new Error("Nenhuma sessão encontrada na Velox.");
    return out;
  },
};
