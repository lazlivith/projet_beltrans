import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";

export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink("Bonjour BELTRANS, j'ai une question concernant une expédition.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous écrire sur WhatsApp (nouvel onglet)"
      className="fixed right-4 bottom-4 z-30 flex size-12 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-black/25 transition-transform hover:scale-105 focus-visible:outline-offset-4 sm:right-6 sm:bottom-6 sm:size-14"
    >
      <MessageCircle className="size-6 sm:size-7" aria-hidden="true" />
    </a>
  );
}
