/** Chave para casar o mesmo filme entre cinemas: minúsculo, sem acentos nem pontuação. */
export function titleKey(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "Nov" / "novembro" / "Set." → "11" / "09". Devolve null se não reconhecer. */
export function monthNumber(name: string): string | null {
  const i = MONTHS_PT.indexOf(
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .slice(0, 3),
  );
  return i < 0 ? null : String(i + 1).padStart(2, "0");
}

/** Títulos digitados todo em minúsculas ou maiúsculas ("feito pipa") viram "Feito Pipa"; os demais ficam como estão. */
export function prettyTitle(title: string): string {
  const t = title.replace(/\s+/g, " ").trim();
  if (t !== t.toLowerCase() && t !== t.toUpperCase()) return t;
  const small = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "em", "na", "no"]);
  return t
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Datas ISO de `from` a `to` (inclusive), ambas `yyyy-mm-dd`. */
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  for (let i = 0; d <= end && i < 62; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** Resolve uma URL (possivelmente relativa) contra a página de origem. Só aceita http(s). */
export function absoluteUrl(src: string | undefined, base: string): string | undefined {
  if (!src?.trim()) return undefined;
  try {
    const u = new URL(src.trim(), base);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** "14h30" / "14:30" / "14h" → "14:30". Devolve null se não for um horário. */
export function parseTime(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})\s*(?:h|:)\s*(\d{2})?$/i);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? "0");
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** "1h 41min" / "93min" → minutos. */
export function parseMinutes(raw: string): number | undefined {
  const h = raw.match(/(\d+)\s*h/i);
  const m = raw.match(/(\d+)\s*min/i);
  if (!h && !m) return undefined;
  return Number(h?.[1] ?? 0) * 60 + Number(m?.[1] ?? 0);
}

/** "14 anos" / "Livre" / "L" / "14" → "14" | "L" | undefined. */
export function parseRating(raw: string): string | undefined {
  const t = raw.trim().toLowerCase();
  if (!t) return undefined;
  if (t === "l" || t.startsWith("livre")) return "L";
  const n = t.match(/\d+/)?.[0];
  return n && ["10", "12", "14", "16", "18"].includes(n) ? n : undefined;
}

/** Resolve "dd/mm" para uma data ISO usando o ano de `today`, virando o ano se necessário. */
export function resolveDayMonth(dd: string, mm: string, today: string): string {
  const [y, tm] = today.split("-").map(Number);
  let year = y;
  // Se o mês lido está muito antes do mês atual (ex.: hoje é dezembro e lemos "02/01"), é do ano seguinte.
  if (Number(mm) < tm - 6) year += 1;
  return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}
