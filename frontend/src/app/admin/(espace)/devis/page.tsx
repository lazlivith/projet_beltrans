"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Inbox, Search, X, Zap } from "lucide-react";
import {
  adminQuoteListQuerySchema,
  OPERATION_LABELS,
  QUOTE_STATUSES,
  SERVICE_LABELS,
  SERVICE_TYPES,
  STATUS_LABELS,
  type AdminQuoteListQuery,
} from "@beltrans/shared";
import { Skeleton } from "@/components/admin/charts";
import { usePendingCount, usePrefetchQuote } from "@/components/admin/hooks";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-controls";
import { adminApi } from "@/lib/admin/api";
import { formatDateTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

/** Les filtres vivent dans l'URL (partageables, conservés au retour arrière). */
function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = Object.fromEntries(searchParams.entries());
  const parsed = adminQuoteListQuerySchema.safeParse(raw);
  const filters: AdminQuoteListQuery = parsed.success ? parsed.data : { page: 1 };

  const update = (
    patch: Partial<Record<keyof AdminQuoteListQuery, string | number | undefined>>,
  ) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    if (!("page" in patch)) next.delete("page"); // nouveau filtre → retour page 1
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  return {
    filters,
    update,
    hasFilters: searchParams.size > 0 && !(searchParams.size === 1 && searchParams.has("page")),
  };
}

