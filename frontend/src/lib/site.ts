import { company } from "@beltrans/shared";

/** Configuration du site (les données légales/contact viennent de @beltrans/shared). */
export const siteConfig = {
  ...company,
  tagline: "Transit & dédouanement au port de Pointe-Noire",
  description:
    "BELTRANS, commissionnaire en douane agréé CEMAC à Pointe-Noire : prise en charge de vos marchandises au port et à l'aéroport de Pointe-Noire, dédouanement import et export. Devis rapide en ligne.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.beltrans.com",
  locale: "fr_FR",
  /** Périmètre d'intervention : port et aéroport de Pointe-Noire, une fois la marchandise au Congo. */
  areaServed: ["Pointe-Noire", "République du Congo"],
  scope: "Port et aéroport de Pointe-Noire",
  // TODO(validation): URLs des réseaux sociaux officiels
  socials: [] as { label: string; href: string }[],
} as const;

/** Menu principal (en-tête et menu mobile). */
export const mainNav = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
] as const;

/** Navigation du pied de page : menu principal + FAQ (accessible uniquement depuis le pied de page). */
export const footerNav = [
  ...mainNav.slice(0, 3),
  { href: "/faq", label: "FAQ" },
  ...mainNav.slice(3),
] as const;
