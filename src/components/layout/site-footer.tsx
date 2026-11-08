"use client";

import { CINEMAS } from "@/data/mock/cinemas";
import { useExplorer } from "@/features/explorer/components/explorer-provider";
import type { CityId } from "@/types";

type Partner = {
  name: string;
  /** Id do cinema em `data/mock/cinemas.ts`, de onde vem o link do site. */
  cinemaId: string;
  /** Logo publicada pelo cinema; sem logo, o cartão mostra só o nome. */
  logo?: string;
  /** Logo escura sobre fundo claro: invertida para aparecer no rodapé escuro. */
  invert?: boolean;
};

/** Cada cartão leva ao site (ou Instagram) oficial. O Circuito Spcine reúne Olido e CCSP; a Fundação, as três salas. */
const PARTNERS: Record<CityId, Partner[]> = {
  sp: [
    { name: "Cine Belas Artes", cinemaId: "belas", logo: "/logos/belas.svg" },
    { name: "Espaço Petrobras de Cinema", cinemaId: "augusta", logo: "/logos/petrobras-branca.png" },
    { name: "Reserva Cultural", cinemaId: "reserva", logo: "/logos/reserva.png" },
    { name: "CineSala", cinemaId: "cinesala", logo: "/logos/cinesala.webp", invert: true },
    { name: "Cine LT3", cinemaId: "lt3", logo: "/logos/lt3.png" },
    { name: "Circuito Spcine", cinemaId: "olido", logo: "/logos/spcine.png" },
  ],
  recife: [
    { name: "Cinema São Luiz", cinemaId: "saoluiz" },
    { name: "Cinema da Fundação", cinemaId: "fundacao-derby" },
    { name: "Cineteatro do Parque", cinemaId: "teatro-parque" },
    { name: "Cine Apipucos", cinemaId: "apipucos" },
    { name: "Cine UFPE", cinemaId: "ufpe" },
  ],
};

export function SiteFooter() {
  const { state } = useExplorer();
  const links = PARTNERS[state.city].map((p) => ({
    ...p,
    href: CINEMAS.find((c) => c.id === p.cinemaId)?.website ?? null,
  }));

  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-in">
          <div>
            <h2>Sessão de Rua</h2>
            <p>
              Um guia para quem prefere a sala da esquina. Cinemas independentes reunidos num só
              mapa da cidade.
            </p>
            <p>O Sessão de Rua não vende ingressos: ao escolher uma sessão você é levado ao site do cinema.</p>
          </div>
        </div>

        <nav className="foot-logos" aria-label="Sites dos cinemas">
          <p className="foot-logos-t">Os cinemas</p>
          <ul>
            {links.map((p) => {
              const content = p.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logo} alt={p.name} loading="lazy" decoding="async" className={p.invert ? "invert" : undefined} />
              ) : (
                <span className="foot-name">{p.name}</span>
              );
              return (
                <li key={p.cinemaId}>
                  {p.href ? (
                    <a href={p.href} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} (abre o site em nova aba)`}>
                      {content}
                    </a>
                  ) : (
                    <div className="foot-static">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <p className="foot-tmdb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/tmdb.svg" alt="TMDB" loading="lazy" decoding="async" />
          <span>
            Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. Parte dos cartazes e dos
            dados dos filmes vem de lá.
          </span>
        </p>

        <p className="foot-copy">© 2026 Sessão de Rua</p>
      </div>
    </footer>
  );
}
