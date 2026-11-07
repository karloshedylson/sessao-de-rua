import { CINEMAS } from "@/data/mock/cinemas";

type Partner = {
  name: string;
  /** Id do cinema em `data/mock/cinemas.ts`, de onde vem o link do site. */
  cinemaId: string;
  logo: string;
  /** Logo escura sobre fundo claro: invertida para aparecer no rodapé escuro. */
  invert?: boolean;
};

/** Logos publicadas por cada cinema; cada uma leva ao site oficial. O Circuito Spcine reúne Olido e CCSP. */
const PARTNERS: Partner[] = [
  { name: "Cine Belas Artes", cinemaId: "belas", logo: "/logos/belas.svg" },
  { name: "Espaço Petrobras de Cinema", cinemaId: "augusta", logo: "/logos/petrobras-branca.png" },
  { name: "Reserva Cultural", cinemaId: "reserva", logo: "/logos/reserva.png" },
  { name: "CineSala", cinemaId: "cinesala", logo: "/logos/cinesala.webp", invert: true },
  { name: "Cine LT3", cinemaId: "lt3", logo: "/logos/lt3.png" },
  { name: "Circuito Spcine", cinemaId: "olido", logo: "/logos/spcine.png" },
];

export function SiteFooter() {
  const links = PARTNERS.map((p) => ({ ...p, href: CINEMAS.find((c) => c.id === p.cinemaId)?.website ?? null }));

  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-in">
          <div>
            <h2>Sessão de Rua</h2>
            <p>
              Um guia para quem prefere a sala da esquina. Cinemas independentes e do Circuito Spcine, reunidos num só
              mapa da cidade.
            </p>
            <p>O Sessão de Rua não vende ingressos: ao escolher uma sessão você é levado ao site do cinema.</p>
          </div>
        </div>

        <nav className="foot-logos" aria-label="Sites dos cinemas">
          <p className="foot-logos-t">Os cinemas</p>
          <ul>
            {links.map((p) => (
              <li key={p.cinemaId}>
                {p.href ? (
                  <a href={p.href} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} (abre o site em nova aba)`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.logo} alt={p.name} loading="lazy" decoding="async" className={p.invert ? "invert" : undefined} />
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo} alt={p.name} loading="lazy" decoding="async" className={p.invert ? "invert" : undefined} />
                )}
              </li>
            ))}
          </ul>
        </nav>

        <p className="foot-copy">© 2026 Sessão de Rua</p>
      </div>
    </footer>
  );
}