function QuoteList() {
  const { filters, update, hasFilters } = useFilters();
  const [search, setSearch] = useState(filters.q ?? "");
  const searchRef = useRef<HTMLInputElement>(null);
  const prefetch = usePrefetchQuote();
  const pending = usePendingCount();

  // Raccourci clavier « / » : accès direct à la recherche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Recherche différée (300 ms) : pas une requête par frappe
  useEffect(() => {
    if ((filters.q ?? "") === search.trim()) return;
    const timer = setTimeout(() => update({ q: search.trim() || undefined }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const query = { ...filters, pageSize: PAGE_SIZE };
  const quotes = useQuery({
    queryKey: ["admin", "quotes", query],
    queryFn: () => adminApi.quotes(query),
    placeholderData: keepPreviousData,
  });

  const page = filters.page ?? 1;
  const totalPages = quotes.data ? Math.max(1, Math.ceil(quotes.data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-ink">Demandes de devis</h1>
          <p className="mt-0.5 text-sm text-muted" aria-live="polite">
            {quotes.data ? `${quotes.data.total} demande${quotes.data.total > 1 ? "s" : ""}` : " "}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={adminApi.exportUrl(filters)} download>
            <Download aria-hidden="true" /> Exporter (Excel)
          </a>
        </Button>
      </div>

      {/* ── Onglets de statut ── */}
      <div
        role="group"
        aria-label="Filtrer par statut"
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {[undefined, ...QUOTE_STATUSES].map((status) => {
          const active = (filters.status ?? undefined) === status;
          return (
            <button
              key={status ?? "all"}
              type="button"
              aria-pressed={active}
              onClick={() => update({ status })}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-muted hover:border-ink/30 hover:text-ink",
              )}
            >
              {status ? STATUS_LABELS[status] : "Toutes"}
              {status === "PENDING" && pending.data ? (
                <span className="rounded-full bg-gold px-1.5 text-[11px] leading-5 font-bold text-ink">
                  {pending.data}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── Filtres ── */}
      <div className="grid gap-2 rounded-2xl border border-line bg-white p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto_auto_auto] lg:items-center">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Rechercher</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Référence, nom, société, e-mail, téléphone…"
            className="h-10 pr-9 pl-9"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[11px] text-muted sm:block">
            /
          </kbd>
        </label>
        <label>
          <span className="sr-only">Service</span>
          <Select
            className="h-10"
            value={filters.service ?? ""}
            onChange={(e) => update({ service: e.target.value })}
          >
            <option value="">Tous les services</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {SERVICE_LABELS[s]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Du
          <Input
            type="date"
            className="h-10"
            value={filters.from ?? ""}
            onChange={(e) => update({ from: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          au
          <Input
            type="date"
            className="h-10"
            value={filters.to ?? ""}
            onChange={(e) => update({ to: e.target.value })}
          />
        </label>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              update({
                q: undefined,
                status: undefined,
                service: undefined,
                from: undefined,
                to: undefined,
              });
            }}
          >
            <X aria-hidden="true" /> Effacer
          </Button>
        )}
      </div>

      {/* ── Résultats ── */}
      {quotes.isPending ? (
        <div className="space-y-2 rounded-2xl border border-line bg-white p-4" role="status">
          <span className="sr-only">Chargement…</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : quotes.isError ? (
        <p role="alert" className="rounded-2xl bg-white p-6 text-center font-medium text-danger">
          {quotes.error.message}
        </p>
      ) : quotes.data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <Inbox className="mx-auto size-8 text-muted" aria-hidden="true" />
          <p className="mt-3 font-medium text-ink">Aucune demande ne correspond à ces critères.</p>
          {hasFilters && (
            <p className="mt-1 text-sm text-muted">
              Essayez d&apos;élargir la recherche ou d&apos;effacer les filtres.
            </p>
          )}
        </div>
      ) : (
        <div className={quotes.isFetching ? "opacity-70 transition-opacity" : "transition-opacity"}>
          {/* Tableau (tablette / desktop) */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgb(4_16_43/0.04)] md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-surface/70 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Référence
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Service
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Reçue le
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotes.data.items.map((q) => (
                  <tr
                    key={q.id}
                    onMouseEnter={() => prefetch(q.id)}
                    onFocus={() => prefetch(q.id)}
                    className={cn(
                      "relative border-t border-line transition-colors first:border-t-0 focus-within:bg-brand/[0.03] hover:bg-brand/[0.03]",
                      q.status === "PENDING" && "bg-gold-pale/10",
                    )}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/devis/${q.id}`}
                        className="font-mono font-semibold text-brand after:absolute after:inset-0 hover:underline"
                      >
                        {q.reference}
                      </Link>
                      {q.isUrgent && (
                        <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-gold-pale/50 px-1.5 py-0.5 text-[11px] font-semibold text-gold-deep">
                          <Zap className="size-3" aria-hidden="true" /> Urgent
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium text-ink">
                        {q.anonymizedAt ? "Données anonymisées" : `${q.firstName} ${q.lastName}`}
                      </span>
                      {q.companyName && <span className="text-muted">{q.companyName}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {SERVICE_LABELS[q.serviceType as keyof typeof SERVICE_LABELS]} ·{" "}
                      {OPERATION_LABELS[q.operationType as keyof typeof OPERATION_LABELS]}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {formatDateTime(q.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartes (mobile) */}
          <ul className="space-y-2 md:hidden">
            {quotes.data.items.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/admin/devis/${q.id}`}
                  onTouchStart={() => prefetch(q.id)}
                  className={cn(
                    "block rounded-2xl border bg-white p-4 active:bg-surface",
                    q.status === "PENDING" ? "border-gold/40" : "border-line",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-brand">
                      {q.reference}
                    </span>
                    <StatusBadge status={q.status} />
                  </div>
                  <p className="mt-2 font-medium text-ink">
                    {q.anonymizedAt ? "Données anonymisées" : `${q.firstName} ${q.lastName}`}
                    {q.isUrgent && (
                      <Zap className="ml-1 inline size-3.5 text-gold-deep" aria-label="Urgent" />
                    )}
                  </p>
                  <p className="text-sm text-muted">
                    {SERVICE_LABELS[q.serviceType as keyof typeof SERVICE_LABELS]} ·{" "}
                    {formatDateTime(q.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-4 flex items-center justify-between gap-3 text-sm"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => update({ page: page - 1 })}
              >
                <ChevronLeft aria-hidden="true" /> Précédent
              </Button>
              <span className="text-muted">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => update({ page: page + 1 })}
              >
                Suivant <ChevronRight aria-hidden="true" />
              </Button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuotesPage() {
  return (
    <Suspense>
      <QuoteList />
    </Suspense>
  );
}
