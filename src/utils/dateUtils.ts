export const toLocalDateString = (d: Date): string =>
  [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n) => String(n).padStart(2, "0"))
    .join("-");

export const dateInputToIso = (dateStr: string): string =>
  new Date(`${dateStr}T12:00:00`).toISOString();
