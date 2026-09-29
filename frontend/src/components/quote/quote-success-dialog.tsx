"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type QuoteResult = { reference: string; whatsappUrl: string; email: string };

export function QuoteSuccessDialog({
  result,
  onClose,
}: {
  result: QuoteResult | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyReference() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible : la référence reste visible */
    }
  }

  return (
    <Dialog open={result !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="text-center">
        <CheckCircle2 className="mx-auto mb-4 size-14 text-success" aria-hidden="true" />
        <DialogTitle className="font-serif text-3xl text-ink">Demande envoyée !</DialogTitle>
        <DialogDescription className="mt-3 leading-relaxed text-muted">
          Merci pour votre confiance. Un e-mail de confirmation a été envoyé à{" "}
          <strong className="text-ink">{result?.email}</strong>. Un conseiller BELTRANS vous
          recontacte rapidement.
        </DialogDescription>

        <div className="my-6 rounded-xl border border-dashed border-gold bg-gold-pale/20 p-4">
          <p className="text-xs font-semibold tracking-wider text-gold-deep uppercase">
            Votre référence
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="font-mono text-2xl font-bold tracking-wide text-ink">
              {result?.reference}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyReference}
              aria-label="Copier la référence"
            >
              {copied ? (
                <Check className="text-success" aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
            </Button>
          </div>
          <p className="sr-only" aria-live="polite">
            {copied ? "Référence copiée" : ""}
          </p>
        </div>

        <p className="mb-3 text-sm font-medium text-ink">Expédition urgente ?</p>
        <div className="flex flex-col gap-3">
          <Button asChild variant="whatsapp" size="lg">
            <a href={result?.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden="true" /> Contacter directement via WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/" onClick={onClose}>
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
