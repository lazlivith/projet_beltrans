const TZ = "Africa/Brazzaville"; // heure de Pointe-Noire

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** Délai lisible : « 45 min », « 5 h », « 2,5 j ». */
export function formatDuration(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${(hours / 24).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} j`;
}

export function formatPercent(ratio: number | null) {
  if (ratio === null) return "—";
  return ratio.toLocaleString("fr-FR", { style: "percent", maximumFractionDigits: 0 });
}

/** Date locale AAAA-MM-JJ décalée de `days` jours (pour les filtres de période). */
export function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
