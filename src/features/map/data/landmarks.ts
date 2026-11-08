import type { LandmarkDef } from "../types";

/** Marcos de São Paulo exibidos no mapa: [nome, lat, lng, lado do rótulo]. */
const LANDMARKS_RAW: [string, number, number, 1 | -1][] = [
  ["Theatro Municipal", -23.5452, -46.6386, 1],
  ["Copan", -23.5463, -46.6445, -1],
  ["Mercadão", -23.5417, -46.6297, -1],
  ["PUC-SP", -23.537, -46.6713, 1],
  ["Pinacoteca", -23.5342, -46.6338, 1],
  ["Conjunto Nacional", -23.5577, -46.6592, 1],
];

export const LANDMARKS: LandmarkDef[] = LANDMARKS_RAW.map(([name, lat, lng, side]) => ({ name, lat, lng, side }));
