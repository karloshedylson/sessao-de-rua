export type Period = "all" | "tarde" | "noite";
export type LangFilter = "all" | "nac" | "leg";
export type GroupBy = "cinema" | "filme";

import type { CityId } from "@/types";

export type ExplorerState = {
  /** Cidade ativa. */
  city: CityId;
  /** Índice do dia escolhido (0 = hoje). */
  day: number;
  period: Period;
  lang: LangFilter;
  bairro: string;
  query: string;
  groupBy: GroupBy;
  /** Cinema selecionado no mapa. */
  selectedCinema: string | null;
  /** Filme escolhido no cartaz. */
  selectedFilm: string | null;
  /** Filme aberto na janela "Sobre o filme". */
  detailFilm: string | null;
  /** Roteiro ativo. */
  route: string | null;
};

export const INITIAL_STATE: ExplorerState = {
  city: "sp",
  day: 0,
  period: "all",
  lang: "all",
  bairro: "all",
  query: "",
  groupBy: "cinema",
  selectedCinema: null,
  selectedFilm: null,
  detailFilm: null,
  route: null,
};
