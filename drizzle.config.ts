import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// drizzle-kit não lê .env.local sozinho; reaproveita o carregador do Next.
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Migrações usam a conexão direta/session pooler (porta 5432).
    url: process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL ?? "",
  },
});
