import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { services } from "@/content/services";
import { footerNav, siteConfig } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark bg-ink text-white/70">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:py-14 lg:grid-cols-4 lg:gap-10">
        <div className="col-span-2 space-y-4 lg:col-span-1">
          <Link
            href="/"
            aria-label="BELTRANS — Accueil"
            className="inline-block rounded-xl bg-white px-4 py-3"
          >
            <Logo className="h-12" />
          </Link>
          <p className="text-sm leading-relaxed">
            {siteConfig.legalName} — commissionnaire en douane agréé CEMAC, spécialiste du transit
            et du dédouanement au port de Pointe-Noire.
          </p>
          <p className="text-xs leading-relaxed text-white/60">
            RCCM N° {siteConfig.rccm}
            <br />
            Agrément CEMAC N° {siteConfig.cemacAgreement}
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
            Navigation
          </h2>
          <ul className="space-y-2 text-sm">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-gold-pale">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/devis" className="hover:text-gold-pale">
                Demande de devis
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
            Services
          </h2>
          <ul className="space-y-2 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hover:text-gold-pale">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">
            Contact
          </h2>
          <address className="space-y-3 text-sm not-italic">
            <p className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              {siteConfig.address.locality}, {siteConfig.address.countryName}
            </p>
            <a href={`tel:${siteConfig.phone}`} className="flex gap-2.5 hover:text-gold-pale">
              <Phone className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              {siteConfig.phoneDisplay}
            </a>
            <a href={`mailto:${siteConfig.email}`} className="flex gap-2.5 hover:text-gold-pale">
              <Mail className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              {siteConfig.email}
            </a>
            <p className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              {siteConfig.hours}
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name} {siteConfig.legalForm}. Tous droits réservés.
          </p>
          <Link href="/mentions-legales" className="hover:text-gold-pale">
            Mentions légales & confidentialité
          </Link>
        </div>
      </div>
    </footer>
  );
}
