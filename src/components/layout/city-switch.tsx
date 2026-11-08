"use client";

import { CITIES, CITY_IDS } from "@/features/cities/config";
import { useExplorer } from "@/features/explorer/components/explorer-provider";

/** Seletor de cidade do cabeçalho (São Paulo | Recife). */
export function CitySwitch() {
  const { state, setCity } = useExplorer();
  return (
    <div className="seg city-switch" role="group" aria-label="Cidade">
      {CITY_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className={state.city === id ? "on" : ""}
          aria-pressed={state.city === id}
          onClick={() => setCity(id)}
        >
          {CITIES[id].name}
        </button>
      ))}
    </div>
  );
}
