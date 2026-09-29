import type { ServiceTypeValue } from "@beltrans/shared";

export type ServiceIcon = "ship" | "plane" | "file-check";

export type Service = {
  slug: string;
  type: ServiceTypeValue;
  icon: ServiceIcon;
  title: string;
  short: string;
  intro: string;
  features: { title: string; text: string }[];
  documents?: string[];
  /** Chemin d'image optionnel dans /public/images. */
  image?: string;
};

/**
 * Périmètre : port et aéroport de Pointe-Noire uniquement. BELTRANS intervient une fois la
 * marchandise au Congo (import à l'arrivée, export au départ).
 * TODO(validation): détail des prestations à confirmer par BELTRANS.
 */
export const services: Service[] = [
  {
    slug: "fret-maritime",
    image: "/images/services/maritime.jpg",
    type: "MARITIME",
    icon: "ship",
    title: "Fret maritime",
    short:
      "Prise en charge de vos conteneurs à l'arrivée au port de Pointe-Noire et formalités de départ à l'export.",
    intro:
      "Votre marchandise arrive au port de Pointe-Noire, ou doit en partir ? BELTRANS prend le relais sur place : réception des conteneurs, documents, formalités et sortie du port à l'import ; préparation et mise à bord à l'export.",
    features: [
      {
        title: "Réception à l'arrivée",
        text: "Suivi de l'arrivée du navire, récupération des documents et prise en charge de vos conteneurs (FCL) ou colis de groupage (LCL).",
      },
      {
        title: "Formalités portuaires",
        text: "Échange du connaissement, bon à enlever et démarches auprès des acteurs du port de Pointe-Noire.",
      },
      {
        title: "Sortie du port",
        text: "Enlèvement de la marchandise après dédouanement et mise à disposition à Pointe-Noire.",
      },
      {
        title: "Export : mise à bord",
        text: "Préparation des documents et formalités de départ pour vos marchandises quittant le Congo par le port.",
      },
    ],
    documents: [
      "Connaissement (B/L)",
      "Facture commerciale",
      "Liste de colisage",
      "Certificat d'origine (si requis)",
    ],
  },
  {
    slug: "fret-aerien",
    image: "/images/services/aerien.jpg",
    type: "AERIEN",
    icon: "plane",
    title: "Fret aérien",
    short:
      "Réception de vos envois à l'aéroport de Pointe-Noire et formalités de départ pour vos expéditions.",
    intro:
      "Pour vos colis arrivant par avion à Pointe-Noire, ou expédiés depuis Pointe-Noire, BELTRANS gère sur place la réception, les formalités douanières et la remise de la marchandise.",
    features: [
      {
        title: "Réception à l'aéroport",
        text: "Prise en charge de vos colis dès leur arrivée à l'aéroport de Pointe-Noire.",
      },
      {
        title: "Dédouanement rapide",
        text: "Formalités accélérées pour vos envois urgents et pièces critiques.",
      },
      {
        title: "Marchandises sensibles",
        text: "Traitement des produits périssables et réglementés selon les normes IATA.",
      },
      {
        title: "Export : remise à la compagnie",
        text: "Préparation des documents et formalités de départ de vos expéditions aériennes.",
      },
    ],
    documents: [
      "Lettre de transport aérien (LTA / AWB)",
      "Facture commerciale",
      "Liste de colisage",
    ],
  },
  {
    slug: "dedouanement",
    image: "/images/services/dedouanement.jpg",
    type: "DEDOUANEMENT",
    icon: "file-check",
    title: "Dédouanement",
    short:
      "Formalités douanières import et export à Pointe-Noire, assurées par un commissionnaire agréé CEMAC.",
    intro:
      "Commissionnaire en douane agréé CEMAC (agrément n° CDA 262), BELTRANS prend en charge vos formalités douanières à l'import comme à l'export, au port et à l'aéroport de Pointe-Noire.",
    features: [
      {
        title: "Déclarations en douane",
        text: "Établissement et dépôt des déclarations d'import et d'export.",
      },
      {
        title: "Classement tarifaire",
        text: "Vérification des positions tarifaires et des droits et taxes applicables.",
      },
      {
        title: "Liquidation des droits",
        text: "Calcul et règlement des droits et taxes pour une mainlevée rapide.",
      },
      {
        title: "Conseil & conformité",
        text: "Anticipation des documents requis pour éviter les blocages et surcoûts au port.",
      },
    ],
    documents: [
      "Facture commerciale",
      "Liste de colisage",
      "Titre de transport (B/L ou LTA)",
      "Documents spécifiques selon la marchandise",
    ],
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
