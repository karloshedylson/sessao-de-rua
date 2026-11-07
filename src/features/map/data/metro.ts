import type { MetroLineDef, StationTuple } from "../types";

/** [nome, lat, lng] — posições do OpenStreetMap (conferidas em 05/11/2026). */
export const STATIONS: Record<string, StationTuple> = {
  vmad: ["Vila Madalena", -23.5465, -46.69112],
  sumare: ["Sumaré", -23.55103, -46.67759],
  clinicas: ["Clínicas", -23.55405, -46.67088],
  consol: ["Consolação", -23.55701, -46.66161],
  trianon: ["Trianon-Masp", -23.56331, -46.6542],
  brig: ["Brigadeiro", -23.56859, -46.64776],
  paraiso: ["Paraíso", -23.57539, -46.64096],
  luz: ["Luz", -23.53539, -46.63444],
  sbento: ["São Bento", -23.54404, -46.63432],
  se: ["Sé", -23.55044, -46.63345],
  liberd: ["Liberdade", -23.55523, -46.63586],
  sjoaq: ["São Joaquim", -23.56182, -46.63866],
  vergueiro: ["Vergueiro", -23.56882, -46.63992],
  marechal: ["Marechal Deodoro", -23.53398, -46.6559],
  stcecilia: ["Santa Cecília", -23.53932, -46.64896],
  // República: não consta como estação no OSM com as marcações consultadas; posição aproximada mantida.
  republica: ["República", -23.5442, -46.6428],
  anhang: ["Anhangabaú", -23.54777, -46.63932],
  higien: ["Higienópolis-Mackenzie", -23.54869, -46.65234],
  paulista: ["Paulista", -23.55534, -46.66224],
  oscar: ["Oscar Freire", -23.56089, -46.67193],
  fradique: ["Fradique Coutinho", -23.56639, -46.68406],
  farialima: ["Faria Lima", -23.56689, -46.69341],
};

/** Estações cujo rótulo fica à esquerda do ponto, para não colidir com o traçado. */
export const LABEL_LEFT: Record<string, true> = {
  paulista: true,
  vergueiro: true,
  anhang: true,
  sbento: true,
  liberd: true,
  sjoaq: true,
  higien: true,
  clinicas: true,
};

export const METRO_LINES: MetroLineDef[] = [
  {
    id: "L1",
    name: "Linha 1-Azul",
    color: "#0455A1",
    st: ["luz", "sbento", "se", "liberd", "sjoaq", "vergueiro", "paraiso"],
    pre: [-23.52, -46.63],
    post: [-23.586, -46.637],
  },
  {
    id: "L2",
    name: "Linha 2-Verde",
    color: "#00876A",
    st: ["vmad", "sumare", "clinicas", "consol", "trianon", "brig", "paraiso"],
    pre: null,
    post: [-23.583, -46.637],
  },
  {
    id: "L3",
    name: "Linha 3-Vermelha",
    color: "#EE372F",
    st: ["marechal", "stcecilia", "republica", "anhang", "se"],
    pre: [-23.5254, -46.667],
    post: [-23.548, -46.62],
  },
  {
    id: "L4",
    name: "Linha 4-Amarela",
    color: "#FFD200",
    st: ["luz", "republica", "higien", "paulista", "oscar", "fradique", "farialima"],
    pre: null,
    post: [-23.569, -46.706],
  },
];
