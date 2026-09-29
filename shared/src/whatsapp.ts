import { company } from "./company";

/** Construit un lien wa.me avec message prérempli (numéro international, "+" facultatif). */
export function whatsappLink(text?: string, number: string = company.whatsapp) {
  const digits = number.replace(/\D/g, "");
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}

export function quoteWhatsappMessage(reference: string) {
  return `Bonjour BELTRANS, je vous contacte au sujet de ma demande de devis ${reference}.`;
}
