import type { EdgeLabelDef, LandmarkDef, NeighborhoodDef } from "../types";

const HOODS_RAW: [string, number, number][] = [
  ["CENTRO", -23.5462, -46.6298],
  ["SANTA CECÍLIA", -23.5372, -46.6522],
  ["HIGIENÓPOLIS", -23.543, -46.6595],
  ["PERDIZES", -23.54, -46.6885],
  ["BELA VISTA", -23.5585, -46.6448],
  ["JARDINS", -23.5702, -46.668],
  ["PINHEIROS", -23.5712, -46.693],
  ["VILA MADALENA", -23.552, -46.692],
  ["LIBERDADE", -23.559, -46.6318],
  ["PARAÍSO", -23.577, -46.6505],
];

export const NEIGHBORHOODS: NeighborhoodDef[] = HOODS_RAW.map(([name, lat, lng]) => ({ name, lat, lng }));

const LANDMARKS_RAW: [string, number, number, 1 | -1][] = [
  ["Theatro Municipal", -23.5452, -46.6386, 1],
  ["Copan", -23.5463, -46.6445, -1],
  ["Mercadão", -23.5417, -46.6297, -1],
  ["PUC-SP", -23.537, -46.6713, 1],
  ["Pinacoteca", -23.5342, -46.6338, 1],
  ["Conjunto Nacional", -23.5577, -46.6592, 1],
];

export const LANDMARKS: LandmarkDef[] = LANDMARKS_RAW.map(([name, lat, lng, side]) => ({ name, lat, lng, side }));

/** Rótulos nas bordas do mapa (coordenadas já em espaço SVG). */
const EDGES_RAW: [string, number, number, string][] = [
  ["↑ BARRA FUNDA · RIO TIETÊ", 470, 20, "edge mid"],
  ["← RIO PINHEIROS · BUTANTÃ", 12, 712, "edge"],
  ["BRÁS · MOOCA →", 988, 175, "edge end"],
  ["IBIRAPUERA · MOEMA ↓", 560, 772, "edge mid"],
];

export const EDGE_LABELS: EdgeLabelDef[] = EDGES_RAW.map(([text, x, y, className]) => ({ text, x, y, className }));
