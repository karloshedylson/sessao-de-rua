import type { Cinema, Film, Schedule } from "@/types";

export type ScheduleData = {
  cinemas: Cinema[];
  films: Film[];
  schedule: Schedule;
};

/**
 * Contrato da fonte de dados de sessões. Hoje há só a implementação com dados
 * de exemplo; quando o scraper e o banco existirem, basta uma implementação
 * (ex.: Postgres/Drizzle) com esta mesma interface — a UI não muda.
 */
export interface SessionsRepository {
  /** Programação dos próximos 7 dias a partir de `today` (ISO `yyyy-mm-dd`, fuso de São Paulo). */
  getScheduleData(today: string): Promise<ScheduleData>;
}
