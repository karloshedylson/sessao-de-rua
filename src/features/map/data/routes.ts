import type { RouteDef } from "../types";

/** Roteiros sugeridos exibidos acima do mapa. */
export const ROUTES: RouteDef[] = [
  { id: "paulista", name: "Eixo Paulista", mode: "walk", path: ["c:belas", "c:augusta", "c:reserva"] },
  {
    id: "amarela",
    name: "Pinheiros → Centro",
    mode: "metro",
    via: "Linha 4-Amarela",
    path: ["c:cinesala", "s:fradique", "s:oscar", "s:paulista", "c:belas", "s:paulista", "s:higien", "s:republica", "c:olido"],
  },
  {
    id: "sul",
    name: "Paulista → Paraíso",
    mode: "metro",
    via: "Linhas 2-Verde e 1-Azul",
    path: ["c:reserva", "s:brig", "s:paraiso", "s:vergueiro", "c:ccsp"],
  },
];
