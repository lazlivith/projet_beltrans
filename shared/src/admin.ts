import { z } from "zod";
import { SERVICE_LABELS } from "./labels";

/** Cycle de vie d'un devis (enum SQL QuoteStatus). */
export const QUOTE_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "QUOTED",
  "REJECTED",
  "ARCHIVED",
] as const;
export type QuoteStatusValue = (typeof QUOTE_STATUSES)[number];

export const STATUS_LABELS: Record<QuoteStatusValue, string> = {
  PENDING: "Nouveau",
  UNDER_REVIEW: "En cours d'étude",
  QUOTED: "Devis envoyé",
  REJECTED: "Refusé",
  ARCHIVED: "Archivé",
};

/** Tous les types de service stockés (y compris valeurs historiques). */
export const ALL_SERVICE_TYPES = Object.keys(SERVICE_LABELS) as (keyof typeof SERVICE_LABELS)[];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ")
  .optional();

/** Filtres de la liste des devis (query string). */
export const adminQuoteListQuerySchema = z.object({
  status: z.enum(QUOTE_STATUSES).optional(),
  service: z.enum(ALL_SERVICE_TYPES as [string, ...string[]]).optional(),
  from: isoDate,
  to: isoDate,
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminQuoteListQuery = z.input<typeof adminQuoteListQuerySchema>;

/** Période du tableau de bord. */
export const adminStatsQuerySchema = z.object({ from: isoDate, to: isoDate });

/** Mise à jour d'un devis depuis sa fiche. */
export const adminQuotePatchSchema = z
  .object({
    status: z.enum(QUOTE_STATUSES).optional(),
    internalNotes: z.string().max(10_000).nullable().optional(),
  })
  .refine((v) => v.status !== undefined || v.internalNotes !== undefined, {
    message: "Aucune modification transmise",
  });
export type AdminQuotePatch = z.infer<typeof adminQuotePatchSchema>;

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis").max(200),
});
export type AdminLogin = z.infer<typeof adminLoginSchema>;

// ── Contrats de réponse de l'API admin (dates sérialisées en ISO) ──

export type AdminQuoteListItem = {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string;
  serviceType: string;
  operationType: string;
  originCountry: string;
  destCountry: string;
  isUrgent: boolean;
  status: QuoteStatusValue;
  createdAt: string;
  anonymizedAt: string | null;
};

export type AdminQuoteDetail = AdminQuoteListItem & {
  phone: string;
  whatsapp: string | null;
  originCity: string;
  destCity: string;
  cargoNature: string;
  cargoDescription: string | null;
  weightKg: number | null;
  volumeCbm: number | null;
  packageCount: number | null;
  containerNumber: string | null;
  targetDate: string | null;
  additionalNotes: string | null;
  internalNotes: string | null;
  consentAt: string;
  reviewedAt: string | null;
  quotedAt: string | null;
  updatedAt: string;
};

export type AdminQuoteListResponse = {
  items: AdminQuoteListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminStats = {
  total: number;
  urgent: number;
  byStatus: Record<QuoteStatusValue, number>;
  byService: Record<string, number>;
  /** Part des demandes ayant reçu un devis (0–1), null si aucune demande. */
  quotedRate: number | null;
  /** Délai moyen demande → prise en charge, en heures. */
  avgReviewHours: number | null;
  /** Délai moyen demande → devis envoyé, en heures. */
  avgQuoteHours: number | null;
  /** Demandes par semaine (lundi ISO AAAA-MM-JJ). */
  weekly: { week: string; count: number }[];
};

export type AdminMe = { email: string };
