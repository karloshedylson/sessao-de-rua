/**
 * Executa os scrapers.
 *   npm run scrape                 → todos os adaptadores, grava no banco
 *   npm run scrape -- belas        → só o adaptador "belas"
 *   npm run scrape -- --dry        → mostra o que foi encontrado, sem gravar
 */
import { loadEnvConfig } from "@next/env";
import { ADAPTERS } from "./adapters";
import type { ScrapedSession } from "./types";

loadEnvConfig(process.cwd());

function summarize(found: ScrapedSession[]): string {
  const perCinema = new Map<string, number>();
  const films = new Set<string>();
  const days = new Set<string>();
  const levels = new Map<string, number>();
  for (const s of found) {
    perCinema.set(s.cinemaId, (perCinema.get(s.cinemaId) ?? 0) + 1);
    films.add(s.title);
    days.add(s.day);
    levels.set(s.linkLevel, (levels.get(s.linkLevel) ?? 0) + 1);
  }
  const fmt = (m: Map<string, number>) => [...m].map(([k, v]) => `${k}=${v}`).join(", ");
  return [
    `  ${found.length} sessões · ${films.size} filmes · dias: ${[...days].sort().join(", ")}`,
    `  por cinema: ${fmt(perCinema)}`,
    `  nível do link: ${fmt(levels)}`,
  ].join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const ids = args.filter((a) => !a.startsWith("--"));
  const adapters = ids.length ? ADAPTERS.filter((a) => ids.includes(a.id)) : ADAPTERS;
  if (!adapters.length) throw new Error(`Adaptador desconhecido. Disponíveis: ${ADAPTERS.map((a) => a.id).join(", ")}`);

  // O banco só é carregado fora do modo --dry (e depois do .env.local).
  const store = dry ? null : await import("./persist");
  if (store) await store.syncCinemas();

  let failed = 0;
  for (const adapter of adapters) {
    const startedAt = new Date();
    console.log(`\n▶ ${adapter.id}`);
    try {
      const found = await adapter.scrape();
      console.log(summarize(found));
      if (dry) {
        for (const s of found.slice(0, 5)) console.log(`   ${s.cinemaId} ${s.day} ${s.time} ${s.title} [${s.room ?? "-"}] ${s.linkLevel} ${s.ticketUrl ?? ""}`);
      } else if (store) {
        await store.persistAdapter(adapter, found);
        await store.recordRun(adapter, startedAt, { found });
        console.log("  ✓ gravado");
      }
    } catch (e) {
      failed++;
      const message = e instanceof Error ? e.message : String(e);
      console.error(`  ✗ ${message}`);
      if (store) await store.recordRun(adapter, startedAt, { error: message });
    }
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
