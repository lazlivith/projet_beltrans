import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, FileText, MessageCircle } from "lucide-react";
import { CtaBand } from "@/components/sections/cta-band";
import { PageHero } from "@/components/sections/page-hero";
import { ServiceIcon } from "@/components/sections/service-icon";
import { JsonLd, serviceJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { getService, services } from "@/content/services";
import { whatsappLink } from "@/lib/whatsapp";
import { blurProps } from "@/lib/images";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getService((await params).slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.intro,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: `${service.title} | BELTRANS`, description: service.intro },
  };
}

export default async function ServicePage({ params }: Props) {
  const service = getService((await params).slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <JsonLd data={serviceJsonLd(service)} />
      <PageHero
        title={service.title}
        description={service.intro}
        crumbs={[
          { name: "Services", href: "/services" },
          { name: service.title, href: `/services/${service.slug}` },
        ]}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="gold" size="lg">
            <Link href={`/devis?service=${service.type}`}>
              Demander un devis <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline-light" size="lg">
            <a
              href={whatsappLink(
                `Bonjour BELTRANS, je souhaite des informations sur le service : ${service.title}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" /> Poser une question
            </a>
          </Button>
        </div>
      </PageHero>

      <section className="section-y">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
          <div>
            {service.image && (
              <Image
                src={service.image}
                {...blurProps(service.image)}
                alt={service.title}
                width={1200}
                height={600}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="mb-6 aspect-2/1 w-full rounded-2xl object-cover sm:mb-10"
              />
            )}
            <h2 className="mb-5 heading-section sm:mb-8">Ce que nous prenons en charge</h2>
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5">
              {service.features.map((f) => (
                <li key={f.title} className="rounded-2xl border border-line p-4 sm:p-6">
                  <Check
                    className="mb-2 size-5 text-success sm:mb-3 sm:size-6"
                    aria-hidden="true"
                  />
                  <h3 className="mb-1 text-sm font-bold sm:mb-1.5 sm:text-base">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted sm:text-base">{f.text}</p>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-4 sm:space-y-6">
            {service.documents && (
              <div className="rounded-2xl bg-surface p-4 sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 font-bold">
                  <FileText className="size-5 text-brand" aria-hidden="true" /> Documents usuels
                </h2>
                <ul className="space-y-2 text-muted">
                  {service.documents.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-gold"
                        aria-hidden="true"
                      />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <nav aria-label="Autres services" className="rounded-2xl border border-line p-4 sm:p-6">
              <h2 className="mb-4 font-bold">Autres services</h2>
              <ul className="space-y-1">
                {others.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-muted hover:bg-surface hover:text-brand"
                    >
                      <ServiceIcon name={s.icon} className="size-4.5 text-brand" />
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </section>

      <CtaBand title={`Besoin d'un devis ${service.title.toLowerCase()} ?`} />
    </>
  );
}
