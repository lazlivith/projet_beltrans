import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { scheduleRetention } from "./services/retention.service";

/** Vérifie la base au démarrage : un problème de connexion est signalé clairement, tout de suite. */
async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Base de données : connexion OK");
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const hint = /Authentication failed|password authentication/i.test(message)
      ? "identifiant ou mot de passe refusé par PostgreSQL — vérifiez DATABASE_URL dans backend/.env (fichier bien enregistré ?)"
      : /Can't reach|ECONNREFUSED|connect/i.test(message)
        ? "serveur PostgreSQL injoignable — est-il démarré ? (hôte et port de DATABASE_URL)"
        : "vérifiez DATABASE_URL dans backend/.env";
    logger.error(`❌ Base de données inaccessible : ${hint}`);
    return false;
  }
}

const server = createApp().listen(env.PORT, () => {
  logger.info(`API BELTRANS démarrée sur http://localhost:${env.PORT} (${env.NODE_ENV})`);
  void checkDatabase().then((ok) => ok && scheduleRetention());
});

function shutdown(signal: string) {
  logger.info(`${signal} reçu, arrêt en cours…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
