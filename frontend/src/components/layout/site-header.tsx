import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLinks } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

export function SiteHeader() {
  return (
    <>
      <div className="on-dark hidden bg-ink text-xs tracking-wider text-white/70 md:block">
        <div className="container-page flex h-9 items-center justify-between">
          <p className="flex items-center gap-4">
            <span className="rounded-full bg-linear-to-r from-gold to-gold-pale px-2.5 py-0.5 text-[0.65rem] font-bold text-ink">
              RCCM N° {siteConfig.rccm}
            </span>
            <span className="hidden lg:inline">Agrément CEMAC N° {siteConfig.cemacAgreement}</span>
          </p>
          <div className="flex items-center gap-5">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-gold-pale"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              {siteConfig.phoneDisplay}
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex items-center gap-1.5 hover:text-gold-pale"
            >
              <Mail className="size-3.5" aria-hidden="true" />
              {siteConfig.email}
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-white shadow-sm">
        <div className="container-page flex h-14 items-center justify-between gap-3 sm:h-16 lg:h-18">
          <Link href="/" aria-label="BELTRANS — Accueil" className="shrink-0 rounded-md">
            <Logo priority className="h-9 sm:h-11 lg:h-13" />
          </Link>

          <nav aria-label="Navigation principale" className="hidden lg:block">
            <NavLinks />
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="gold" size="sm" className="hidden sm:inline-flex">
              <Link href="/devis">Obtenir un devis</Link>
            </Button>
            <MobileNav />
          </div>
        </div>
      </header>
    </>
  );
}
