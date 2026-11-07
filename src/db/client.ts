import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida (veja .env.local).");

// `prepare: false` é exigido pelo Transaction pooler do Supabase (porta 6543).
const client = postgres(url, { prepare: false });

export const db = drizzle(client, { schema });
