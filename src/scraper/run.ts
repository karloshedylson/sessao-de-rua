/**
 * Executa os scrapers.
 *   npm run scrape                 → todos os adaptadores, grava no banco
 *   npm run scrape -- belas        → só o adaptador "belas"
 *   npm run scrape -- --skip=belas → todos, menos os listados (separados por vírgula)
 *   npm run scrape -- --dry        → mostra o que foi encontrado, sem gravar
 *   npm run scrape -- --enrich-only → só busca cartazes que faltam (TMDB), sem coletar sessões
 *   npm run scrape -- --no-enrich  → coleta sessões sem buscar cartazes
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
  const skip = (args.find((a) => a.startsWith("--skip=")) ?? "").slice("--skip=".length).split(",").filter(Boolean);
  const unknown = ids.filter((id) => !ADAPTERS.some((a) => a.id === id));
  if (unknown.length) {
    throw new Error(`Adaptador desconhecido: ${unknown.join(", ")}. Disponíveis: ${ADAPTERS.map((a) => a.id).join(", ")}`);
  }
  const enrichOnly = args.includes("--enrich-only");
  const adapters = enrichOnly
    ? []
    : (ids.length ? ADAPTERS.filter((a) => ids.includes(a.id)) : ADAPTERS).filter((a) => !skip.includes(a.id));

  // O banco só é carregado fora do modo --dry (e depois do .env.local).
  const store = dry ? null : await import("./persist");
  if (store) await store.syncCinemas();
  if (!adapters.length && !enrichOnly) console.log("Nenhum adaptador para rodar (todos foram pulados).");

  let failed = 0;
  for (const adapter of adapters) {
    const startedAt = new Date();
    console.log(`\n▶ ${adapter.id}`);
    // Faltam variáveis de ambiente (ex.: a planilha ainda não foi configurada): pula, a menos que o
    // adaptador tenha sido pedido pelo nome — aí é um erro de verdade.
    const lacking = (adapter.requires ?? []).filter((name) => !process.env[name]);
    if (lacking.length && !ids.includes(adapter.id)) {
      console.log(`  ⏭ pulado: faltam as variáveis ${lacking.join(", ")}`);
      continue;
    }
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
  // Cartazes que faltam, buscados no TMDB pelo nome do filme. Não é crítico: falha aqui não derruba a coleta.
  if (store && !args.includes("--no-enrich")) {
    console.log("\n▶ cartazes (TMDB)");
    const key = process.env.TMDB_API_KEY;
    if (!key) {
      console.log("  ⏭ pulado: falta a variável TMDB_API_KEY");
    } else {
      try {
        const { enrichFilms } = await import("./enrich");
        const r = await enrichFilms(key);
        console.log(`  ${r.found} cartaz(es) encontrado(s) · ${r.notFound.length} sem resultado${r.failed ? ` · ${r.failed} erro(s)` : ""}`);
        if (r.notFound.length) console.log(`  sem cartaz: ${r.notFound.join("; ")}`);
      } catch (e) {
        console.warn(`  ⚠ não foi possível buscar cartazes: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
