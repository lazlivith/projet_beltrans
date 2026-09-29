import type { Prisma, QuoteStatus } from "@prisma/client";
import {
  QUOTE_STATUSES,
  SERVICE_LABELS,
  STATUS_LABELS,
  type AdminQuotePatch,
  type AdminStats,
  type QuoteStatusValue,
} from "@beltrans/shared";
import { prisma } from "../lib/prisma";

/** Fuseau de Pointe-Noire (WAT, UTC+1, sans heure d'été) pour les bornes de dates. */
const TZ = "+01:00";
const HOUR = 3_600_000;

export type QuoteFilters = {
  status?: QuoteStatusValue;
  service?: string;
  from?: string;
  to?: string;
  q?: string;
};

export function buildWhere(filters: QuoteFilters): Prisma.QuoteRequestWhereInput {
  const { status, service, from, to, q } = filters;
  return {
    ...(status && { status }),
    ...(service && { serviceType: service as Prisma.EnumServiceTypeFilter["equals"] }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: new Date(`${from}T00:00:00${TZ}`) }),
        ...(to && { lte: new Date(`${to}T23:59:59.999${TZ}`) }),
      },
    }),
    ...(q && {
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q.replace(/\s/g, "") } },
      ],
    }),
  };
}

const listSelect = {
  id: true,
  reference: true,
  firstName: true,
  lastName: true,
  companyName: true,
  email: true,
  serviceType: true,
  operationType: true,
  originCountry: true,
  destCountry: true,
  isUrgent: true,
  status: true,
  createdAt: true,
  anonymizedAt: true,
} satisfies Prisma.QuoteRequestSelect;

export async function listQuotes(filters: QuoteFilters, page: number, pageSize: number) {
  const where = buildWhere(filters);
  const [items, total] = await prisma.$transaction([
    prisma.quoteRequest.findMany({
      where,
      select: listSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.quoteRequest.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export function getQuote(id: string) {
  return prisma.quoteRequest.findUnique({ where: { id } });
}

/**
 * Met à jour statut et/ou notes. Les jalons du suivi sont horodatés une seule fois :
 * - reviewedAt : première sortie du statut « Nouveau » (prise en charge) ;
 * - quotedAt : premier passage à « Devis envoyé ».
 */
export async function updateQuote(id: string, patch: AdminQuotePatch) {
  const current = await prisma.quoteRequest.findUnique({
    where: { id },
    select: { reviewedAt: true, quotedAt: true },
  });
  if (!current) return null;

  const now = new Date();
  const data: Prisma.QuoteRequestUpdateInput = {};
  if (patch.internalNotes !== undefined) data.internalNotes = patch.internalNotes || null;
  if (patch.status) {
    data.status = patch.status as QuoteStatus;
    if (patch.status !== "PENDING" && !current.reviewedAt) data.reviewedAt = now;
    if (patch.status === "QUOTED" && !current.quotedAt) data.quotedAt = now;
  }
  return prisma.quoteRequest.update({ where: { id }, data });
}

// ── Tableau de bord ──

type StatsRow = {
  status: QuoteStatusValue;
  serviceType: string;
  isUrgent: boolean;
  createdAt: Date;
  reviewedAt: Date | null;
  quotedAt: Date | null;
};

/** Lundi (AAAA-MM-JJ) de la semaine d'une date, à l'heure de Pointe-Noire. */
export function weekStart(date: Date) {
  const local = new Date(date.getTime() + HOUR); // UTC+1
  const day = (local.getUTCDay() + 6) % 7; // lundi = 0
  local.setUTCDate(local.getUTCDate() - day);
  return local.toISOString().slice(0, 10);
}

function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Calcul pur (testable sans base) des indicateurs du tableau de bord. */
export function computeStats(
  rows: StatsRow[],
  range: { from?: string; to?: string } = {},
): AdminStats {
  const byStatus = Object.fromEntries(QUOTE_STATUSES.map((s) => [s, 0])) as Record<
    QuoteStatusValue,
    number
  >;
  const byService: Record<string, number> = {};
  const weeklyMap = new Map<string, number>();

  for (const row of rows) {
    byStatus[row.status] += 1;
    byService[row.serviceType] = (byService[row.serviceType] ?? 0) + 1;
    const week = weekStart(row.createdAt);
    weeklyMap.set(week, (weeklyMap.get(week) ?? 0) + 1);
  }

  // Semaines continues (y compris sans demande) sur la période affichée
  const weeks = [...weeklyMap.keys()].sort();
  const first = range.from ? weekStart(new Date(`${range.from}T12:00:00${TZ}`)) : weeks[0];
  const last = range.to ? weekStart(new Date(`${range.to}T12:00:00${TZ}`)) : weeks.at(-1);
  const weekly: AdminStats["weekly"] = [];
  if (first && last) {
    for (
      let d = new Date(`${first}T00:00:00Z`);
      d.toISOString().slice(0, 10) <= last;
      d.setUTCDate(d.getUTCDate() + 7)
    ) {
      const week = d.toISOString().slice(0, 10);
      weekly.push({ week, count: weeklyMap.get(week) ?? 0 });
    }
  }

  const hours = (a: Date, b: Date) => (b.getTime() - a.getTime()) / HOUR;
  return {
    total: rows.length,
    urgent: rows.filter((r) => r.isUrgent).length,
    byStatus,
    byService,
    quotedRate: rows.length ? rows.filter((r) => r.quotedAt).length / rows.length : null,
    avgReviewHours: average(
      rows.filter((r) => r.reviewedAt).map((r) => hours(r.createdAt, r.reviewedAt!)),
    ),
    avgQuoteHours: average(
      rows.filter((r) => r.quotedAt).map((r) => hours(r.createdAt, r.quotedAt!)),
    ),
    weekly,
  };
}

export async function getStats(range: { from?: string; to?: string }) {
  // Volume attendu : quelques centaines de lignes par an → agrégation en mémoire suffisante
  const rows = await prisma.quoteRequest.findMany({
    where: buildWhere(range),
    select: {
      status: true,
      serviceType: true,
      isUrgent: true,
      createdAt: true,
      reviewedAt: true,
      quotedAt: true,
    },
  });
  return computeStats(rows, range);
}

// ── Export Excel ──

const EXPORT_LIMIT = 5_000;

/** Demandes complètes pour l'export (mêmes filtres que la liste), plus récentes d'abord. */
export function listQuotesForExport(filters: QuoteFilters) {
  return prisma.quoteRequest.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });
}

/** Description lisible des filtres, affichée en tête du fichier. */
export function describeFilters(filters: QuoteFilters) {
  const parts = [
    filters.status && `statut « ${STATUS_LABELS[filters.status]} »`,
    filters.service &&
      `service « ${SERVICE_LABELS[filters.service as keyof typeof SERVICE_LABELS] ?? filters.service} »`,
    filters.from && `du ${filters.from.split("-").reverse().join("/")}`,
    filters.to && `au ${filters.to.split("-").reverse().join("/")}`,
    filters.q && `recherche « ${filters.q} »`,
  ].filter(Boolean);
  return parts.length ? `Filtres : ${parts.join(", ")}` : "Toutes les demandes";
}
