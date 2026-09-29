/**
 * Jeu de données de démonstration pour l'espace admin (phase de test).
 *
 *   npm run db:seed-demo -w backend            → ajoute ~24 demandes fictives (tous statuts)
 *   npm run db:seed-demo -w backend -- --reset → supprime uniquement ces demandes
 *
 * Toutes les demandes fictives utilisent le domaine réservé « demo.beltrans.test » :
 * aucun e-mail ne peut partir, et elles se suppriment sans toucher aux vraies demandes.
 * Aucune notification n'est envoyée par ce script.
 */
import type { OperationType, Prisma, QuoteStatus, ServiceType } from "@prisma/client";
import { formatQuoteReference, HOME_CITY, HOME_COUNTRY } from "@beltrans/shared";
import { prisma } from "../src/lib/prisma";

export const DEMO_DOMAIN = "demo.beltrans.test";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

type Demo = {
  daysAgo: number;
  status: QuoteStatus;
  service: ServiceType;
  operation: OperationType;
  firstName: string;
  lastName: string;
  company?: string;
  /** Côté étranger : provenance (import) ou destination (export). */
  country: string;
  city: string;
  cargo: string;
  description?: string;
  weightKg?: number;
  volumeCbm?: number;
  packages?: number;
  container?: string;
  urgent?: boolean;
  message?: string;
  /** Délais de traitement (heures après la demande). */
  reviewAfterH?: number;
  quoteAfterH?: number;
  notes?: string;
};

