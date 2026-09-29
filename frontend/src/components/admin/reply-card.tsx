"use client";

import { CheckCircle2, Download, Mail, MessageCircle } from "lucide-react";
import { company, whatsappLink, type AdminQuoteDetail } from "@beltrans/shared";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin/api";

function mailtoReply(q: AdminQuoteDetail) {
  const subject = `Votre devis ${q.reference} — ${company.name}`;
  const body = [
    `Bonjour ${q.firstName},`,
    "",
    `Suite à votre demande ${q.reference}, veuillez trouver ci-joint notre proposition de devis.`,
    "",
    "Nous restons à votre disposition pour toute question ou précision.",
    "",
    "Cordialement,",
    `L'équipe ${company.name}`,
    `${company.phoneDisplay} · ${company.email}`,
  ].join("\n");
  return `mailto:${q.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function whatsappReply(q: AdminQuoteDetail) {
  return whatsappLink(
    `Bonjour ${q.firstName}, suite à votre demande ${q.reference}, voici notre proposition de devis (fichier joint). ` +
      `N'hésitez pas à nous contacter pour toute question. — ${company.name}`,
    q.whatsapp ?? q.phone,
  );
}

function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-gold"
        aria-hidden="true"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 pb-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </li>
  );
}

/** Parcours guidé : modèle Excel → chiffrage → envoi e-mail / WhatsApp → statut « Devis envoyé ». */
export function ReplyCard({
  quote,
  onMarkQuoted,
  marking,
}: {
  quote: AdminQuoteDetail;
  onMarkQuoted: () => void;
  marking: boolean;
}) {
  const quoted = quote.status === "QUOTED";
  return (
    <section
      aria-labelledby="reply-title"
      className="rounded-2xl border border-gold/40 bg-linear-to-b from-gold-pale/25 to-white p-4 sm:p-5"
    >
      <h2 id="reply-title" className="mb-4 font-semibold text-ink">
        Répondre au client
      </h2>
      <ol className="space-y-4">
        <Step n={1} title="Télécharger le devis pré-rempli">
          <Button asChild size="sm" variant="gold" className="w-full">
            <a href={adminApi.quoteTemplateUrl(quote.id)} download>
              <Download aria-hidden="true" /> Devis Excel ({quote.reference})
            </a>
          </Button>
        </Step>
        <Step n={2} title="Compléter les prix dans Excel">
          <p className="text-xs leading-relaxed text-muted">
            Saisissez les prix unitaires (cellules jaunes) : montants, TVA et total se calculent
            automatiquement.
          </p>
        </Step>
        <Step n={3} title="Envoyer au client avec le fichier en pièce jointe">
          <div className="grid grid-cols-2 gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={mailtoReply(quote)}>
                <Mail aria-hidden="true" /> E-mail
              </a>
            </Button>
            <Button asChild size="sm" variant="whatsapp">
              <a href={whatsappReply(quote)} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden="true" /> WhatsApp
              </a>
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Message pré-rédigé : il reste à joindre le fichier.
          </p>
        </Step>
        <Step n={4} title={quoted ? "Devis marqué comme envoyé" : "Marquer le devis comme envoyé"}>
          {quoted ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-success">
              <CheckCircle2 className="size-4" aria-hidden="true" /> Statut « Devis envoyé »
              enregistré
            </p>
          ) : (
            <Button size="sm" className="w-full" onClick={onMarkQuoted} disabled={marking}>
              <CheckCircle2 aria-hidden="true" /> Marquer « Devis envoyé »
            </Button>
          )}
        </Step>
      </ol>
    </section>
  );
}
