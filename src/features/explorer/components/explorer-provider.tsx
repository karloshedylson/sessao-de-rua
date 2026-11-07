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
import { buildMapModel, type MapModel } from "@/features/map/lib/model";
import { smoothScrollToId } from "@/lib/smooth-scroll";
import type { ScheduleData } from "@/services/sessions/repository";
import { deriveView, type ExplorerView } from "../lib/derive";
import { INITIAL_STATE, type ExplorerState } from "../types";

type ExplorerContextValue = {
  data: ScheduleData;
  map: MapModel;
  state: ExplorerState;
  view: ExplorerView;
  /** Mescla um pedaço do estado. */
  patch: (partial: Partial<ExplorerState>) => void;
  resetFilters: () => void;
  /** Rola suavemente até uma seção (respeita `prefers-reduced-motion`). */
  scrollToSection: (id: string) => void;
};

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

function reducer(state: ExplorerState, partial: Partial<ExplorerState>): ExplorerState {
  return { ...state, ...partial };
}

export function ExplorerProvider({ data, children }: { data: ScheduleData; children: ReactNode }) {
  const [state, patch] = useReducer(reducer, INITIAL_STATE);
  const map = useMemo(() => buildMapModel(data.cinemas), [data.cinemas]);

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

  const scrollToSection = useCallback((id: string) => smoothScrollToId(id), []);

  const value = useMemo(
    () => ({ data, map, state, view, patch, resetFilters, scrollToSection }),
    [data, map, state, view, resetFilters, scrollToSection],
  );

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
}

export function useExplorer(): ExplorerContextValue {
  const ctx = useContext(ExplorerContext);
  if (!ctx) throw new Error("useExplorer deve ser usado dentro de <ExplorerProvider>");
  return ctx;
}
