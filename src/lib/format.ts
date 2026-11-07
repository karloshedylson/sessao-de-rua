export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 100) * 10} m` : `${km.toFixed(1).replace(".", ",")} km`;
}

export function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Remove acentos e caixa, para buscas tolerantes. */
export function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

const WORDS = ["zero", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze"];

/** Número por extenso (0–12, feminino, para "salas"); acima disso devolve os dígitos. */
export function spellNumber(n: number): string {
  if (n === 9 || n > 12 || n < 0) return n === 9 ? "nove" : String(n);
  return WORDS[n];
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
