import { scoreOf } from "@/features/film-detail/lib/info";
import type { Film } from "@/types";

type Props = { film: Film; size?: "md" | "sm" };

/** Categoria principal do filme: "Ficção-científica, Drama, Ação" → "Ficção-científica". */
export function primaryGenre(film: Film): string | null {
  const first = film.genre?.split(",")[0]?.trim();
  return first || null;
}

/**
 * Cartaz do filme: só a capa, a categoria (documentário, comédia…) e a classificação indicativa. O nome do
 * filme fica fora da capa (aparece embaixo, no cartão). Usa a imagem real quando existe; sem imagem, cai no
 * cartaz ilustrado (motivo geométrico) com a categoria no lugar do título. A cor de fundo do cartaz
 * ilustrado também aparece enquanto a imagem carrega ou se ela falhar.
 */
export function Poster({ film, size = "md" }: Props) {
  const { bg, fg, motif } = film.poster;
  const style = { backgroundColor: bg, color: fg };
  const genre = primaryGenre(film);
  const image = film.posterUrl ? (
    // Imagem de terceiros (cada cinema hospeda a sua); sem otimização do Next de propósito.
    // eslint-disable-next-line @next/next/no-img-element
    <img className="poster-img" src={film.posterUrl} alt={size === "sm" ? "" : `Cartaz de ${film.title}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
  ) : null;

  if (size === "sm") {
    return (
      <div className={`poster sm m-${motif}${image ? " has-img" : ""}`} style={style} aria-hidden="true">
        {image}
      </div>
    );
  }
  const score = scoreOf(film);
  const scoreBadge = score ? (
    <span className="p-score" title={score.label} aria-label={score.label}>
      <span aria-hidden="true">★ {score.text}</span>
    </span>
  ) : null;
  if (image) {
    return (
      <div className={`poster m-${motif} has-img`} style={style}>
        {image}
        {scoreBadge}
        {(genre || film.rating) && (
          <span className="p-foot">
            {genre ? <span className="p-genre">{genre}</span> : <span />}
            <Rating rating={film.rating} />
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={`poster m-${motif}`} style={style} role="img" aria-label={`Cartaz de ${film.title}`}>
      {scoreBadge}
      <span />
      <span className="p-foot">
        {genre ? <span className="p-title">{genre}</span> : <span />}
        <Rating rating={film.rating} />
      </span>
    </div>
  );
}

export function Rating({ rating }: { rating: Film["rating"] }) {
  if (!rating) return null;
  return (
    <span
      className={`rating r-${rating}`}
      title={rating === "L" ? "Livre para todos os públicos" : `Não recomendado para menores de ${rating} anos`}
    >
      {rating}
    </span>
  );
}
