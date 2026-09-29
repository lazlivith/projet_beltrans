import type { Metadata } from "next";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { ServicesGrid } from "@/components/sections/services-grid";

export const metadata: Metadata = {
  title: "Nos services au port de Pointe-Noire",
  description:
    "Fret maritime, fret aérien et dédouanement agréé CEMAC : BELTRANS prend en charge vos marchandises à l'arrivée et au départ du port et de l'aéroport de Pointe-Noire.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Nos services"
        description="Dès que votre marchandise arrive au port ou à l'aéroport de Pointe-Noire, ou avant qu'elle n'en parte, BELTRANS prend le relais."
        crumbs={[{ name: "Services", href: "/services" }]}
        image="/images/services-banner.jpg"
      />
      <section className="bg-surface section-y">
        <div className="container-page">
          <ServicesGrid headingLevel="h2" />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