// Personnes et sociétés fictives.
const DEMOS: Demo[] = [
  // ── Archivés (anciens dossiers clos) ──
  {
    daysAgo: 84,
    status: "ARCHIVED",
    service: "MARITIME",
    operation: "IMPORT",
    firstName: "Arnaud",
    lastName: "Mabika",
    company: "Mabika Distribution",
    country: "Chine",
    city: "Shanghai",
    cargo: "Marchandises générales",
    description: "Électroménager (réfrigérateurs, congélateurs)",
    weightKg: 18400,
    volumeCbm: 58,
    packages: 120,
    container: "MSCU4821037",
    reviewAfterH: 3,
    quoteAfterH: 22,
    notes: "Devis accepté. Opération clôturée le 12/07 — conteneur livré à l'entrepôt client.",
  },
  {
    daysAgo: 77,
    status: "ARCHIVED",
    service: "AERIEN",
    operation: "IMPORT",
    firstName: "Sandrine",
    lastName: "Ngoma",
    company: "Pharma Kouilou",
    country: "France",
    city: "Paris CDG",
    cargo: "Denrées périssables / sous température dirigée",
    description: "Produits pharmaceutiques (2–8 °C)",
    weightKg: 320,
    volumeCbm: 1.8,
    packages: 14,
    urgent: true,
    reviewAfterH: 1,
    quoteAfterH: 4,
    notes: "Chaîne du froid respectée. Dossier clos, facture réglée.",
  },
  {
    daysAgo: 70,
    status: "ARCHIVED",
    service: "DEDOUANEMENT",
    operation: "EXPORT",
    firstName: "Joël",
    lastName: "Itoua",
    company: "Bois du Mayombe",
    country: "Belgique",
    city: "Anvers",
    cargo: "Matériaux de construction",
    description: "Bois débité (sciages)",
    weightKg: 24000,
    volumeCbm: 55,
    packages: 40,
    reviewAfterH: 6,
    quoteAfterH: 30,
    notes: "Client sans suite après relance du 20/07. Archivé.",
  },

  // ── Refusés ──
  {
    daysAgo: 63,
    status: "REJECTED",
    service: "MARITIME",
    operation: "IMPORT",
    firstName: "Patrick",
    lastName: "Loubaki",
    country: "Turquie",
    city: "Mersin",
    cargo: "Véhicules",
    description: "2 véhicules d'occasion (SUV)",
    weightKg: 4200,
    packages: 2,
    reviewAfterH: 5,
    quoteAfterH: 26,
    notes: "Refusé : le client a trouvé moins cher via un autre transitaire. Écart ~8 %.",
  },
  {
    daysAgo: 49,
    status: "REJECTED",
    service: "AERIEN",
    operation: "EXPORT",
    firstName: "Grâce",
    lastName: "Bouanga",
    company: "Artisanat Loango",
    country: "France",
    city: "Marseille",
    cargo: "Autre",
    description: "Objets d'art et sculptures",
    weightKg: 85,
    volumeCbm: 0.9,
    packages: 6,
    reviewAfterH: 8,
    quoteAfterH: 20,
    notes: "Projet reporté par la cliente (salon annulé).",
  },
  {
    daysAgo: 21,
    status: "REJECTED",
    service: "DEDOUANEMENT",
    operation: "IMPORT",
    firstName: "Ferdinand",
    lastName: "Mouanda",
    company: "FM Motors",
    country: "Japon",
    city: "Yokohama",
    cargo: "Véhicules",
    description: "Pièces détachées automobiles",
    weightKg: 2600,
    volumeCbm: 9,
    packages: 48,
    reviewAfterH: 2,
    quoteAfterH: 18,
    notes:
      "Documents incomplets (certificat de conformité manquant). Client orienté vers son fournisseur.",
  },

  // ── Devis envoyés ──
  {
    daysAgo: 56,
    status: "QUOTED",
    service: "MARITIME",
    operation: "IMPORT",
    firstName: "Céline",
    lastName: "Mavoungou",
    company: "Congo Agro Services",
    country: "Brésil",
    city: "Santos",
    cargo: "Denrées périssables / sous température dirigée",
    description: "Viande congelée — conteneur reefer 40'",
    weightKg: 26000,
    volumeCbm: 67,
    packages: 1800,
    container: "MRKU7736120",
    reviewAfterH: 2,
    quoteAfterH: 9,
    notes: "Devis envoyé : 2 350 000 FCFA (hors droits et taxes). Relance prévue J+5.",
  },
  {
    daysAgo: 42,
    status: "QUOTED",
    service: "MARITIME",
    operation: "EXPORT",
    firstName: "Hervé",
    lastName: "Samba",
    company: "Samba Cacao Export",
    country: "Pays-Bas",
    city: "Rotterdam",
    cargo: "Marchandises générales",
    description: "Fèves de cacao en sacs (jute)",
    weightKg: 19500,
    volumeCbm: 33,
    packages: 300,
    container: "CMAU5102284",
    reviewAfterH: 4,
    quoteAfterH: 28,
    notes: "Devis 1 480 000 FCFA envoyé par WhatsApp. Client intéressé, attend son financement.",
  },
  {
    daysAgo: 35,
    status: "QUOTED",
    service: "AERIEN",
    operation: "IMPORT",
    firstName: "Nadège",
    lastName: "Kimbembe",
    company: "Télécom Équipements Congo",
    country: "Émirats arabes unis",
    city: "Dubaï",
    cargo: "Machines & équipements industriels",
    description: "Équipements réseau (antennes, baies)",
    weightKg: 740,
    volumeCbm: 4.2,
    packages: 22,
    urgent: true,
    reviewAfterH: 1,
    quoteAfterH: 5,
    notes: "Urgent — devis 890 000 FCFA envoyé le jour même. Attente bon pour accord.",
  },
  {
    daysAgo: 28,
    status: "QUOTED",
    service: "DEDOUANEMENT",
    operation: "IMPORT",
    firstName: "Régis",
    lastName: "Ossibi",
    company: "Ossibi BTP",
    country: "Chine",
    city: "Ningbo",
    cargo: "Machines & équipements industriels",
    description: "Groupe électrogène 250 kVA",
    weightKg: 3100,
    volumeCbm: 12,
    packages: 1,
    reviewAfterH: 3,
    quoteAfterH: 21,
    notes: "Devis dédouanement envoyé. Droits et taxes estimés, à confirmer à la liquidation.",
  },
  {
    daysAgo: 16,
    status: "QUOTED",
    service: "MARITIME",
    operation: "IMPORT",
    firstName: "Laetitia",
    lastName: "Mbemba",
    country: "France",
    city: "Le Havre",
    cargo: "Effets personnels / déménagement",
    description: "Déménagement — 20' (mobilier, cartons)",
    weightKg: 5200,
    volumeCbm: 28,
    packages: 95,
    container: "TGHU3309815",
    reviewAfterH: 6,
    quoteAfterH: 26,
    notes: "Devis envoyé. Rappel : demander la liste de colisage détaillée.",
  },
  {
    daysAgo: 9,
    status: "QUOTED",
    service: "AERIEN",
    operation: "EXPORT",
    firstName: "Yannick",
    lastName: "Tchicaya",
    company: "Pêcheries de la Côte Sauvage",
    country: "Espagne",
    city: "Madrid",
    cargo: "Denrées périssables / sous température dirigée",
    description: "Poisson frais sous glace",
    weightKg: 1200,
    volumeCbm: 5,
    packages: 60,
    urgent: true,
    reviewAfterH: 1,
    quoteAfterH: 3,
    notes: "Devis envoyé en 3 h. Vol cargo mardi si accord avant lundi 12 h.",
  },

  // ── En cours d'étude ──
  {
    daysAgo: 12,
    status: "UNDER_REVIEW",
    service: "MARITIME",
    operation: "IMPORT",
    firstName: "Olivier",
    lastName: "Nkounkou",
    company: "Quincaillerie du Port",
    country: "Turquie",
    city: "Istanbul",
    cargo: "Matériaux de construction",
    description: "Carrelage et sanitaires — 2 × 40'",
    weightKg: 48000,
    volumeCbm: 120,
    packages: 36,
    reviewAfterH: 5,
    notes: "En attente des tarifs armateur pour 2 × 40'.",
  },
  {
    daysAgo: 7,
    status: "UNDER_REVIEW",
    service: "DEDOUANEMENT",
    operation: "EXPORT",
    firstName: "Estelle",
    lastName: "Massamba",
    company: "Massamba Minerais",
    country: "Chine",
    city: "Qingdao",
    cargo: "Marchandises générales",
    description: "Concentré de minerai en big-bags",
    weightKg: 22000,
    volumeCbm: 18,
    packages: 22,
    reviewAfterH: 9,
    notes: "Vérifier les autorisations d'exportation minières avant chiffrage.",
  },
  {
    daysAgo: 5,
    status: "UNDER_REVIEW",
    service: "AERIEN",
    operation: "IMPORT",
    firstName: "Didier",
    lastName: "Poaty",
    company: "Clinique Saint-Luc",
    country: "Allemagne",
    city: "Francfort",
    cargo: "Machines & équipements industriels",
    description: "Matériel médical (échographe)",
    weightKg: 210,
    volumeCbm: 1.6,
    packages: 3,
    urgent: true,
    reviewAfterH: 2,
    notes: "Matériel fragile : prévoir manutention spéciale à l'aéroport.",
  },
  {
    daysAgo: 3,
    status: "UNDER_REVIEW",
    service: "MARITIME",
    operation: "EXPORT",
    firstName: "Fabrice",
    lastName: "Milandou",
    company: "Huilerie du Niari",
    country: "Cameroun",
    city: "Douala",
    cargo: "Marchandises générales",
    description: "Huile de palme en fûts",
    weightKg: 16000,
    volumeCbm: 22,
    packages: 80,
    reviewAfterH: 4,
    notes: "Appel client prévu demain 10 h pour préciser la date d'embarquement.",
  },
  {
    daysAgo: 2,
    status: "UNDER_REVIEW",
    service: "MARITIME",
    operation: "IMPORT",
    firstName: "Mireille",
    lastName: "Batantou",
    company: "Batantou Cosmétiques",
    country: "Inde",
    city: "Mumbai",
    cargo: "Marchandises générales",
    description: "Produits cosmétiques (LCL, 6 palettes)",
    weightKg: 1900,
    volumeCbm: 7.5,
    packages: 6,
    reviewAfterH: 6,
  },

  // ── Nouveaux (à traiter) ──
  {
    daysAgo: 1.6,
    status: "PENDING",
    service: "MARITIME",
    operation: "IMPORT",
    firstName: "Christian",
    lastName: "Moukala",
    company: "Moukala Import-Export",
    country: "Chine",
    city: "Guangzhou",
    cargo: "Marchandises générales",
    description: "Textiles et chaussures — 40' HC",
    weightKg: 21000,
    volumeCbm: 76,
    packages: 540,
    message: "Merci de me communiquer aussi le délai de sortie du port.",
  },
  {
    daysAgo: 1.1,
    status: "PENDING",
    service: "AERIEN",
    operation: "IMPORT",
    firstName: "Aurélie",
    lastName: "Kombo",
    country: "France",
    city: "Paris CDG",
    cargo: "Autre",
    description: "Colis personnel (documents et électronique)",
    weightKg: 23,
    volumeCbm: 0.2,
    packages: 2,
    urgent: true,
  },
  {
    daysAgo: 0.8,
    status: "PENDING",
    service: "DEDOUANEMENT",
    operation: "IMPORT",
    firstName: "Serge",
    lastName: "Ndinga",
    company: "Ndinga Pièces Auto",
    country: "Émirats arabes unis",
    city: "Jebel Ali",
    cargo: "Véhicules",
    description: "Véhicule 4×4 d'occasion",
    weightKg: 2300,
    packages: 1,
    container: undefined,
  },
  {
    daysAgo: 0.5,
    status: "PENDING",
    service: "MARITIME",
    operation: "EXPORT",
    firstName: "Bénédicte",
    lastName: "Louzolo",
    company: "Café des Plateaux",
    country: "Italie",
    city: "Gênes",
    cargo: "Marchandises générales",
    description: "Café vert en sacs",
    weightKg: 12000,
    volumeCbm: 21,
    packages: 200,
  },
  {
    daysAgo: 0.3,
    status: "PENDING",
    service: "AERIEN",
    operation: "EXPORT",
    firstName: "Jean-Marc",
    lastName: "Okemba",
    company: "Okemba Consulting",
    country: "États-Unis",
    city: "Houston",
    cargo: "Machines & équipements industriels",
    description: "Pièces de rechange pétrolières (réparation)",
    weightKg: 460,
    volumeCbm: 2.1,
    packages: 5,
    urgent: true,
    message: "Pièces à renvoyer au fabricant sous garantie.",
  },
  {
    daysAgo: 0.15,
    status: "PENDING",
    service: "MARITIME",
    operation: "IMPORT",
    firstName: "Rose",
    lastName: "Mahoukou",
    country: "Belgique",
    city: "Anvers",
    cargo: "Effets personnels / déménagement",
    description: "Retour au pays — 20' effets personnels",
    weightKg: 4800,
    volumeCbm: 26,
    packages: 70,
  },
];

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, ".");
}

