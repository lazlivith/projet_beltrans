import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contactez BELTRANS à ${siteConfig.address.locality} : ${siteConfig.phoneDisplay}, WhatsApp ou ${siteConfig.email}. Disponible ${siteConfig.hours}.`,
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: siteConfig.phoneDisplay,
    href: whatsappLink("Bonjour BELTRANS, "),
    external: true,
    note: "Canal le plus rapide",
  },
  {
    icon: Phone,
    title: "Téléphone",
    value: siteConfig.phoneDisplay,
    href: `tel:${siteConfig.phone}`,
    note: siteConfig.hours,
  },
  {
    icon: Mail,
    title: "E-mail",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    note: "Réponse rapide",
  },
];

export default function ContactPage() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`BELTRANS ${siteConfig.address.locality}`)}`;

  return (
    <>
      <PageHero
        title="Contactez-nous"
        description="Une question, une expédition urgente ? Notre équipe est joignable 7j/7, 24h/24."
        crumbs={[{ name: "Contact", href: "/contact" }]}
      />

      <section className="section-y">
        <div className="container-page mb-6 sm:mb-10">
          <div className="flex items-center justify-center rounded-2xl border border-line bg-white px-6 py-8 shadow-sm sm:rounded-3xl sm:py-12">
            <Image
              src="/images/logo.png"
              alt="BELTRANS sarl — Société Beli Transit Frets Services"
              width={790}
              height={283}
              sizes="(min-width: 640px) 420px, 80vw"
              className="h-auto w-full max-w-[420px]"
            />
          </div>
        </div>
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-10">
          <div>
            <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-1 xl:grid-cols-3">
              {channels.map(({ icon: Icon, title, value, href, external, note }) => (
                <li key={title}>
                  <a
                    href={href}
                    {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                    className="flex h-full items-center gap-4 rounded-2xl border border-line p-4 transition-shadow hover:shadow-lg sm:flex-col sm:items-start sm:gap-0 sm:p-5 lg:flex-row lg:items-center lg:gap-4 xl:flex-col xl:items-start xl:gap-0"
                  >
                    <Icon
                      className="size-6 shrink-0 text-brand sm:mb-3 lg:mb-0 xl:mb-3"
                      aria-hidden="true"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-bold">{title}</span>
                      <span className="mt-1 break-all text-brand">{value}</span>
                      <span className="mt-1 text-xs text-muted sm:mt-2 sm:text-sm">{note}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-5">
              <div className="flex gap-3 rounded-2xl bg-surface p-4 sm:p-6">
                <MapPin className="size-6 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <h2 className="font-bold">Adresse</h2>
                  <address className="mt-1 text-muted not-italic">
                    {siteConfig.address.streetAddress && (
                      <>
                        {siteConfig.address.streetAddress}
                        <br />
                      </>
                    )}
                    {siteConfig.address.locality}, {siteConfig.address.countryName}
                  </address>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-brand hover:underline"
                  >
                    Voir sur Google Maps
                  </a>
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl bg-surface p-4 sm:p-6">
                <Clock className="size-6 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <h2 className="font-bold">Horaires</h2>
                  <p className="mt-1 text-muted">{siteConfig.hours}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="on-dark rounded-2xl p-6 text-white bg-hero sm:rounded-3xl sm:p-8">
            <h2 className="font-serif text-xl sm:text-2xl">Besoin d&apos;un devis ?</h2>
            <p className="mt-3 leading-relaxed text-white/75">
              Notre formulaire guidé nous transmet toutes les informations utiles pour vous répondre
              vite et précisément.
            </p>
            <Button asChild variant="gold" size="lg" className="mt-6 w-full">
              <Link href="/devis">
                Demander un devis <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </aside>
        </div>
      </section>
    </>
  );
}
