/**
 * Rolagem suave com curva própria (ease-in-out quártico) e duração proporcional à distância.
 * Ao chegar, a seção de destino recebe `data-arrived`, que dispara a animação de entrada do conteúdo
 * (veja `motion.css`), e o foco vai para ela para leitores de tela. Respeita `prefers-reduced-motion`.
 */

const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);

let frame = 0;
let stopListening: (() => void) | null = null;

/** Interrompe uma rolagem em andamento (acontece também quando a pessoa rola, toca ou digita). */
export function cancelSmoothScroll() {
  cancelAnimationFrame(frame);
  stopListening?.();
  stopListening = null;
}

function targetTop(el: HTMLElement | null): number {
  if (!el) return 0;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return Math.max(0, Math.min(max, el.getBoundingClientRect().top + window.scrollY - margin));
}

/** Dispara de novo a animação de chegada (remove e recoloca o atributo, forçando um reflow). */
function markArrived(el: HTMLElement) {
  el.removeAttribute("data-arrived");
  void el.offsetWidth;
  el.setAttribute("data-arrived", "");
  window.setTimeout(() => el.removeAttribute("data-arrived"), 1600);
}

function settle(id: string, el: HTMLElement | null, updateHash: boolean) {
  if (updateHash) history.replaceState(null, "", id === "topo" ? window.location.pathname : `#${id}`);
  if (!el) return;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  markArrived(el);
}

export function smoothScrollToId(id: string, { updateHash = true }: { updateHash?: boolean } = {}) {
  const el = id === "topo" ? null : document.getElementById(id);
  if (id !== "topo" && !el) return;
  cancelSmoothScroll();

  const from = window.scrollY;
  const to = targetTop(el);
  const distance = to - from;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || Math.abs(distance) < 2) {
    window.scrollTo({ top: to, behavior: "auto" });
    settle(id, el, updateHash);
    return;
  }

  const duration = Math.min(1300, Math.max(600, 480 + Math.abs(distance) * 0.2));
  let start: number | null = null;

  const abort = () => cancelSmoothScroll();
  const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  events.forEach((e) => window.addEventListener(e, abort, { passive: true, once: true }));
  stopListening = () => events.forEach((e) => window.removeEventListener(e, abort));

  const step = (now: number) => {
    start ??= now;
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, from + distance * easeInOutQuart(t));
    if (t < 1) {
      frame = requestAnimationFrame(step);
    } else {
      stopListening?.();
      stopListening = null;
      settle(id, el, updateHash);
    }
  };
  frame = requestAnimationFrame(step);
}
