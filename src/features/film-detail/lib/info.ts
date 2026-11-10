import type { Film } from "@/types";

/** Com poucos votos a média engana (um filme novo com 2 votos de 10): só mostramos a nota a partir daqui. */
export const MIN_VOTES = 10;

export type ScoreInfo = { text: string; votes: number; label: string };

/** Nota do TMDB pronta para exibir ("7,8"), ou null se não há nota confiável. */
export function scoreOf(film: Film): ScoreInfo | null {
  const { tmdbScore: score, tmdbVotes: votes } = film;
  if (!score || !votes || votes < MIN_VOTES) return null;
  const text = score.toFixed(1).replace(".", ",");
  return { text, votes, label: `Nota dos usuários do TMDB: ${text} de 10, com ${votes.toLocaleString("pt-BR")} votos` };
}
