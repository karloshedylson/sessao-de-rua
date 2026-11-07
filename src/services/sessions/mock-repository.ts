import { CINEMAS } from "@/data/mock/cinemas";
import { FILMS } from "@/data/mock/films";
import { createRng, hashString } from "@/lib/prng";
import { addDaysIso, isoToDate } from "@/lib/time";
import type { Screening } from "@/types";
import type { ScheduleData, SessionsRepository } from "./repository";

const TIME_POOL = [
  "13:30",
  "14:00",
  "14:45",
  "15:30",
  "16:15",
  "17:00",
  "17:45",
  "18:30",
  "19:15",
  "20:00",
  "20:45",
  "21:30",
];

/** Sessões de um dia geradas de forma determinística (mesmo dia → mesma grade). Dados de exemplo. */
function mockDay(iso: string): Record<string, Screening[]> {
  const d = isoToDate(iso);
  const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const out: Record<string, Screening[]> = {};

  for (const c of CINEMAS) {
    const base = createRng(hashString(c.id));
    const order = FILMS.map((f) => ({ id: f.id, k: base() }))
      .sort((a, b) => a.k - b.k)
      .slice(0, 5)
      .map((x) => x.id);
    const r = createRng(hashString(c.id) ^ Math.imul(key, 2654435761));

    let list: Screening[] = [];
    order.forEach((filmId, idx) => {
      if (r() < 0.18) return;
      const n = 1 + Math.floor(r() * 3);
      const set = new Set<string>();
      while (set.size < n) set.add(TIME_POOL[Math.floor(r() * TIME_POOL.length)]);
      list.push({
        filmId,
        times: [...set].sort(),
        room: c.id === "ccsp" ? "Sala Paulo Emílio" : `Sala ${1 + (idx % 3)}`,
      });
    });
    if (list.length < 2) {
      list = order.slice(0, 2).map((filmId, idx) => ({ filmId, times: ["19:15"], room: `Sala ${idx + 1}` }));
    }
    out[c.id] = list;
  }
  return out;
}

export const mockSessionsRepository: SessionsRepository = {
  async getScheduleData(today) {
    const days = Array.from({ length: 7 }, (_, i) => addDaysIso(today, i));
    return {
      cinemas: CINEMAS,
      films: FILMS,
      schedule: { days, byDay: days.map(mockDay) },
    } satisfies ScheduleData;
  },
};
