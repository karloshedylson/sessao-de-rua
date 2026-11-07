import type { LinkLevel } from "@/types";

export type { LinkLevel };

/** Uma sessão como saiu do site, já normalizada (data ISO, hora "HH:mm"). */
export type ScrapedSession = {
  cinemaId: string;
  title: string;
  /** `yyyy-mm-dd` */
  day: string;
  /** `HH:mm` */
  time: string;
  room: string | null;
  ticketUrl: string | null;
  linkLevel: LinkLevel;
  film: {
    country?: string;
    year?: number;
    minutes?: number;
    /** "L" | "10" | "12" | "14" | "16" | "18" */
    rating?: string;
    /** "nac" | "leg" */
    language?: string;
    genre?: string;
    /** URL absoluta da imagem do cartaz. */
    posterUrl?: string;
  };
};

export interface CinemaAdapter {
  /** Identificador usado na linha de comando (`npm run scrape -- belas`). */
  id: string;
  /** Cinemas (ids de `data/mock/cinemas.ts`) que esse adaptador cobre. */
  cinemaIds: string[];
  scrape(): Promise<ScrapedSession[]>;
}
