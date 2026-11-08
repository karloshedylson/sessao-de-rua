import type { CityId } from "@/types";

export type Bounds = [[west: number, south: number], [east: number, north: number]];

export type CityConfig = {
  id: CityId;
  /** Nome para títulos e buscas ("São Paulo"). */
  name: string;
  /** Enquadramento inicial do mapa. */
  bounds: Bounds;
  /** Limite de navegação: a área coberta pelo arquivo de tiles ([oeste, sul, leste, norte]). */
  maxBounds: [number, number, number, number];
  /** Arquivo PMTiles da cidade (em `public/`). */
  tiles: string;
  /** Se a cidade tem metrô, estações, marcos e roteiros no mapa. */
  hasMetro: boolean;
  /** Bairros com cinema, na ordem do filtro. */
  bairros: string[];
  mapAriaLabel: string;
};

export const CITIES: Record<CityId, CityConfig> = {
  sp: {
    id: "sp",
    name: "São Paulo",
    bounds: [
      [-46.7, -23.58],
      [-46.626, -23.527],
    ],
    maxBounds: [-46.74, -23.61, -46.6, -23.5],
    tiles: "/tiles/sp-centro.pmtiles",
    hasMetro: true,
    bairros: ["Bela Vista", "Cerqueira César", "Consolação", "Paraíso", "Perdizes", "Pinheiros", "República"],
    mapAriaLabel:
      "Mapa do centro expandido de São Paulo com os cinemas de rua, as linhas de metrô e os caminhos a pé entre as salas",
  },
  recife: {
    id: "recife",
    name: "Recife",
    bounds: [
      [-34.965, -8.072],
      [-34.862, -8.016],
    ],
    maxBounds: [-34.99, -8.1, -34.84, -7.99],
    tiles: "/tiles/recife-centro.pmtiles",
    hasMetro: false,
    bairros: ["Apipucos", "Boa Vista", "Casa Forte", "Cidade Universitária", "Derby", "Recife"],
    mapAriaLabel: "Mapa do Recife com os cinemas de rua e salas de cinema públicas",
  },
};

export const CITY_IDS = Object.keys(CITIES) as CityId[];
export const DEFAULT_CITY: CityId = "sp";

export function isCityId(value: string | null | undefined): value is CityId {
  return !!value && value in CITIES;
}
