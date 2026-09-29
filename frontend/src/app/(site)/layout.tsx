import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { JsonLd, organizationJsonLd } from "@/components/seo/json-ld";

/** Mise en page du site public (l'espace admin a la sienne). */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-50 rounded-md bg-gold px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu principal
      </a>
      <JsonLd data={organizationJsonLd()} />
      <SiteHeader />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFab />
      <GoogleAnalytics />
    </>
  );
}
