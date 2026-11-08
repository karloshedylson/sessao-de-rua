import * as cheerio from "cheerio";
import { fetchHtml } from "../http";
import { absoluteUrl, parseMinutes, parseRating, parseTime } from "../text";
import type { CinemaAdapter, ScrapedSession } from "../types";

const URL = "https://www.cinemarquise.com.br/paulista/programacao";

type FilmMeta = Pick<ScrapedSession["film"], "posterUrl" | "rating" | "minutes" | "genre">;

/**
 * Cine Marquise (unidade Paulista). A página de programação tem um bloco `.row.item` por filme (cartaz,
 * classificação, duração, gênero) e, dentro dele, um link por sessão para a bilheteria (vendabem). O rótulo do
 * link descreve a sessão inteira:
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

    // Metadados por filme, casados pelo `filme=` dos links de compra do bloco. Bloco com mais de um filme
    // (ambíguo) é ignorado: melhor sem o dado do que com o de outro filme.
    const metaByFilm = new Map<string, FilmMeta>();
    $(".row.item").each((_, el) => {
      const block = $(el);
      const ids = new Set(
        block
          .find("a[href*='vendabem'][href*='filme=']")
          .map((__, a) => $(a).attr("href")?.match(/filme=(\d+)/)?.[1])
          .get()
          .filter(Boolean),
      );
      if (ids.size !== 1) return;

      // Itens "Duração: 2h 15m" e "Gênero: Ficção-científica, Drama": o rótulo sai e sobra o valor.
      const field = (label: string) => {
        const item = block
          .find(".programacao-movie-meta-item")
          .filter((__, i) => new RegExp(label, "i").test($(i).find(".programacao-movie-meta-label").text()))
          .first();
        return item.clone().find(".programacao-movie-meta-label").remove().end().text().replace(/\s+/g, " ").trim();
      };
      metaByFilm.set([...ids][0]!, {
        posterUrl: absoluteUrl(block.find("img.poster").first().attr("src"), URL),
        rating: parseRating(block.find(".programacao-rating").first().text()),
        minutes: parseMinutes(field("Dura")),
        genre: field("G[eê]nero") || undefined,
      });
    });

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
        film: { ...metaByFilm.get(href.match(/filme=(\d+)/)?.[1] ?? ""), language: m[2].toUpperCase() === "NAC" ? "nac" : "leg" },
      });
    });

    return out;
  },
};
