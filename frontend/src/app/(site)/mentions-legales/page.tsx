import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales & confidentialité",
  description: "Mentions légales et politique de confidentialité du site BELTRANS.",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: true, follow: true },
};

// TODO(validation): texte à relire par BELTRANS / conseil juridique (hébergeur, directeur de publication).
export default function LegalPage() {
  return (
    <>
      <PageHero
        title="Mentions légales & confidentialité"
        crumbs={[{ name: "Mentions légales", href: "/mentions-legales" }]}
      />
      <div className="container-page max-w-3xl! space-y-10 py-14 leading-relaxed text-muted sm:py-20 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
        <section>
          <h2>Éditeur du site</h2>
          <p>
            {siteConfig.legalName} ({siteConfig.name} {siteConfig.legalForm}) — RCCM{" "}
            {siteConfig.rccm} — Agrément CEMAC N° {siteConfig.cemacAgreement}
            <br />
            {siteConfig.address.locality}, {siteConfig.address.countryName} —{" "}
            {siteConfig.phoneDisplay} — {siteConfig.email}
          </p>
        </section>
        <section>
          <h2>Hébergement</h2>
          <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
        </section>
        <section>
          <h2>Données personnelles collectées</h2>
          <p>
            Les informations transmises via le formulaire de demande de devis (identité,
            coordonnées, détails de l&apos;expédition) sont utilisées exclusivement pour étudier
            votre demande, vous adresser une offre et assurer le suivi commercial. Elles ne sont ni
            vendues ni cédées à des tiers.
          </p>
          <p className="mt-3">
            Sous-traitants techniques : hébergement de la base de données (Supabase), envoi
            d&apos;e-mails (Resend), protection anti-spam (Cloudflare Turnstile), mesure
            d&apos;audience (Google Analytics).
          </p>
        </section>
        <section>
          <h2>Durée de conservation</h2>
          <p>
            Les demandes de devis sont conservées 3 ans à compter du dernier contact, puis
            supprimées ou anonymisées.
          </p>
        </section>
        <section>
          <h2>Vos droits</h2>
          <p>
            Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en
            écrivant à{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="font-semibold text-brand hover:underline"
            >
              {siteConfig.email}
            </a>
            .
          </p>
        </section>
      </div>
    </>
  );
}
