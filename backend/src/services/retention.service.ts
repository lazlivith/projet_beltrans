import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { purgeExpiredSessions } from "./auth.service";

/** Durée de conservation annoncée dans les mentions légales : 3 ans après le dernier contact. */
export const RETENTION_YEARS = 3;

export function retentionCutoff(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - RETENTION_YEARS);
  return cutoff;
}

/**
 * Anonymise les devis sans activité depuis 3 ans : les données personnelles sont effacées,
 * les données logistiques (référence, service, pays, dates) restent pour les statistiques.
 */
export async function anonymizeExpiredQuotes(now = new Date()) {
  const { count } = await prisma.quoteRequest.updateMany({
    where: { anonymizedAt: null, updatedAt: { lt: retentionCutoff(now) } },
    data: {
      firstName: "Anonyme",
      lastName: "",
      companyName: null,
      email: "",
      phone: "",
      whatsapp: null,
      cargoDescription: null,
      additionalNotes: null,
      internalNotes: null,
      anonymizedAt: now,
    },
  });
  return count;
}

export async function runRetention(now = new Date()) {
  const [anonymized, sessions] = await Promise.all([
    anonymizeExpiredQuotes(now),
    purgeExpiredSessions(now),
  ]);
  if (anonymized || sessions) {
    logger.info({ anonymized, sessions }, "rétention : données expirées traitées");
  }
  return { anonymized, sessions };
}

/** Exécution au démarrage puis toutes les 24 h (sans bloquer l'arrêt du process). */
export function scheduleRetention() {
  const run = () => runRetention().catch((err) => logger.error({ err }, "rétention : échec"));
  void run();
  setInterval(run, 24 * 60 * 60 * 1000).unref();
}
