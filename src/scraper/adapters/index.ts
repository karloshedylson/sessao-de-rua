import type { CinemaAdapter } from "../types";
import { belasAdapter } from "./belas";
import { cinesalaAdapter } from "./cinesala";
import { fundacaoAdapter } from "./fundacao";
import { lt3Adapter } from "./lt3";
import { marquiseAdapter } from "./marquise";
import { petrobrasAdapter } from "./petrobras";
import { planilhaAdapter } from "./planilha";
import { reservaAdapter } from "./reserva";
import { spcineAdapter } from "./spcine";

/** Adaptadores disponíveis. Novos cinemas entram aqui. */
export const ADAPTERS: CinemaAdapter[] = [
  belasAdapter,
  spcineAdapter,
  petrobrasAdapter,
  lt3Adapter,
  cinesalaAdapter,
  reservaAdapter,
  marquiseAdapter,
  fundacaoAdapter,
  planilhaAdapter,
];