async function reset() {
  const { count } = await prisma.quoteRequest.deleteMany({
    where: { email: { endsWith: `@${DEMO_DOMAIN}` } },
  });

  // Recale le compteur sur la plus haute référence restante (pas de trou s'il ne reste que du réel)
  const counters = await prisma.quoteCounter.findMany();
  for (const { year } of counters) {
    const last = await prisma.quoteRequest.findFirst({
      where: { reference: { startsWith: `BLT-${year}-` } },
      orderBy: { reference: "desc" },
      select: { reference: true },
    });
    const value = last ? Number(last.reference.slice(-6)) : 0;
    await prisma.quoteCounter.update({ where: { year }, data: { value } });
  }
  console.log(`🧹 ${count} demande(s) de démonstration supprimée(s).`);
}

async function seed() {
  const existing = await prisma.quoteRequest.count({
    where: { email: { endsWith: `@${DEMO_DOMAIN}` } },
  });
  if (existing) {
    console.log(
      `ℹ️  ${existing} demandes de démonstration déjà présentes. Utilisez --reset d'abord pour les recréer.`,
    );
    return;
  }

  const now = Date.now();
  // Ordre chronologique : les références suivent les dates de demande
  const ordered = [...DEMOS].sort((a, b) => b.daysAgo - a.daysAgo);

  for (const [index, demo] of ordered.entries()) {
    const createdAt = new Date(now - demo.daysAgo * DAY);
    const reviewedAt = demo.reviewAfterH
      ? new Date(createdAt.getTime() + demo.reviewAfterH * HOUR)
      : null;
    const quotedAt =
      reviewedAt && demo.quoteAfterH
        ? new Date(createdAt.getTime() + demo.quoteAfterH * HOUR)
        : null;
    const lastActivity = quotedAt ?? reviewedAt ?? createdAt;
    const phone = `+2420600000${String(10 + index).padStart(2, "0")}`;
    const isImport = demo.operation === "IMPORT";
    const year = createdAt.getUTCFullYear();

    const data: Omit<Prisma.QuoteRequestCreateInput, "reference"> = {
      firstName: demo.firstName,
      lastName: demo.lastName,
      companyName: demo.company ?? null,
      email: `${slug(demo.firstName)}.${slug(demo.lastName)}@${DEMO_DOMAIN}`,
      phone,
      whatsapp: index % 3 === 0 ? null : phone,
      serviceType: demo.service,
      operationType: demo.operation,
      originCountry: isImport ? demo.country : HOME_COUNTRY,
      originCity: isImport ? demo.city : HOME_CITY,
      destCountry: isImport ? HOME_COUNTRY : demo.country,
      destCity: isImport ? HOME_CITY : demo.city,
      cargoNature: demo.cargo,
      cargoDescription: demo.description ?? null,
      weightKg: demo.weightKg ?? null,
      volumeCbm: demo.volumeCbm ?? null,
      packageCount: demo.packages ?? null,
      containerNumber: demo.service === "MARITIME" ? (demo.container ?? null) : null,
      targetDate: new Date(createdAt.getTime() + (10 + (index % 4) * 5) * DAY),
      isUrgent: demo.urgent ?? false,
      additionalNotes: demo.message ?? null,
      consentAt: createdAt,
      status: demo.status,
      internalNotes: demo.notes ?? null,
      reviewedAt,
      quotedAt,
      createdAt,
      updatedAt: lastActivity,
    };

    await prisma.$transaction(async (tx) => {
      const counter = await tx.quoteCounter.upsert({
        where: { year },
        create: { year, value: 1 },
        update: { value: { increment: 1 } },
      });
      await tx.quoteRequest.create({
        data: { ...data, reference: formatQuoteReference(year, counter.value) },
      });
    });
  }

  const byStatus = await prisma.quoteRequest.groupBy({
    by: ["status"],
    where: { email: { endsWith: `@${DEMO_DOMAIN}` } },
    _count: true,
  });
  console.log(`✅ ${ordered.length} demandes de démonstration créées :`);
  for (const row of byStatus) console.log(`   ${row.status.padEnd(13)} ${row._count}`);
}

(process.argv.includes("--reset") ? reset() : seed())
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
