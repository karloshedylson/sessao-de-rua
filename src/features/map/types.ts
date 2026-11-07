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

export type StreetDef = {
  name: string;
  kind: "major" | "mid" | "minor" | "elev";
  path: LatLng[];
  /** Fração (0–1) do comprimento em que o rótulo é posicionado. */
  labelAt: number;
};

export type ParkDef = {
  name: string;
  lat: number;
  lng: number;
  widthM: number;
  heightM: number;
  rotate: number;
  kind: "park" | "cem" | "plaza";
  big: boolean;
};

export type NeighborhoodDef = { name: string; lat: number; lng: number };
export type LandmarkDef = { name: string; lat: number; lng: number; side: 1 | -1 };
export type EdgeLabelDef = { text: string; x: number; y: number; className: string };

export type RouteDef = {
  id: string;
  name: string;
  mode: "walk" | "metro";
  via?: string;
  /** `c:<cinemaId>` ou `s:<stationId>`. */
  path: string[];
};
