"use client";

import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { NavLinks } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { siteConfig } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";

/** Panneau du menu mobile — chargé à la demande (cf. MobileNav). */
export default function MobileNavSheet({
  open,
  onOpenChange,
  returnFocusTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusTo: React.RefObject<HTMLButtonElement | null>;
}) {
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="mobile-nav"
        aria-describedby="mobile-nav-desc"
        onCloseAutoFocus={(event) => {
          // Le bouton d'ouverture n'est pas un Trigger Radix : on lui rend le focus nous-mêmes
          event.preventDefault();
          returnFocusTo.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <DialogDescription id="mobile-nav-desc" className="sr-only">
          Navigation principale du site BELTRANS
        </DialogDescription>
        <Link href="/" onClick={close} className="mb-8 self-start rounded-md">
          <Logo className="h-12" />
        </Link>
        <nav aria-label="Navigation mobile">
          <NavLinks orientation="vertical" onNavigate={close} />
        </nav>
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Button asChild variant="gold" size="lg">
            <Link href="/devis" onClick={close}>
              Obtenir un devis
            </Link>
          </Button>
          <Button asChild variant="whatsapp" size="lg">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden="true" /> WhatsApp
            </a>
          </Button>
          <div className="mt-2 space-y-2 text-sm text-muted">
            <a
              href={`tel:${siteConfig.phone}`}
              className="flex items-center gap-2 hover:text-brand"
            >
              <Phone className="size-4" aria-hidden="true" /> {siteConfig.phoneDisplay}
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex items-center gap-2 hover:text-brand"
            >
              <Mail className="size-4" aria-hidden="true" /> {siteConfig.email}
            </a>
          </div>
        </div>
      </SheetContent>
    </Dialog>
  );
}
