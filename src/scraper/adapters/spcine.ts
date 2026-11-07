import * as cheerio from "cheerio";
import { fetchHtml } from "../http";
import { absoluteUrl, parseMinutes, parseRating, parseTime } from "../text";
import type { CinemaAdapter, ScrapedSession } from "../types";

const URL = "https://circuitospcine.com.br/";

/** Slug do cinema na URL da Veloz → id do cinema no nosso mapa. O circuito tem ~30 salas; só mapeamos as nossas. */
const VENUES: Record<string, string> = {
  "spcine-olido": "olido",
  "spcine-ccsp": "ccsp",
};

/** O link `/venda/<base64>` esconde a URL da Veloz, cujo penúltimo trecho (antes da data) é o slug do cinema. */
function venueFromSaleLink(href: string): string | null {
  const b64 = href.split("/venda/")[1];
  if (!b64) return null;
  try {
    const url = Buffer.from(b64, "base64url").toString("utf8");
    return url.match(/\/cinema\/sao-paulo\/[^/]+\/([^/]+)\/\d{4}-\d{2}-\d{2}\//)?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Circuito Spcine (Cine Olido e CCSP). A home lista as sessões de todo o circuito em HTML estático:
 * cada `.c14-movie-card` tem um bloco por dia (`data-c14-session-date`) e um botão por sessão.
 * Atenção: a data dentro da URL da Veloz vem como `ano-dia-mês` (ex.: 2026-05-11 = 5/nov), então usamos a
 * data do bloco do dia. Link: o próprio `/venda/...` do site, que leva à sessão exata (nível "session").
 */
export const spcineAdapter: CinemaAdapter = {
  id: "spcine",
  cinemaIds: Object.values(VENUES),

  async scrape() {
    const $ = cheerio.load(await fetchHtml(URL));
    const out: ScrapedSession[] = [];
    const seen = new Set<string>();

    $(".c14-movie-card").each((_, el) => {
      const card = $(el);
      const title = card.find(".truncate-container .truncate-text").first().text().trim();
      if (!title) return;

      const base: Omit<ScrapedSession["film"], "language"> = {
        genre: card.find(".truncate-text-h5").first().text().trim() || undefined,
        minutes: parseMinutes(card.find(".duracao-home").first().text()),
        rating: parseRating(card.find(".movie-card-rating span").first().text()),
        posterUrl: absoluteUrl(card.find("img.c14-card-poster").first().attr("src"), URL),
      };

      card.find(".c14-card-session-day").each((__, dayEl) => {
        const day = $(dayEl).attr("data-c14-session-date");
        if (!day) return;

        $(dayEl)
          .find("a.c14-card-session-button")
          .each((___, a) => {
            const href = $(a).attr("href");
            if (!href || seen.has(href)) return;
            const cinemaId = VENUES[venueFromSaleLink(href) ?? ""];
            if (!cinemaId) return; // sala do circuito que não está no nosso mapa
            const time = parseTime($(a).find("strong").first().text());
            if (!time) return;
            seen.add(href);

            out.push({
              cinemaId,
              title,
              day,
              time,
              room: null,
              ticketUrl: href,
              linkLevel: "session",
              film: { ...base, language: $(a).attr("data-c14-audio") === "NAC" ? "nac" : "leg" },
            });
          });
      });
    });

    return out;
  },
};
