import type { Metadata } from "next";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faq } from "@/content/faq";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description:
    "Devis, dédouanement, documents, FCL/LCL, zones desservies : les réponses aux questions fréquentes sur les services BELTRANS.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
      <PageHero
        title="Questions fréquentes"
        description="Tout ce qu'il faut savoir avant de confier vos marchandises à BELTRANS."
        crumbs={[{ name: "FAQ", href: "/faq" }]}
      />
      <section className="py-10 sm:py-14 lg:py-20">
        <div className="container-page max-w-3xl!">
          <Accordion type="single" collapsible className="border-t border-line">
            {faq.map((item, i) => (
              <AccordionItem key={item.question} value={`q-${i}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
      <CtaBand
        title="Vous n'avez pas trouvé votre réponse ?"
        text="Notre équipe vous répond 7j/7 par WhatsApp, téléphone ou e-mail."
      />
    </>
  );
}
