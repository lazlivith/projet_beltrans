import { siteConfig } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";

type JsonLdObject = Record<string, unknown>;

/** Injection JSON-LD (échappement de "<" pour éviter toute injection de balise). */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const organizationId = `${siteConfig.url}/#organization`;

/**
 * LocalBusiness : zones desservies, contact, horaires (CDC §3.2).
 * NB : "LogisticsService" n'existe pas dans le vocabulaire schema.org ; les prestations sont
 * décrites via des entités `Service` rattachées à cette organisation (cf. serviceJsonLd).
 */
export function organizationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": organizationId,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: absoluteUrl("/images/logo.png"),
    image: absoluteUrl("/opengraph-image"),
    email: siteConfig.email,
    telephone: siteConfig.phone,
    identifier: [
      { "@type": "PropertyValue", propertyID: "RCCM", value: siteConfig.rccm },
      { "@type": "PropertyValue", propertyID: "Agrément CEMAC", value: siteConfig.cemacAgreement },
    ],
    address: {
      "@type": "PostalAddress",
      ...(siteConfig.address.streetAddress
        ? { streetAddress: siteConfig.address.streetAddress }
        : {}),
      addressLocality: siteConfig.address.locality,
      addressCountry: siteConfig.address.country,
    },
    areaServed: siteConfig.areaServed.map((name) => ({ "@type": "Place", name })),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: siteConfig.phone,
      email: siteConfig.email,
      availableLanguage: ["French"],
      areaServed: "CG",
    },
    ...(siteConfig.socials.length > 0 && { sameAs: siteConfig.socials.map((s) => s.href) }),
  };
}

export function serviceJsonLd(service: {
  title: string;
  intro: string;
  slug: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    serviceType: `Logistique — ${service.title}`,
    description: service.intro,
    url: absoluteUrl(`/services/${service.slug}`),
    provider: { "@id": organizationId },
    areaServed: siteConfig.areaServed.map((name) => ({ "@type": "Place", name })),
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}
