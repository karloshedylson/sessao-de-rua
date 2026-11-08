"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { CITIES, DEFAULT_CITY, isCityId, type CityConfig } from "@/features/cities/config";
import { buildMapModel, type MapModel } from "@/features/map/lib/model";
import { smoothScrollToId } from "@/lib/smooth-scroll";
import type { ScheduleData } from "@/services/sessions/repository";
import type { CityId } from "@/types";
import { deriveView, type ExplorerView } from "../lib/derive";
import { INITIAL_STATE, type ExplorerState } from "../types";

type ExplorerContextValue = {
  /** Programação da cidade ativa: só os cinemas dela (filmes e sessões continuam completos). */
  data: ScheduleData;
  city: CityConfig;
  map: MapModel;
  state: ExplorerState;
  view: ExplorerView;
  /** Mescla um pedaço do estado. */
  patch: (partial: Partial<ExplorerState>) => void;
  /** Troca de cidade, limpando seleção, roteiro e filtros ligados à cidade anterior. */
  setCity: (id: CityId) => void;
  resetFilters: () => void;
  /** Rola suavemente até uma seção (respeita `prefers-reduced-motion`). */
  scrollToSection: (id: string) => void;
};

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

function reducer(state: ExplorerState, partial: Partial<ExplorerState>): ExplorerState {
  return { ...state, ...partial };
}

export function ExplorerProvider({ data: allData, children }: { data: ScheduleData; children: ReactNode }) {
  const [state, patch] = useReducer(reducer, INITIAL_STATE);
  const city = CITIES[state.city];

  const data = useMemo<ScheduleData>(
    () => ({ ...allData, cinemas: allData.cinemas.filter((c) => c.city === state.city) }),
    [allData, state.city],
  );
  const map = useMemo(() => buildMapModel(data.cinemas, city), [data.cinemas, city]);

  // O servidor não conhece a hora do usuário: começa em -1 (nada "já começou") e atualiza no cliente.
  const [nowMin, setNowMin] = useState(-1);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // `?cidade=recife` abre direto na cidade (o servidor sempre renderiza a padrão).
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("cidade");
    if (isCityId(fromUrl) && fromUrl !== DEFAULT_CITY) patch({ city: fromUrl });
  }, []);

  const view = useMemo(() => deriveView(data, state, nowMin, map), [data, state, nowMin, map]);

  const resetFilters = useCallback(
    () =>
      patch({
        period: "all",
        lang: "all",
        bairro: "all",
        query: "",
        selectedCinema: null,
        selectedFilm: null,
        route: null,
      }),
    [],
  );

  const setCity = useCallback((id: CityId) => {
    patch({ city: id, selectedCinema: null, selectedFilm: null, route: null, bairro: "all", query: "" });
    const url = new URL(window.location.href);
    if (id === DEFAULT_CITY) url.searchParams.delete("cidade");
    else url.searchParams.set("cidade", id);
    window.history.replaceState(null, "", url);
  }, []);

  const scrollToSection = useCallback((id: string) => smoothScrollToId(id), []);

  const value = useMemo(
    () => ({ data, city, map, state, view, patch, setCity, resetFilters, scrollToSection }),
    [data, city, map, state, view, setCity, resetFilters, scrollToSection],
  );

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
}

export function useExplorer(): ExplorerContextValue {
  const ctx = useContext(ExplorerContext);
  if (!ctx) throw new Error("useExplorer deve ser usado dentro de <ExplorerProvider>");
  return ctx;
}
