/** Quão específico é o link: sessão exata > filme no cinema > site do cinema. */
export type LinkLevel = "session" | "film" | "cinema";

export type SessionLink = { url: string; level: LinkLevel };

/** Um filme em cartaz num cinema, num dia, com seus horários ("HH:mm", ordenados). */
export type Screening = {
  filmId: string;
  times: string[];
  room: string;
  /** Link de cada horário (chave = "HH:mm"). Ausente = usar o site do cinema. */
  links?: Record<string, SessionLink>;
};

export type Schedule = {
  /** Sete dias a partir de hoje, em ISO `yyyy-mm-dd`. O índice 0 é hoje. */
  days: string[];
  /** Para cada dia (mesmo índice de `days`): sessões por id de cinema. */
  byDay: Record<string, Screening[]>[];
};
