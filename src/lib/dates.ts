/** Giorno YYYY-MM-DD nel fuso Europe/Bucharest (coerente con i contatori lato server). */
export function bucharestDay(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function daysBack(n: number, end: Date = new Date()): string[] {
  const out: string[] = [];
  const now = end.getTime();
  for (let i = n - 1; i >= 0; i--) out.push(bucharestDay(new Date(now - i * 86_400_000)));
  return out;
}
