"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BellRing,
  ExternalLink,
  FileCheck2,
  Hourglass,
  Inbox,
  Timer,
  Zap,
} from "lucide-react";
import { QUOTE_STATUSES, SERVICE_LABELS } from "@beltrans/shared";
import { BarList, Skeleton, StatTile, WeeklyChart } from "@/components/admin/charts";
import { usePendingCount, usePrefetchQuote } from "@/components/admin/hooks";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin/api";
import { formatDateTime, formatDuration, formatPercent, isoDaysAgo } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

const PERIODS = [
  { key: "30", label: "30 jours", days: 30 },
  { key: "90", label: "3 mois", days: 90 },
  { key: "365", label: "12 mois", days: 365 },
] as const;

function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const id = `panel-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "min-w-0 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgb(4_16_43/0.04)] sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={id} className="font-semibold text-ink">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 18 ? "Bonjour" : "Bonsoir";
}

/** Dernières demandes reçues (toutes périodes) : triage en un clic. */
function LatestQuotes() {
  const prefetch = usePrefetchQuote();
  const latest = useQuery({
    queryKey: ["admin", "quotes", { page: 1, pageSize: 5 }],
    queryFn: () => adminApi.quotes({ page: 1, pageSize: 5 }),
  });

  if (latest.isPending) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }
  if (latest.isError || latest.data.items.length === 0) {
    return <p className="text-sm text-muted">Aucune demande pour le moment.</p>;
  }
  return (
    <ul className="-mx-2 divide-y divide-line">
      {latest.data.items.map((q) => (
        <li key={q.id}>
          <Link
            href={`/admin/devis/${q.id}`}
            onMouseEnter={() => prefetch(q.id)}
            onFocus={() => prefetch(q.id)}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                {q.anonymizedAt ? "Données anonymisées" : `${q.firstName} ${q.lastName}`}
                {q.isUrgent && (
                  <Zap className="size-3.5 shrink-0 text-gold-deep" aria-label="Urgent" />
                )}
              </p>
              <p className="truncate text-xs text-muted">
                <span className="font-mono">{q.reference}</span> ·{" "}
                {SERVICE_LABELS[q.serviceType as keyof typeof SERVICE_LABELS]} ·{" "}
                {formatDateTime(q.createdAt)}
              </p>
            </div>
            <StatusBadge status={q.status} className="shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("90");
  const current = PERIODS.find((p) => p.key === period)!;
  const range = { from: isoDaysAgo(current.days), to: isoDaysAgo(0) };
  const pending = usePendingCount();

  const stats = useQuery({
    queryKey: ["admin", "stats", range],
    queryFn: () => adminApi.stats(range),
    placeholderData: (previous) => previous, // pas de clignotement au changement de période
  });

  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted first-letter:uppercase">{today}</p>
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">{greeting()}</h1>
        </div>
        <div
          role="group"
          aria-label="Période"
          className="flex rounded-xl border border-line bg-white p-1 shadow-sm"
        >
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                period === p.key ? "bg-ink text-white" : "text-muted hover:text-ink",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── À traiter ── */}
      {pending.data ? (
        <Link
          href="/admin/devis?status=PENDING"
          className="on-dark group flex items-center gap-4 rounded-2xl bg-ink p-4 text-white shadow-lg shadow-ink/10 sm:p-5"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold text-ink">
            <BellRing className="size-5" aria-hidden="true" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">
              {pending.data} nouvelle{pending.data > 1 ? "s demandes" : " demande"} à traiter
            </span>
            <span className="text-sm text-white/65">
              Répondez rapidement pour maximiser vos chances de conclure.
            </span>
          </span>
          <span className="hidden items-center gap-1 text-sm font-semibold text-gold sm:flex">
            Traiter{" "}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </Link>
      ) : null}

      {/* ── Indicateurs ── */}
      {stats.isPending ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : stats.isError ? (
        <div role="alert" className="rounded-2xl bg-white p-6 text-center">
          <p className="mb-3 font-medium text-danger">{stats.error.message}</p>
          <Button onClick={() => stats.refetch()}>Réessayer</Button>
        </div>
      ) : (
        <div className={cn("space-y-6 transition-opacity", stats.isFetching && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatTile
              icon={Inbox}
              tone="ink"
              label="Demandes reçues"
              value={stats.data.total.toLocaleString("fr-FR")}
              hint={
                stats.data.urgent
                  ? `dont ${stats.data.urgent} urgente${stats.data.urgent > 1 ? "s" : ""}`
                  : `sur ${current.label}`
              }
            />
            <StatTile
              icon={FileCheck2}
              tone="success"
              label="Devis envoyés"
              value={formatPercent(stats.data.quotedRate)}
              hint={
                stats.data.total
                  ? `${stats.data.byStatus.QUOTED} sur ${stats.data.total} demandes`
                  : "aucune demande"
              }
            />
            <StatTile
              icon={Hourglass}
              tone="gold"
              label="Prise en charge"
              value={formatDuration(stats.data.avgReviewHours)}
              hint={stats.data.avgReviewHours === null ? "pas encore de donnée" : "délai moyen"}
            />
            <StatTile
              icon={Timer}
              tone="brand"
              label="Envoi du devis"
              value={formatDuration(stats.data.avgQuoteHours)}
              hint={stats.data.avgQuoteHours === null ? "pas encore de donnée" : "délai moyen"}
            />
          </div>

          {stats.data.total === 0 ? (
            /* ── État vide : explique quoi faire plutôt que des graphiques à zéro ── */
            <section className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-ink text-gold">
                <Inbox className="size-7" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-serif text-2xl text-ink">
                Aucune demande sur {current.label}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Les demandes envoyées depuis le formulaire du site apparaîtront ici, avec leurs
                indicateurs de suivi. Vous serez aussi prévenu par e-mail à chaque nouvelle demande.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <Button asChild variant="gold">
                  <a href="/devis" target="_blank" rel="noopener">
                    <ExternalLink aria-hidden="true" /> Tester le formulaire de devis
                  </a>
                </Button>
                {period !== "365" && (
                  <Button variant="outline" onClick={() => setPeriod("365")}>
                    Voir les 12 derniers mois
                  </Button>
                )}
              </div>
            </section>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                <Panel title="Demandes par semaine">
                  <WeeklyChart data={stats.data.weekly} />
                </Panel>
                <Panel
                  title="Dernières demandes"
                  action={
                    <Link
                      href="/admin/devis"
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      Tout voir
                    </Link>
                  }
                >
                  <LatestQuotes />
                </Panel>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Par statut">
                  <BarList
                    items={QUOTE_STATUSES.map((status) => ({
                      key: status,
                      label: (
                        <Link href={`/admin/devis?status=${status}`} className="hover:opacity-80">
                          <StatusBadge status={status} />
                        </Link>
                      ),
                      value: stats.data.byStatus[status],
                    }))}
                  />
                </Panel>
                <Panel title="Par service">
                  <BarList
                    items={Object.entries(stats.data.byService)
                      .sort(([, a], [, b]) => b - a)
                      .map(([service, value]) => ({
                        key: service,
                        label: SERVICE_LABELS[service as keyof typeof SERVICE_LABELS] ?? service,
                        value,
                      }))}
                  />
                </Panel>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
