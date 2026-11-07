import * as cheerio from "cheerio";
import { fetchHtml } from "../http";
import { absoluteUrl, parseMinutes, parseRating, parseTime } from "../text";
import type { CinemaAdapter, ScrapedSession } from "../types";

const BASE = "https://reservacultural.com.br";
const LIST_URL = `${BASE}/cinema/`;
const filmUrl = (id: string) => `${BASE}/cinema/filme/?movieId=${id}`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Reserva Cultural. `/cinema/` lista os filmes em cartaz (título, pôster, duração, classificação, gêneros) e a
 * página de cada filme (`?movieId=`) traz todos os dias em abas (`#tab-yyyy-mm-dd`), com sala, horário, tipo
 * ("Laser, Legendado") e o link de compra da sessão no Ingresso.com (nível "session").
 * A home do site não carrega a lista para leitores automáticos; por isso usamos `/cinema/`.
 */
export const reservaAdapter: CinemaAdapter = {
  id: "reserva",
  cinemaIds: ["reserva"],

  async scrape() {
    const list = cheerio.load(await fetchHtml(LIST_URL));

    // Um cartão por filme, com os metadados; o id vem do link "Ver sinopse".
    const films = new Map<string, { title: string; meta: ScrapedSession["film"] }>();
    list(".rc-movie-card-sessions").each((_, el) => {
      const card = list(el);
      const id = card.find("a[href*='movieId=']").first().attr("href")?.match(/movieId=(\d+)/)?.[1];
      const title = card.find("h3").first().text().replace(/\s+/g, " ").trim();
      if (!id || !title || films.has(id)) return;
      films.set(id, {
        title,
        meta: {
          minutes: parseMinutes(card.find(".rc-duration").first().text()),
          rating: parseRating(card.find(".rc-rating").first().text()),
          genre: card.find(".rc-genres").first().text().replace(/\s+/g, " ").trim() || undefined,
          posterUrl: absoluteUrl(card.find(".rc-movie-poster").first().attr("src"), LIST_URL),
        },
      });
    });
    if (!films.size) throw new Error("Nenhum filme encontrado em /cinema/ (o layout pode ter mudado).");

    const out: ScrapedSession[] = [];
    for (const [id, f] of films) {
      await wait(600); // uma página por filme: vamos devagar
      const $ = cheerio.load(await fetchHtml(filmUrl(id)));
      let dub = false;

      $(".rc-tab-content").each((_, tab) => {
        const day = $(tab).attr("id")?.replace(/^tab-/, "");
        if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
        $(tab)
          .find(".rc-room")
          .each((__, roomEl) => {
            const room = $(roomEl).find(".rc-room-name").first().text().trim() || null;
            $(roomEl)
              .find(".rc-session")
              .each((___, s) => {
                const time = parseTime($(s).find(".rc-time").first().text());
                if (!time) return;
                const type = $(s).find(".rc-type").first().text();
                if (/dublado/i.test(type)) dub = true;
                const buy = $(s).find("a.rc-buy").first().attr("href");
                out.push({
                  cinemaId: "reserva",
                  title: f.title,
                  day,
                  time,
                  room,
                  ticketUrl: buy ?? null,
                  linkLevel: buy ? "session" : "film",
                  film: { ...f.meta, language: /nacional/i.test(type) && !dub ? "nac" : "leg" },
                });
              });
          });
      });
    }
    return out;
  },
};
