import * as cheerio from "cheerio";
import { todayInSaoPaulo } from "@/lib/time";
import { fetchHtml } from "../http";
import { absoluteUrl, monthNumber, parseTime, resolveDayMonth } from "../text";
import type { CinemaAdapter, ScrapedSession } from "../types";

const URL = "https://cinelt3.com.br/sessoes";

/**
 * Cine LT3. A página /sessoes lista uma sessão por bloco `.event-feed`: pôster, data ("06" + "Nov"),
 * título com link para a página do filme e horário. A compra é pelo WhatsApp do cinema, então o link
 * útil é a página do filme no próprio site (nível "film").
 */
export const lt3Adapter: CinemaAdapter = {
  id: "lt3",
  cinemaIds: ["lt3"],

  async scrape() {
    const $ = cheerio.load(await fetchHtml(URL));
    const today = todayInSaoPaulo();
    const out: ScrapedSession[] = [];
    const seen = new Set<string>();

    $(".event-feed").each((_, el) => {
      const item = $(el);
      const title = item.find("h5 a").first().text().replace(/\s+/g, " ").trim();
      const day = item.find(".date .day").first().text().trim();
      const month = monthNumber(item.find(".date .month").first().text().trim());
      const time = parseTime(item.find("li").first().text().replace(/\s+/g, " ").trim());
      if (!title || !day || !month || !time) return;

      const filmUrl = absoluteUrl(item.find("h5 a").first().attr("href"), URL) ?? null;
      const iso = resolveDayMonth(day.padStart(2, "0"), month, today);
      const key = `${title}|${iso}|${time}`;
      if (seen.has(key)) return;
      seen.add(key);

      out.push({
        cinemaId: "lt3",
        title,
        day: iso,
        time,
        room: null,
        ticketUrl: filmUrl,
        linkLevel: filmUrl ? "film" : "cinema",
        film: { posterUrl: absoluteUrl(item.find("img").first().attr("src"), URL) },
      });
    });

    return out;
  },
};
