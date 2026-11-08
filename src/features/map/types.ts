export type LatLng = [lat: number, lng: number];
export type StationTuple = [name: string, lat: number, lng: number];

export type MetroLineDef = {
  id: string;
  name: string;
  color: string;
  /** Ids de estação, em ordem. */
  st: string[];
  /** Pontos extras além das estações extremas (para o traçado sair do mapa). */
  pre: LatLng | null;
  post: LatLng | null;
};

export type LandmarkDef = { name: string; lat: number; lng: number; side: 1 | -1 };

export type RouteDef = {
  id: string;
  name: string;
  mode: "walk" | "metro";
  via?: string;
  /** `c:<cinemaId>` ou `s:<stationId>`. */
  path: string[];
};
