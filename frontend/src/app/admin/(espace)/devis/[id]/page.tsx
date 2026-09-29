"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  ShieldOff,
  Zap,
} from "lucide-react";
import {
  OPERATION_LABELS,
  QUOTE_STATUSES,
  SERVICE_LABELS,
  STATUS_LABELS,
  whatsappLink,
  type AdminQuoteDetail,
  type AdminQuotePatch,
} from "@beltrans/shared";
import { Skeleton } from "@/components/admin/charts";
import { ReplyCard } from "@/components/admin/reply-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-controls";
import { adminApi } from "@/lib/admin/api";
import { formatDateTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

function InfoList({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-line text-sm">
      {rows
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([label, value]) => (
          <div key={label} className="grid grid-cols-[9rem_1fr] gap-3 py-2">
            <dt className="text-muted">{label}</dt>
            <dd className="break-words whitespace-pre-line text-ink">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white p-4 sm:p-5", className)}>
      <h2 className="mb-3 font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Notes internes enregistrées automatiquement (1 s après la dernière frappe, ou en quittant
 * le champ). Monté une seule fois par devis : la saisie en cours n'est jamais écrasée.
 */
function NotesEditor({
  quoteId,
  initial,
  disabled,
}: {
  quoteId: string;
  initial: string | null;
  disabled: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [notes, setNotes] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const dirty = notes !== saved;

  const save = useMutation({
    mutationFn: (value: string) => adminApi.updateQuote(quoteId, { internalNotes: value }),
    onSuccess: (updated, value) => {
      setSaved(value);
      queryClient.setQueryData(["admin", "quote", quoteId], updated);
    },
    onError: () => toast("La note n'a pas pu être enregistrée. Réessayez.", "error"),
  });
  const { mutate, isPending } = save;

  useEffect(() => {
    if (!dirty || isPending) return;
    const timer = setTimeout(() => mutate(notes), 1000);
    return () => clearTimeout(timer);
  }, [notes, dirty, isPending, mutate]);

  // Évite de perdre une note non enregistrée en fermant l'onglet
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const status = isPending
    ? "Enregistrement…"
    : dirty
      ? "Saisie en cours…"
      : saved
        ? "Enregistré"
        : "Enregistrement automatique";

  return (
    <div>
      <label htmlFor="internal-notes" className="sr-only">
        Notes internes
      </label>
      <Textarea
        id="internal-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => dirty && !isPending && mutate(notes)}
        placeholder="Montant proposé, échanges avec le client, prochaines étapes…"
        className="min-h-32 text-sm"
        maxLength={10_000}
        disabled={disabled}
      />
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : !dirty && saved ? (
          <Check className="size-3.5 text-success" aria-hidden="true" />
        ) : null}
        {status}
      </p>
    </div>
  );
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const quote = useQuery({ queryKey: ["admin", "quote", id], queryFn: () => adminApi.quote(id) });

  const toast = useToast();
  const quoteKey = ["admin", "quote", id];

  const update = useMutation({
    mutationFn: (patch: AdminQuotePatch) => adminApi.updateQuote(id, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: quoteKey });
      const previous = queryClient.getQueryData<AdminQuoteDetail>(quoteKey);
      if (previous && patch.status)
        queryClient.setQueryData(quoteKey, { ...previous, status: patch.status });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(quoteKey, context.previous);
      toast("Le statut n'a pas pu être modifié. Réessayez.", "error");
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(quoteKey, updated);
      toast(`Statut : ${STATUS_LABELS[updated.status]}`);
    },
    onSettled: () => {
      // La liste, la pastille et les indicateurs dépendent du statut : on les rafraîchit
      void queryClient.invalidateQueries({ queryKey: ["admin", "quotes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  if (quote.isPending) {
    return (
      <div className="space-y-5" role="status">
        <span className="sr-only">Chargement du devis…</span>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (quote.isError) {
    return (
      <div role="alert" className="space-y-4 rounded-2xl bg-white p-6 text-center">
        <p className="font-medium text-danger">{quote.error.message}</p>
        <Button asChild variant="outline">
          <Link href="/admin/devis">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const q = quote.data;
  const anonymized = Boolean(q.anonymizedAt);
  const fullName = `${q.firstName} ${q.lastName}`.trim();
  const clientWhatsapp = q.whatsapp ?? q.phone;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/devis"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Toutes les demandes
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {q.reference}
            </h1>
            <StatusBadge status={q.status} />
            {q.isUrgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-pale/40 px-2 py-0.5 text-xs font-semibold text-gold-deep">
                <Zap className="size-3.5" aria-hidden="true" /> Urgent
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            Reçue le {formatDateTime(q.createdAt)} ·{" "}
            {SERVICE_LABELS[q.serviceType as keyof typeof SERVICE_LABELS]} ·{" "}
            {OPERATION_LABELS[q.operationType as keyof typeof OPERATION_LABELS]}
          </p>
        </div>
        {!anonymized && (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a
                href={`mailto:${q.email}?subject=${encodeURIComponent(`Votre devis ${q.reference} — BELTRANS`)}`}
              >
                <Mail aria-hidden="true" /> E-mail
              </a>
            </Button>
            <Button asChild size="sm" variant="whatsapp">
              <a
                href={whatsappLink(
                  `Bonjour ${q.firstName}, BELTRANS vous contacte au sujet de votre demande ${q.reference}.`,
                  clientWhatsapp,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle aria-hidden="true" /> WhatsApp
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={`tel:${q.phone}`}>
                <Phone aria-hidden="true" /> Appeler
              </a>
            </Button>
          </div>
        )}
      </div>

      {anonymized && (
        <p className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 text-sm text-muted">
          <ShieldOff className="size-4 shrink-0" aria-hidden="true" />
          Données personnelles anonymisées le {formatDateTime(q.anonymizedAt)} (conservation limitée
          à 3 ans).
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card title="Client">
            <InfoList
              rows={[
                ["Nom", anonymized ? "—" : fullName],
                ["Société", q.companyName],
                [
                  "E-mail",
                  q.email && (
                    <a href={`mailto:${q.email}`} className="text-brand hover:underline">
                      {q.email}
                    </a>
                  ),
                ],
                [
                  "Téléphone",
                  q.phone && (
                    <a href={`tel:${q.phone}`} className="text-brand hover:underline">
                      {q.phone}
                    </a>
                  ),
                ],
                ["WhatsApp", q.whatsapp],
              ]}
            />
          </Card>
          <Card title="Expédition">
            <InfoList
              rows={[
                ["Origine", `${q.originCity}, ${q.originCountry}`],
                ["Destination", `${q.destCity}, ${q.destCountry}`],
                [
                  "Date souhaitée",
                  q.targetDate
                    ? formatDateTime(q.targetDate).split(" ").slice(0, 3).join(" ")
                    : null,
                ],
                ["Marchandise", q.cargoNature],
                ["Description", q.cargoDescription],
                ["Poids", q.weightKg !== null ? `${q.weightKg.toLocaleString("fr-FR")} kg` : null],
                [
                  "Volume",
                  q.volumeCbm !== null ? `${q.volumeCbm.toLocaleString("fr-FR")} m³` : null,
                ],
                ["Colis", q.packageCount],
                ["N° conteneur", q.containerNumber],
                ["Message du client", q.additionalNotes],
              ]}
            />
          </Card>
        </div>

        <div className="space-y-4">
          {!anonymized && (
            <ReplyCard
              quote={q}
              marking={update.isPending}
              onMarkQuoted={() => update.mutate({ status: "QUOTED" })}
            />
          )}

          <Card title="Statut">
            <div role="radiogroup" aria-label="Statut du devis" className="grid gap-1.5">
              {QUOTE_STATUSES.map((status) => {
                const selected = q.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={update.isPending}
                    onClick={() => !selected && update.mutate({ status })}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:opacity-60",
                      selected
                        ? "border-brand bg-brand/5 font-semibold text-brand"
                        : "border-line hover:border-brand/40",
                    )}
                  >
                    {STATUS_LABELS[status]}
                    {selected && <Check className="size-4" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {update.isError && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {update.error.message}
              </p>
            )}
          </Card>

          <Card title="Notes internes">
            <NotesEditor
              key={q.id}
              quoteId={q.id}
              initial={q.internalNotes}
              disabled={Boolean(q.anonymizedAt)}
            />
          </Card>

          <Card title="Historique">
            <ol className="space-y-2 text-sm">
              {[
                ["Demande reçue", q.createdAt],
                ["Prise en charge", q.reviewedAt],
                ["Devis envoyé", q.quotedAt],
                ["Dernière modification", q.updatedAt],
              ].map(([label, date]) => (
                <li key={label} className="flex justify-between gap-3">
                  <span className="text-muted">{label}</span>
                  <span className={date ? "text-ink" : "text-muted/60"}>
                    {formatDateTime(date)}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              Consentement recueilli le {formatDateTime(q.consentAt)}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
