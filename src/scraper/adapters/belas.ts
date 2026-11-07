import * as cheerio from "cheerio";
import { todayInSaoPaulo } from "@/lib/time";
import { fetchHtml } from "../http";
import { absoluteUrl, parseMinutes, parseRating, parseTime, resolveDayMonth } from "../text";
import type { CinemaAdapter, ScrapedSession } from "../types";

const URL = "https://www.cinebelasartes.com.br/";

/**
 * Cine Belas Artes. A home lista a semana toda em HTML estático: um `.c-movie-card` por filme, com sala,
 * metadados ("Drama | 14 anos | 93min | Brasil | Diretor") e, por dia, a grade de horários.
 * Link: página do filme no próprio site (nível "film"); o site não expõe link por sessão.
 */
export const belasAdapter: CinemaAdapter = {
  id: "belas",
  cinemaIds: ["belas"],

  async scrape() {
    const $ = cheerio.load(await fetchHtml(URL));
    const today = todayInSaoPaulo();
    const out: ScrapedSession[] = [];

    $(".c-movie-card-content--hours .c-movie-card").each((_, el) => {
      const card = $(el);
      const title = card.find(".c-movie-card__info-title").first().text().trim();
      if (!title) return;

      const room = card.find(".c-movie-card__info-room").first().text().split("|")[0].trim() || null;
      const filmUrl = card.find("a.c-movie-card__link").first().attr("href")?.trim() ?? null;

      // "Drama | 14 anos | 93min | Brasil | Diretor |"
      const [genre, rating, duration, country] = card
        .find(".c-movie-card__info-comp")
        .first()
        .text()
        .split("|")
        .map((s) => s.trim());

      const film: ScrapedSession["film"] = {
        genre: genre || undefined,
        rating: rating ? parseRating(rating) : undefined,
        minutes: duration ? parseMinutes(duration) : undefined,
        country: country || undefined,
        language: country?.toLowerCase() === "brasil" ? "nac" : "leg",
        posterUrl: absoluteUrl(card.find("img.c-movie-card__thumb").first().attr("src"), URL),
      };

      // Cada dia: <h4 ...>Qui<span>(05/11)</span></h4> seguido de <table> com um <span> por horário.
      card.find(".c-movie__info-times-content--mobile-home h4").each((__, h4) => {
        const m = $(h4)
          .find("span")
          .first()
          .text()
          .match(/(\d{2})\/(\d{2})/);
        if (!m) return;
        const day = resolveDayMonth(m[1], m[2], today);
        $(h4)
          .next("table")
          .find("span")
          .each((___, s) => {
            const time = parseTime($(s).text());
            if (!time) return; // ignora o "X" (sem sessão) e textos soltos
            out.push({
              cinemaId: "belas",
              title,
              day,
              time,
              room,
              ticketUrl: filmUrl,
              linkLevel: filmUrl ? "film" : "cinema",
              film,
            });
          });
      });
    });

    return out;
  },
};
