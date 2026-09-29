"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { formatDay } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

const TILE_TONES = {
  brand: "bg-brand/8 text-brand",
  gold: "bg-gold-pale/40 text-gold-deep",
  success: "bg-success/10 text-success",
  ink: "bg-ink text-gold",
} as const;

/** Indicateur clé : icône · libellé · valeur · précision (sans couleur sur le texte). */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof TILE_TONES;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgb(4_16_43/0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-tight text-muted">{label}</p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9",
            TILE_TONES[tone],
          )}
        >
          <Icon className="size-4 sm:size-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs leading-snug text-muted">{hint}</p>}
    </div>
  );
}

/** Bloc de chargement (squelette) — la mise en page ne saute pas à l'arrivée des données. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-line/70", className)} aria-hidden="true" />
  );
}

function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

/**
 * Demandes par semaine — une seule série (pas de légende : le titre la nomme).
 * Colonnes ≤ 24 px, extrémité arrondie de 4 px, 2 px d'espace, infobulle au survol,
 * et tableau des valeurs pour les lecteurs d'écran.
 */
export function WeeklyChart({ data }: { data: { week: string; count: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">Aucune demande sur la période.</p>;
  }

  const max = niceMax(Math.max(...data.map((d) => d.count)));
  const peak = data.reduce((best, d, i) => (d.count > (data[best]?.count ?? 0) ? i : best), 0);
  const labelEvery = Math.ceil(data.length / 8); // ≤ 8 étiquettes d'axe, sans chevauchement

  return (
    <figure className="min-w-0">
      <div className="relative" aria-hidden="true">
        {/* Grille discrète : ligne de base + maximum */}
        <div className="absolute inset-x-8 top-0 border-t border-line" />
        <span className="absolute top-0 left-0 -translate-y-1/2 text-[11px] text-muted tabular-nums">
          {max}
        </span>
        <span className="absolute bottom-6 left-0 translate-y-1/2 text-[11px] text-muted tabular-nums">
          0
        </span>

        <div className="ml-8 flex h-44 items-end gap-0.5 border-b border-line">
          {data.map((d, i) => (
            <div
              key={d.week}
              className="relative flex h-full min-w-0 flex-1 items-end justify-center"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Zone de survol = toute la hauteur de la colonne */}
              <div
                className={cn(
                  "w-full max-w-6 rounded-t bg-chart transition-opacity",
                  hovered !== null && hovered !== i && "opacity-40",
                )}
                style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 2 : 0 }}
              />
              {i === peak && d.count > 0 && hovered === null && (
                <span
                  className="absolute text-[11px] font-semibold text-ink tabular-nums"
                  style={{ bottom: `calc(${(d.count / max) * 100}% + 4px)` }}
                >
                  {d.count}
                </span>
              )}
              {hovered === i && (
                <div
                  className="pointer-events-none absolute z-10 rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg"
                  style={{ bottom: `calc(${(d.count / max) * 100}% + 8px)` }}
                >
                  <span className="block text-white/70">Semaine du {formatDay(d.week)}</span>
                  <span className="font-semibold">
                    {d.count} demande{d.count > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-1.5 ml-8 flex gap-0.5">
          {data.map((d, i) => (
            <span
              key={d.week}
              className="flex min-w-0 flex-1 justify-center text-[11px] whitespace-nowrap text-muted"
            >
              {i % labelEvery === 0 ? formatDay(d.week) : ""}
            </span>
          ))}
        </div>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink">Voir les données</summary>
        <table className="mt-2 w-full max-w-xs text-left">
          <caption className="sr-only">Nombre de demandes de devis par semaine</caption>
          <thead>
            <tr className="text-muted">
              <th scope="col" className="py-1 font-medium">
                Semaine du
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                Demandes
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.week} className="border-t border-line">
                <td className="py-1">{formatDay(d.week)}</td>
                <td className="py-1 text-right tabular-nums">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Comparaison de volumes par catégorie : barres horizontales, valeur en bout de barre. */
export function BarList({
  items,
}: {
  items: { label: React.ReactNode; key: string; value: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="text-ink">{item.label}</span>
            <span className="font-semibold text-ink tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-chart transition-[width] duration-500"
              style={{ width: `${(item.value / max) * 100}%`, minWidth: item.value ? 4 : 0 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
