import { layers, namedFlavor, type Flavor } from "@protomaps/basemaps";
import type { StyleSpecification } from "maplibre-gl";

/** Fonte de vetores (PMTiles) servida pelo próprio projeto: sem conta, chave ou serviço externo. */
export const TILES_PATH = "/tiles/sp-centro.pmtiles";
/** Glifos (fontes dos rótulos), também locais. */
const GLYPHS_PATH = "/map/fonts/{fontstack}/{range}.pbf";

const SOURCE = "protomaps";

/** Paleta do mapa ilustrado original aplicada ao mapa real. */
const PALETTE = {
  base: "#ede3cf",
  block: "#e4d7bd",
  plaza: "#e9dec6",
  park: "#c4cf9e",
  wood: "#bcc896",
  scrub: "#d0d6aa",
  water: "#b9d0d4",
  street: "#fffdf8",
  casing: "#cdbb9c",
  rail: "#bcae96",
  label: "#5e5249",
  hood: "#6f604b",
} as const;

function flavor(): Flavor {
  const p = PALETTE;
  return {
    ...namedFlavor("light"),
    background: p.base,
    earth: p.base,
    park_a: p.park,
    park_b: p.park,
    wood_a: p.wood,
    wood_b: p.wood,
    scrub_a: p.scrub,
    scrub_b: p.scrub,
    zoo: p.park,
    hospital: p.plaza,
    school: p.plaza,
    industrial: p.block,
    pedestrian: p.plaza,
    sand: p.plaza,
    beach: p.plaza,
    aerodrome: p.block,
    military: p.block,
    runway: p.casing,
    pier: p.block,
    water: p.water,
    buildings: p.block,
    other: p.street,
    minor_service: p.street,
    minor_a: p.street,
    minor_b: p.street,
    link: p.street,
    major: p.street,
    highway: p.street,
    minor_service_casing: p.casing,
    minor_casing: p.casing,
    link_casing: p.casing,
    major_casing_early: p.casing,
    major_casing_late: p.casing,
    highway_casing_early: p.casing,
    highway_casing_late: p.casing,
    tunnel_other: "#f4efe3",
    tunnel_minor: "#f4efe3",
    tunnel_link: "#f4efe3",
    tunnel_major: "#f4efe3",
    tunnel_highway: "#f4efe3",
    tunnel_other_casing: "#d9cdb4",
    tunnel_minor_casing: "#d9cdb4",
    tunnel_link_casing: "#d9cdb4",
    tunnel_major_casing: "#d9cdb4",
    tunnel_highway_casing: "#d9cdb4",
    bridges_other: p.street,
    bridges_minor: p.street,
    bridges_link: p.street,
    bridges_major: p.street,
    bridges_highway: p.street,
    bridges_other_casing: p.casing,
    bridges_minor_casing: p.casing,
    bridges_link_casing: p.casing,
    bridges_major_casing: p.casing,
    bridges_highway_casing: p.casing,
    railway: p.rail,
    boundaries: p.rail,
    roads_label_minor: p.label,
    roads_label_minor_halo: p.street,
    roads_label_major: p.label,
    roads_label_major_halo: p.street,
    ocean_label: "#6a8a90",
    subplace_label: p.hood,
    subplace_label_halo: p.base,
    city_label: p.hood,
    city_label_halo: p.base,
    state_label: p.hood,
    state_label_halo: p.base,
    country_label: p.hood,
    address_label: "#8a7d6c",
    address_label_halo: p.base,
  };
}

/** Camadas que não usamos: ícones (não há sprite local), fronteiras e rótulos de cidade/estado/país. */
const DROP_IDS = new Set([
  "pois",
  "address_label",
  "boundaries_country",
  "boundaries",
  "places_region",
  "places_country",
  "places_locality",
  "earth_label_islands",
  "water_label_ocean",
  "roads_shields",
  "roads_oneway",
]);

/** Estilo MapLibre completo: camadas do Protomaps recoloridas, sem dependências externas. */
export function buildBasemapStyle(origin: string): StyleSpecification {
  const base = layers(SOURCE, flavor(), { lang: "pt" })
    .filter((l) => !DROP_IDS.has(l.id) && !(l.type === "symbol" && l.layout?.["icon-image"]))
    .map((l) => {
      // Bairros em caixa alta com espaçamento largo, como no desenho ilustrado.
      if (l.id === "places_subplace" && l.type === "symbol") {
        return {
          ...l,
          layout: { ...l.layout, "text-transform": "uppercase", "text-letter-spacing": 0.25, "text-size": 12 },
        };
      }
      return l;
    });

  return {
    version: 8,
    glyphs: `${origin}${GLYPHS_PATH}`,
    sources: {
      [SOURCE]: {
        type: "vector",
        url: `pmtiles://${origin}${TILES_PATH}`,
        attribution:
          '<a href="https://protomaps.com" target="_blank" rel="noopener noreferrer">Protomaps</a> © <a href="https://openstreetmap.org" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      },
    },
    layers: base as StyleSpecification["layers"],
  };
}
