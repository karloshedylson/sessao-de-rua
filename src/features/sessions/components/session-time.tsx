import { useExplorer } from "@/features/explorer/components/explorer-provider";
import type { Cinema, Film } from "@/types";
import { findSessionLink, sessionTarget, targetLabel } from "../lib/labels";

type Props = { cinema: Cinema; film: Film; time: string; past: boolean };

/**
 * Horário de uma sessão. Leva ao link mais específico que o cinema oferece (sessão > filme > site do cinema),
 * em nova aba. Sessões já iniciadas ficam desativadas.
 */
export function SessionTime({ cinema, film, time, past }: Props) {
  const { data, state } = useExplorer();
  if (past) {
    return (
      <span
        className="stub past"
        aria-disabled="true"
        aria-label={`Sessão já iniciada: ${film.title}, ${cinema.short}, ${time}`}
      >
        {time}
      </span>
    );
  }
  const { href, level } = sessionTarget(cinema, findSessionLink(data, state.day, cinema.id, film.id, time));
  return (
    <a
      className="stub"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${film.title}, ${cinema.short}, ${time}. ${targetLabel(level)}`}
    >
      {time}
    </a>
  );
}
