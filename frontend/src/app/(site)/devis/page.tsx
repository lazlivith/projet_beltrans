import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/sections/page-hero";
import { QuoteWizard } from "@/components/quote/quote-wizard";

export const metadata: Metadata = {
  title: "Demande de devis — Pointe-Noire",
  description:
    "Devis pour la prise en charge de vos marchandises au port ou à l'aéroport de Pointe-Noire : dédouanement import et export. Formulaire en 4 étapes, référence immédiate.",
  alternates: { canonical: "/devis" },
};

export default function QuotePage() {
  return (
    <>
      <PageHero
        title="Demande de devis"
        description="4 étapes, environ 2 minutes. Vous recevez immédiatement votre référence de suivi par e-mail."
        crumbs={[{ name: "Devis", href: "/devis" }]}
      />
      <section className="bg-surface/60 py-6 sm:py-10 lg:py-14">
        <div className="container-page">
          <Suspense
            fallback={
              <div className="h-[36rem] animate-pulse rounded-3xl bg-white" aria-hidden="true" />
            }
          >
            <QuoteWizard />
          </Suspense>
        </div>
      </section>
    </>
  );
}
