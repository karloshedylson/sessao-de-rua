"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { CITIES, DEFAULT_CITY, isCityId, type CityConfig } from "@/features/cities/config";
import { buildMapModel, type MapModel } from "@/features/map/lib/model";
import { smoothScrollToId } from "@/lib/smooth-scroll";
import { toMinutes } from "@/lib/time";
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
  /** Aplica o estado e vai para outra página do site (se já estiver nela, só aplica o estado). */
  go: (path: "/" | "/sessoes", partial?: Partial<ExplorerState>, hash?: string) => void;
};

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

/**
 * Query do endereço a partir do estado: valores padrão ficam de fora (`""` quando não sobra nada). A cidade vale
 * para o site todo; dia, filme e cinema só entram na página de sessões (é ali que o link precisa ser compartilhável).
 */
function buildQuery(state: ExplorerState, days: string[], path: string): string {
  const q = new URLSearchParams();
  if (state.city !== DEFAULT_CITY) q.set("cidade", state.city);
  if (path === "/sessoes") {
    if (state.day > 0 && days[state.day]) q.set("dia", days[state.day]);
    if (state.selectedFilm) q.set("filme", state.selectedFilm);
    if (state.selectedCinema) q.set("cinema", state.selectedCinema);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

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

  const router = useRouter();
  const pathname = usePathname();
  const pickedFor = useRef<CityId | null>(null);
  // "idle" → ainda não leu a URL; "pending" → leu, mas o estado lido ainda não foi aplicado; "ready" → pode escrever.
  const urlSync = useRef<"idle" | "pending" | "ready">("idle");
  /** Página para a qual uma navegação está em andamento (enquanto não chega, a URL não é reescrita). */
  const navTarget = useRef<string | null>(null);

  // A URL guarda cidade, dia, filme e cinema (`?cidade=recife&dia=2026-11-10&filme=12&cinema=ufpe`): o servidor
  // sempre renderiza o estado padrão e o cliente aplica o que veio no endereço. Ids que não existem são ignorados.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const cinema = allData.cinemas.find((c) => c.id === q.get("cinema"));
    const film = allData.films.find((f) => f.id === q.get("filme"));
    const fromUrl = q.get("cidade");
    const city = cinema?.city ?? (isCityId(fromUrl) ? fromUrl : DEFAULT_CITY);
    const day = allData.schedule.days.indexOf(q.get("dia") ?? "");

    const next: Partial<ExplorerState> = {};
    if (city !== DEFAULT_CITY) next.city = city;
    if (cinema) next.selectedCinema = cinema.id;
    if (film) next.selectedFilm = film.id;
    if (day >= 0) {
      next.day = day;
      pickedFor.current = city; // o dia do link vale mais que a pré-seleção automática
    }
    urlSync.current = "pending";
    if (Object.keys(next).length) patch(next);
  }, [allData]);

  // Mantém a URL em dia com o estado, sem criar entradas no histórico (quem cria é a navegação entre páginas).
  useEffect(() => {
    if (urlSync.current === "idle") return;
    if (urlSync.current === "pending") {
      urlSync.current = "ready"; // primeira passada: o estado lido da URL ainda não chegou
      return;
    }
    // Navegação em andamento: escrever agora, com a página antiga, cancelaria a troca. Espera chegar na nova.
    if (navTarget.current) {
      if (pathname !== navTarget.current) return;
      navTarget.current = null;
    }
    const qs = buildQuery(state, allData.schedule.days, pathname);
    const url = `${window.location.pathname}${qs}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, "", url);
    }
  }, [pathname, state.city, state.day, state.selectedFilm, state.selectedCinema, allData.schedule.days]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dia pré-selecionado: se hoje já não tem sessões (todas passaram), abre no próximo dia que tiver. Roda uma vez
  // por cidade (assim que a hora do usuário é conhecida), sem brigar com a escolha que a pessoa fizer depois.
  useEffect(() => {
    if (nowMin < 0 || pickedFor.current === state.city) return;
    pickedFor.current = state.city;
    const ids = data.cinemas.map((c) => c.id);
    const hasSessions = (day: number, from = 0) =>
      ids.some((id) => (data.schedule.byDay[day]?.[id] ?? []).some((s) => s.times.some((t) => toMinutes(t) >= from)));
    if (hasSessions(0, nowMin)) return patch({ day: 0 });
    const next = data.schedule.byDay.findIndex((_, d) => d > 0 && hasSessions(d));
    patch({ day: next > 0 ? next : 0 });
  }, [nowMin, state.city, data]);

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
    patch({ city: id, selectedCinema: null, selectedFilm: null, detailFilm: null, route: null, bairro: "all", query: "" });
  }, []);

  const scrollToSection = useCallback((id: string) => smoothScrollToId(id), []);

  const go = useCallback(
    (path: "/" | "/sessoes", partial: Partial<ExplorerState> = {}, hash = "") => {
      if (path === pathname) {
        patch(partial); // já está lá: quem chamou cuida da rolagem
        return;
      }
      navTarget.current = path;
      patch(partial);
      // A query já vai completa na navegação, para a entrada do histórico nascer com o endereço certo.
      router.push(`${path}${buildQuery({ ...state, ...partial }, allData.schedule.days, path)}${hash}`);
    },
    [pathname, router, state, allData.schedule.days],
  );

  const value = useMemo(
    () => ({ data, city, map, state, view, patch, go, setCity, resetFilters, scrollToSection }),
    [data, city, map, state, view, go, setCity, resetFilters, scrollToSection],
  );

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
}

export function useExplorer(): ExplorerContextValue {
  const ctx = useContext(ExplorerContext);
  if (!ctx) throw new Error("useExplorer deve ser usado dentro de <ExplorerProvider>");
  return ctx;
}
