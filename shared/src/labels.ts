/**
 * Périmètre métier BELTRANS : uniquement le port et l'aéroport de Pointe-Noire.
 * BELTRANS intervient une fois la marchandise au Congo (import à l'arrivée, export au départ) ;
 * le transport international est organisé par le client ou son fournisseur.
 *
 * NB : les enums SQL (Prisma) conservent TERRESTRE, MULTIMODAL et TRANSIT, prévus par le CDC ;
 * seuls les services et opérations ci-dessous sont proposés et acceptés par l'API.
 */
export const SERVICE_TYPES = ["MARITIME", "AERIEN", "DEDOUANEMENT"] as const;
export const OPERATION_TYPES = ["IMPORT", "EXPORT"] as const;

export type ServiceTypeValue = (typeof SERVICE_TYPES)[number];
export type OperationTypeValue = (typeof OPERATION_TYPES)[number];

export const HOME_COUNTRY = "République du Congo";
export const HOME_CITY = "Pointe-Noire";

/** Point de passage à Pointe-Noire selon le mode : port ou aéroport. */
export function homeHub(serviceType?: string) {
  return serviceType === "AERIEN" ? "Aéroport de Pointe-Noire" : "Port de Pointe-Noire";
}

// Libellés incluant les valeurs historiques des enums SQL (affichage des anciens devis).
export const SERVICE_LABELS = {
  MARITIME: "Fret maritime",
  AERIEN: "Fret aérien",
  DEDOUANEMENT: "Dédouanement",
  TERRESTRE: "Transport terrestre",
  MULTIMODAL: "Transport multimodal",
} as const satisfies Record<ServiceTypeValue | "TERRESTRE" | "MULTIMODAL", string>;

export const OPERATION_LABELS = {
  IMPORT: "Import",
  EXPORT: "Export",
  TRANSIT: "Transit",
} as const satisfies Record<OperationTypeValue | "TRANSIT", string>;

export const CARGO_NATURES = [
  "Marchandises générales",
  "Denrées périssables / sous température dirigée",
  "Marchandises dangereuses (IMDG / IATA)",
  "Véhicules",
  "Machines & équipements industriels",
  "Matériaux de construction",
  "Effets personnels / déménagement",
  "Autre",
] as const;

/** Pays de provenance (import) ou de destination (export) les plus fréquents. */
export const COUNTRY_SUGGESTIONS = [
  "Chine",
  "France",
  "Belgique",
  "Pays-Bas",
  "Espagne",
  "Italie",
  "Allemagne",
  "Turquie",
  "Émirats arabes unis",
  "Inde",
  "États-Unis",
  "Brésil",
  "Afrique du Sud",
  "Nigeria",
  "Cameroun",
  "Gabon",
] as const;

export function isServiceType(value: unknown): value is ServiceTypeValue {
  return typeof value === "string" && (SERVICE_TYPES as readonly string[]).includes(value);
}
