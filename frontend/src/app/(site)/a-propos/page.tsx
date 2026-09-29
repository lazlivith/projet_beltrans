import type { Metadata } from "next";
import { BadgeCheck, Handshake, ShieldCheck, Target } from "lucide-react";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "À propos",
  description: `${siteConfig.legalName} : commissionnaire en douane agréé CEMAC (N° ${siteConfig.cemacAgreement}) basé à Pointe-Noire, spécialiste du transit et du fret.`,
  alternates: { canonical: "/a-propos" },
};

const values = [
  {
    icon: ShieldCheck,
    title: "Conformité",
    text: "Respect strict de la réglementation douanière et des normes de transport.",
  },
  {
    icon: Handshake,
    title: "Proximité",
    text: "Un interlocuteur dédié, joignable et impliqué dans la réussite de vos opérations.",
  },
  {
    icon: Target,
    title: "Fiabilité",
    text: "Des engagements tenus, une information claire à chaque étape.",
  },
];

// TODO(validation): historique, chiffres clés et équipe à fournir par BELTRANS.
export default function AboutPage() {
  return (
    <>
      <PageHero
        title="À propos de BELTRANS"
        description="Commissionnaire en douane agréé basé à Pointe-Noire, nous prenons en charge vos marchandises au port et à l'aéroport de Pointe-Noire."
        crumbs={[{ name: "À propos", href: "/a-propos" }]}
        image="/images/hero-port.jpg"
      />

      <section className="section-y">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4 text-base leading-relaxed text-muted sm:space-y-5 sm:text-lg">
            <h2 className="heading-section">Notre mission</h2>
            <p>
              La {siteConfig.legalName} ({siteConfig.name}) accompagne les entreprises et les
              particuliers dont les marchandises arrivent au Congo ou en partent par Pointe-Noire.
              Nous intervenons au port et à l&apos;aéroport de Pointe-Noire : réception, formalités
              douanières, sortie du port à l&apos;import et mise à bord à l&apos;export.
            </p>
            <p>
              Le transport international (depuis ou vers l&apos;étranger) reste organisé par vous ou
              votre fournisseur : BELTRANS prend le relais dès que la marchandise est au Congo, avec
              un interlocuteur unique, des délais maîtrisés et une conformité totale.
            </p>
          </div>

          <div className="rounded-2xl bg-surface p-5 sm:rounded-3xl sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <BadgeCheck className="size-6 text-brand" aria-hidden="true" /> Informations légales &
              agréments
            </h2>
            <dl className="divide-y divide-line">
              {[
                [
                  "Raison sociale",
                  `${siteConfig.legalName} (${siteConfig.name} ${siteConfig.legalForm})`,
                ],
                ["RCCM", siteConfig.rccm],
                ["Agrément CEMAC", `N° ${siteConfig.cemacAgreement}`],
                ["Siège", `${siteConfig.address.locality}, ${siteConfig.address.countryName}`],
                ["Disponibilité", siteConfig.hours],
              ].map(([term, value]) => (
                <div key={term} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
                  <dt className="text-muted">{term}</dt>
                  <dd className="font-semibold sm:text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-surface section-y" aria-labelledby="values-title">
        <div className="container-page">
          <h2 id="values-title" className="mb-6 heading-section sm:mb-10">
            Nos valeurs
          </h2>
          <ul className="grid gap-3 sm:gap-5 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl border border-line bg-white p-5 sm:p-7">
                <Icon className="mb-4 size-8 text-brand" aria-hidden="true" />
                <h3 className="mb-2 text-lg font-bold">{title}</h3>
                <p className="leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
