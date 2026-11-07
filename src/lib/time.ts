/** "19:15" → minutos desde 00:00. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

/** Data ISO (`yyyy-mm-dd`) → Date ao meio-dia local, estável entre servidor e cliente. */
export function isoToDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/** Data de hoje (`yyyy-mm-dd`) no fuso de São Paulo. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

export function addDaysIso(iso: string, days: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
