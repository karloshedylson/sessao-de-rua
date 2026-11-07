import * as cheerio from "cheerio";
import { todayInSaoPaulo } from "@/lib/time";
import { fetchHtml } from "../http";
import { absoluteUrl, daysBetween, monthNumber, parseMinutes, parseRating, parseTime, prettyTitle, resolveDayMonth } from "../text";
import type { CinemaAdapter, ScrapedSession } from "../types";

const URL = "https://www.cinesala.com.br/em-cartaz";

/**
 * CineSala. Página (Squarespace) com a semana inteira: "FILMES EM CARTAZ DE 05 a 11 DE Novembro" e, por filme,
 * um bloco "Título - 14h30" com ficha ("Eua - 125 MIN. - 10 Anos - Legendado."). O horário vale para todos os
 * dias do intervalo, exceto avisos como "Dia 11/11, não teremos sessão". Não há sala nem link por filme:
 * o botão leva à bilheteria (Veloz) do cinema naquele dia (nível "cinema").
 */
export const cinesalaAdapter: CinemaAdapter = {
  id: "cinesala",
  cinemaIds: ["cinesala"],

  async scrape() {
    const $ = cheerio.load(await fetchHtml(URL));
    const today = todayInSaoPaulo();

    // "FILMEs EM CARTAZ DE 05 a 11 DE Novembro" (ou "DE 30 DE Outubro a 05 DE Novembro")
    const range = $("body")
      .text()
      .replace(/\s+/g, " ")
      .match(/EM CARTAZ DE\s+(\d{1,2})(?:\s+DE\s+([A-Za-zçÇ]+))?\s+a\s+(\d{1,2})\s+DE\s+([A-Za-zçÇ]+)/i);
    if (!range) throw new Error("Não achei o intervalo de datas da programação do CineSala.");
    const endMonth = monthNumber(range[4]);
    const startMonth = monthNumber(range[2] ?? range[4]);
    if (!endMonth || !startMonth) throw new Error("Mês da programação do CineSala não reconhecido.");
    const days = daysBetween(
      resolveDayMonth(range[1].padStart(2, "0"), startMonth, today),
      resolveDayMonth(range[3].padStart(2, "0"), endMonth, today),
    );

    // Bilheteria do dia: o mesmo endereço, com a data no final.
    const buyBase = $("a")
      .filter((_, a) => /^\s*comprar\s*$/i.test($(a).text()))
      .first()
      .attr("href");
    const ticketFor = (day: string) => (buyBase ? buyBase.replace(/\d{4}-\d{2}-\d{2}$/, day) : null);

    const out: ScrapedSession[] = [];
    $(".sqs-html-content").each((_, el) => {
      const block = $(el);
      const h2 = block.find("h2").first().text().replace(/\s+/g, " ").trim();
      // "Razão e Sensibilidade - 14h30" · "cavalo selvagem nove - 20H50*"
      const m = h2.replace(/\*+$/, "").match(/^(.+)\s+-\s+(\d{1,2}\s*h\s*\d{0,2}(?:\s*(?:\/|,|e)\s*\d{1,2}\s*h\s*\d{0,2})*)$/i);
      if (!m) return;
      const title = prettyTitle(m[1]);
      const times = m[2]
        .split(/\s*(?:\/|,|\be\b)\s*/i)
        .map((t) => parseTime(t))
        .filter((t): t is string => !!t);
      if (!times.length) return;

      // Dias sem sessão: "Dia 11/11, não teremos sessão."
      const text = block.text().replace(/\s+/g, " ");
      const skip = new Set(
        [...text.matchAll(/Dia\s+(\d{1,2})\/(\d{1,2}),?\s+n[aã]o teremos sess/gi)].map((x) =>
          resolveDayMonth(x[1].padStart(2, "0"), x[2].padStart(2, "0"), today),
        ),
      );

      // "Eua - 125 MIN. - 10 Anos - Legendado."
      const facts = block
        .find("h3")
        .map((__, h) => $(h).text().replace(/\s+/g, " ").trim())
        .get()
        .find((t) => /\bMIN\b/i.test(t));
      const [country, minutes, rating, tail] = (facts ?? "").replace(/\.$/, "").split(/\s+-\s+/);
      const language = /legendado/i.test(facts ?? "") ? "leg" : /^bra/i.test(country ?? "") ? "nac" : "leg";

      const poster = block
        .closest(".sqs-row")
        .find("img")
        .map((__, im) => $(im).attr("data-src") || $(im).attr("src") || "")
        .get()
        .find((s) => /squarespace/.test(s) && !/favicon|Screen\+Shot/i.test(s));

      const film: ScrapedSession["film"] = {
        country: country?.trim() || undefined,
        minutes: minutes ? parseMinutes(minutes) : undefined,
        rating: rating ? parseRating(rating) : undefined,
        language: tail && /legendado/i.test(tail) ? "leg" : language,
        posterUrl: absoluteUrl(poster, URL),
      };

      for (const day of days) {
        if (skip.has(day)) continue;
        const url = ticketFor(day);
        for (const time of times) {
          out.push({
            cinemaId: "cinesala",
            title,
            day,
            time,
            room: null,
            ticketUrl: url,
            linkLevel: url ? "cinema" : "cinema",
            film,
          });
        }
      }
    });

    return out;
  },
};
