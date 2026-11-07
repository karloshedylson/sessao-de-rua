/** Distância em km entre dois pontos (haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const t = Math.PI / 180;
  const dLat = (lat2 - lat1) * t;
  const dLng = (lng2 - lng1) * t;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Minutos a pé a 4,8 km/h, com fator 1,25 para o desvio das ruas. */
export function walkMinutes(km: number): number {
  return Math.max(1, Math.round(((km * 1.25) / 4.8) * 60));
}
