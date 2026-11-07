"use client";

import { useExplorer } from "@/features/explorer/components/explorer-provider";
import { pad2 } from "@/lib/format";
import { isoToDate } from "@/lib/time";

/** Barra fixa de escolha do dia. */
export function DayBar() {
  const { data, state, patch } = useExplorer();

  return (
    <div className="daybar">
      <div className="wrap daybar-in">
        <span className="daybar-lbl">Quando?</span>
        <div className="days" role="group" aria-label="Escolha o dia">
          {data.schedule.days.map((iso, i) => {
            const d = isoToDate(iso);
            const on = i === state.day;
            const weekday =
              i === 0
                ? "Hoje"
                : i === 1
                  ? "Amanhã"
                  : d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
            return (
              <button
                key={iso}
                type="button"
                className={`day${on ? " on" : ""}`}
                aria-pressed={on}
                aria-label={d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                onClick={() => patch({ day: i })}
              >
                <span className="d-w">{weekday}</span>
                <span className="d-n">{pad2(d.getDate())}</span>
                <span className="d-m">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
