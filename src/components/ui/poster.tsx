import type { Film } from "@/types";

type Props = { film: Film; size?: "md" | "sm" };

/**
 * Cartaz do filme. Usa a imagem real quando o cinema de origem a publica; sem imagem, cai no cartaz
 * ilustrado (motivo geométrico + título). A cor de fundo do cartaz ilustrado também aparece enquanto a
 * imagem carrega ou se ela falhar.
 */
export function Poster({ film, size = "md" }: Props) {
  const { bg, fg, motif } = film.poster;
  const style = { backgroundColor: bg, color: fg };
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
  if (image) {
    return (
      <div className={`poster m-${motif} has-img`} style={style}>
        {image}
        <span className="p-foot">
          <Rating rating={film.rating} />
        </span>
      </div>
    );
  }
  return (
    <div className={`poster m-${motif}`} style={style}>
      <span className="p-top">{[film.country, film.year].filter(Boolean).join(" · ")}</span>
      <span className="p-foot">
        <span className="p-title">{film.title}</span>
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
