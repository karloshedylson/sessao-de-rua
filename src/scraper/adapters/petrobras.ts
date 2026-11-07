import * as cheerio from "cheerio";
import { todayInSaoPaulo } from "@/lib/time";
import { fetchHtml } from "../http";
import { absoluteUrl, parseMinutes, parseRating, parseTime, resolveDayMonth } from "../text";
import type { CinemaAdapter, ScrapedSession } from "../types";

const URL = "https://espacopetrobrasdecinema.com.br/";

/**
 * Espaço Petrobras de Cinema (Augusta). A home lista cada filme num bloco com título, ficha
 * ("Brasil, 2026, Drama, 93min"), classificação e a aba "Horários", com uma linha por dia:
 * "QUI (05/11) | 14h20 | Sala 01". O tema repete cada bloco (versão desktop e mobile): deduplicamos.
 * Link: página do filme na Veloz (nível "film").
 */
export const petrobrasAdapter: CinemaAdapter = {
  id: "petrobras",
  cinemaIds: ["augusta"],

  async scrape() {
    const $ = cheerio.load(await fetchHtml(URL));
    const today = todayInSaoPaulo();
    const out: ScrapedSession[] = [];
    const seen = new Set<string>();

    $(".fusion-column-wrapper")
      .filter((_, el) => $(el).find(".fusion-tabs").length === 1 && $(el).find("h2").length >= 1)
      .each((_, el) => {
        const card = $(el);
        // Títulos de festivais vêm com hashtag ("O Beijo Elétrico #FestCineFrancêsBR"): tiramos para o filme
        // ser reconhecido igual nos outros cinemas.
        const title = card
          .find("h2")
          .first()
          .text()
          .replace(/\s*#\S+/g, "")
          .replace(/\s+/g, " ")
          .trim();
        if (!title) return;

        // "Brasil/Portugal/França, 2026, Animação, 90min"
        const metaText = card
          .find("h4")
          .filter((__, h) => /\b(19|20)\d{2}\b/.test($(h).text()))
          .first()
          .text()
          .trim();
        const parts = metaText.split(",").map((s) => s.trim());
        const year = Number(parts[1]);
        const country = parts[0] || undefined;

        const ratingText = card
          .find("h4")
          .filter((__, h) => /menores|livre/i.test($(h).text()))
          .first()
          .text();

        const buy = card
          .find("a")
          .filter((__, a) => /comprar/i.test($(a).text()))
          .first()
          .attr("href");
        const poster = card
          .find("img")
          .map((__, im) => $(im).attr("src") || $(im).attr("data-orig-src") || "")
          .get()
          .find((s) => /\/uploads\/\d{4}\/\d{2}\//.test(s) && !/acessib|icon|logo/i.test(s));

        const film: ScrapedSession["film"] = {
          country,
          year: year >= 1900 && year <= 2100 ? year : undefined,
          genre: parts.length > 3 ? parts.slice(2, -1).join(", ") : undefined,
          minutes: parseMinutes(parts[parts.length - 1] ?? ""),
          rating: parseRating(ratingText.match(/menores de (\d+)/i)?.[1] ?? (/livre/i.test(ratingText) ? "L" : "")),
          language: country?.toLowerCase().startsWith("brasil") ? "nac" : "leg",
          posterUrl: absoluteUrl(poster, URL),
        };

        // Linhas "QUI (05/11) | 14h20 | Sala 01" separadas por <br>.
        const html = card.find(".tab-pane").first().find("p").first().html() ?? "";
        for (const raw of html.split(/<br\s*\/?>/i)) {
          const line = cheerio.load(`<i>${raw}</i>`)("i").text().replace(/\s+/g, " ").trim();
          const m = line.match(/\((\d{2})\/(\d{2})\)\s*\|\s*([^|]+?)\s*\|\s*(.+)$/);
          if (!m) continue;
          const time = parseTime(m[3]);
          if (!time) continue;
          const day = resolveDayMonth(m[1], m[2], today);
          const room = m[4].trim();
          const key = `${title}|${day}|${time}|${room}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            cinemaId: "augusta",
            title,
            day,
            time,
            room,
            ticketUrl: buy ? absoluteUrl(buy, URL) ?? null : null,
            linkLevel: buy ? "film" : "cinema",
            film,
          });
        }
      });

    return out;
  },
};
