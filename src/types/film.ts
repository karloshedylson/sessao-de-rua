export type Rating = "L" | "10" | "12" | "14" | "16" | "18";
export type FilmLanguage = "nac" | "leg";
export type PosterMotif = "sun" | "bars" | "rings" | "grid";

export type Film = {
  id: string;
  title: string;
  /** Campos que dependem do site de origem: `null` quando a fonte não informa. */
  country: string | null;
  year: number | null;
  minutes: number | null;
  rating: Rating | null;
  /** `nac` = nacional, `leg` = legendado. */
  language: FilmLanguage;
  genre: string | null;
  /** Cartaz ilustrado, usado quando não há imagem real. */
  poster: { bg: string; fg: string; motif: PosterMotif };
  /** Imagem real do cartaz, quando o cinema de origem a publica. */
  posterUrl?: string | null;
};
