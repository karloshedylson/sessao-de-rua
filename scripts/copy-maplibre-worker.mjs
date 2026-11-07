// Copia o worker do MapLibre para public/map/: o empacotador não o resolve sozinho, e o app o informa via setWorkerUrl.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";

const from = "node_modules/maplibre-gl/dist";
const to = "public/map";
if (!existsSync(from)) process.exit(0); // dependências ainda não instaladas
mkdirSync(to, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(`${from}/${f}`, `${to}/${f}`);
console.log("worker do MapLibre copiado para public/map/");
