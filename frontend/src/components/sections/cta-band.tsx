import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/whatsapp";

export function CtaBand({
  title = "Un projet d'expédition ?",
  text = "Décrivez votre besoin en 2 minutes : vous recevez immédiatement une référence de suivi et un conseiller vous recontacte.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="container-page py-10 sm:py-16 lg:py-20">
      <div className="on-dark relative overflow-hidden rounded-2xl px-5 py-9 text-center text-white bg-hero sm:rounded-3xl sm:px-12 sm:py-14 lg:py-16">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-serif text-2xl sm:text-3xl lg:text-4xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:mt-4 sm:text-base">
            {text}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href="/devis">
                Demander un devis <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline-light" size="lg">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden="true" /> Échanger sur WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
