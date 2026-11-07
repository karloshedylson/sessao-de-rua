export type Period = "all" | "tarde" | "noite";
export type LangFilter = "all" | "nac" | "leg";
export type GroupBy = "cinema" | "filme";

export type ExplorerState = {
  /** Índice do dia escolhido (0 = hoje). */
  day: number;
  period: Period;
  lang: LangFilter;
  bairro: string;
  query: string;
  hidePast: boolean;
  groupBy: GroupBy;
  /** Cinema selecionado no mapa. */
  selectedCinema: string | null;
  /** Filme escolhido no cartaz. */
  selectedFilm: string | null;
  /** Roteiro ativo. */
  route: string | null;
};

export const INITIAL_STATE: ExplorerState = {
  day: 0,
  period: "all",
  lang: "all",
  bairro: "all",
  query: "",
  hidePast: true,
  groupBy: "cinema",
  selectedCinema: null,
  selectedFilm: null,
  route: null,
};
