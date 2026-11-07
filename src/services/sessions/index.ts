import { cacheLife } from "next/cache";
import { todayInSaoPaulo } from "@/lib/time";
import { dbSessionsRepository } from "./db-repository";
import { mockSessionsRepository } from "./mock-repository";
import type { ScheduleData, SessionsRepository } from "./repository";

/** Dados reais (Postgres) por padrão. `USE_MOCK_DATA=1` no `.env.local` volta aos dados de exemplo. */
const repository: SessionsRepository = process.env.USE_MOCK_DATA === "1" ? mockSessionsRepository : dbSessionsRepository;

/** Programação dos próximos 7 dias. Cacheada: a data de "hoje" é fixada no momento do cache. */
export async function getScheduleData(): Promise<ScheduleData> {
  "use cache";
  cacheLife("minutes");
  return repository.getScheduleData(todayInSaoPaulo());
}
