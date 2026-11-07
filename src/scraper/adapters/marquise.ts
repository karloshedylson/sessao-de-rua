import * as cheerio from "cheerio";
import { fetchHtml } from "../http";
import { parseTime } from "../text";
import type { CinemaAdapter, ScrapedSession } from "../types";

const URL = "https://www.cinemarquise.com.br/paulista/programacao";

/**
 * Cine Marquise (unidade Paulista). A página de programação traz um link por sessão para a bilheteria
 * (vendabem) e o rótulo do link descreve a sessão inteira:
 * "Comprar ingresso para O Fantasma da Ópera - LEG (2D) - 06/11/2026 às 15:45 - sala 3".
 * A página repete cada sessão em duas listas (completa e compacta): deduplicamos pelo link.
 * Link: a sessão exata (nível "session").
 */
export const marquiseAdapter: CinemaAdapter = {
  id: "marquise",
  cinemaIds: ["marquise"],

  async scrape() {
    const $ = cheerio.load(await fetchHtml(URL));
    const out: ScrapedSession[] = [];
    const seen = new Set<string>();

    $("a[href*='vendabem'][href*='sessao=']").each((_, a) => {
      const href = $(a).attr("href");
      if (!href || seen.has(href)) return;
      const label = ($(a).attr("aria-label") || $(a).attr("title") || $(a).text()).replace(/\s+/g, " ");
      const m = label.match(
        /Comprar ingresso para (.+?) - (LEG|NAC|DUB)\b[^-]*- (\d{2})\/(\d{2})\/(\d{4}) às (\d{1,2}:\d{2}) - sala (\w+)/i,
      );
      if (!m) return;
      const time = parseTime(m[6]);
      if (!time) return;
      seen.add(href);

      out.push({
        cinemaId: "marquise",
        title: m[1].trim(),
        day: `${m[5]}-${m[4]}-${m[3]}`,
        time,
        room: `Sala ${m[7]}`,
        ticketUrl: href,
        linkLevel: "session",
        film: { language: m[2].toUpperCase() === "NAC" ? "nac" : "leg" },
      });
    });

    return out;
  },
};
