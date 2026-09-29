import { z } from "zod";
import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { HOME_CITY, HOME_COUNTRY, OPERATION_TYPES, SERVICE_TYPES } from "./labels";

/**
 * Schéma unique partagé client (React Hook Form) et serveur (API).
 * Le client envoie les valeurs BRUTES du formulaire ; le serveur ré-applique ce schéma
 * (normalisation E.164, conversions numériques, dates) — une seule source de vérité.
 */

const DEFAULT_PHONE_COUNTRY: CountryCode = "CG";
const PHONE_ERROR = "Numéro invalide — ex. +242 06 603 06 53 ou +33 6 12 34 56 78";

const requiredText = (label: string, max = 120) =>
  z
    .string({ required_error: `${label} requis` })
    .trim()
    .min(1, `${label} requis`)
    .max(max, `${max} caractères maximum`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .optional()
    .transform((v) => (v ? v : undefined));

const toE164 = (value: string) => parsePhoneNumberFromString(value, DEFAULT_PHONE_COUNTRY)!.number;

const phone = z
  .string({ required_error: "Téléphone requis" })
  .trim()
  .min(1, "Téléphone requis")
  .refine((v) => isValidPhoneNumber(v, DEFAULT_PHONE_COUNTRY), PHONE_ERROR)
  .transform(toE164);

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || isValidPhoneNumber(v, DEFAULT_PHONE_COUNTRY), PHONE_ERROR)
  .transform((v) => (v ? toE164(v) : undefined));

const optionalPositiveNumber = (max: number, { integer = false } = {}) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    (integer
      ? z.number({ invalid_type_error: "Nombre invalide" }).int("Nombre entier attendu")
      : z.number({ invalid_type_error: "Nombre invalide" })
    )
      .positive("La valeur doit être positive")
      .max(max, `Valeur maximale : ${max.toLocaleString("fr-FR")}`)
      .optional(),
  );

/** Numéro de conteneur ISO 6346 : 4 lettres + 7 chiffres (ex. MSCU1234567). */
const containerNumber = z
  .string()
  .optional()
  .transform((v) => (v ? v.replace(/[\s-]/g, "").toUpperCase() : undefined))
  .refine(
    (v) => !v || /^[A-Z]{4}\d{7}$/.test(v),
    "Format attendu : 4 lettres + 7 chiffres (ex. MSCU1234567)",
  );

const targetDate = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Date invalide")
  .refine((v) => {
    if (!v) return true;
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1); // tolérance fuseaux horaires
    return new Date(`${v}T23:59:59Z`) >= yesterday;
  }, "La date ne peut pas être dans le passé")
  .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : undefined));

const quoteFields = {
  // Étape 1 — Service
  serviceType: z.enum(SERVICE_TYPES, {
    required_error: "Choisissez un type de service",
    invalid_type_error: "Choisissez un type de service",
  }),
  operationType: z.enum(OPERATION_TYPES, {
    required_error: "Choisissez le type d'opération",
    invalid_type_error: "Choisissez le type d'opération",
  }),
  isUrgent: z.boolean().default(false),

  // Étape 2 — Itinéraire (le côté congolais est toujours Pointe-Noire, cf. normalize)
  originCountry: requiredText("Pays", 80),
  originCity: requiredText("Ville ou port", 80),
  destCountry: requiredText("Pays", 80),
  destCity: requiredText("Ville ou port", 80),
  targetDate,

  // Étape 3 — Marchandise
  cargoNature: requiredText("Nature de la marchandise", 120),
  cargoDescription: optionalText(2000),
  weightKg: optionalPositiveNumber(1_000_000),
  volumeCbm: optionalPositiveNumber(100_000),
  packageCount: optionalPositiveNumber(100_000, { integer: true }),
  containerNumber,

  // Étape 4 — Coordonnées
  firstName: requiredText("Prénom", 80),
  lastName: requiredText("Nom", 80),
  companyName: optionalText(120),
  email: z
    .string({ required_error: "E-mail requis" })
    .trim()
    .min(1, "E-mail requis")
    .email("Adresse e-mail invalide")
    .max(254)
    .toLowerCase(),
  phone,
  whatsapp: optionalPhone,
  additionalNotes: optionalText(2000),
  consent: z
    .boolean()
    .refine((v) => v === true, "Votre accord est nécessaire pour traiter la demande"),
};

type Normalizable = {
  serviceType: string;
  operationType: string;
  containerNumber?: string;
  originCountry: string;
  originCity: string;
  destCountry: string;
  destCity: string;
};

/**
 * Règles métier appliquées côté serveur :
 * - BELTRANS opère uniquement à Pointe-Noire : arrivée (import) ou départ (export) y est imposé ;
 * - le numéro de conteneur n'a de sens qu'en maritime.
 */
function normalize<T extends Normalizable>(data: T): T {
  const home = { country: HOME_COUNTRY, city: HOME_CITY };
  return {
    ...data,
    ...(data.operationType === "IMPORT"
      ? { destCountry: home.country, destCity: home.city }
      : { originCountry: home.country, originCity: home.city }),
    containerNumber: data.serviceType === "MARITIME" ? data.containerNumber : undefined,
  };
}

export const quoteFormSchema = z.object(quoteFields).transform(normalize);

export const quoteApiSchema = z
  .object({
    ...quoteFields,
    turnstileToken: z.string().max(4096).optional(),
    /** Honeypot anti-bot : doit rester vide. */
    website: z.string().max(0).optional(),
  })
  .transform(normalize);

export type QuoteFormInput = z.input<typeof quoteFormSchema>;
export type QuoteFormOutput = z.output<typeof quoteFormSchema>;
export type QuoteApiOutput = z.output<typeof quoteApiSchema>;

/** Champs validés à chaque étape du wizard. */
export const QUOTE_STEP_FIELDS = [
  ["serviceType", "operationType", "isUrgent"],
  ["originCountry", "originCity", "destCountry", "destCity", "targetDate"],
  ["cargoNature", "cargoDescription", "weightKg", "volumeCbm", "packageCount", "containerNumber"],
  [
    "firstName",
    "lastName",
    "companyName",
    "email",
    "phone",
    "whatsapp",
    "additionalNotes",
    "consent",
  ],
] as const satisfies ReadonlyArray<ReadonlyArray<keyof QuoteFormInput>>;
