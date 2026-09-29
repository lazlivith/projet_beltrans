/**
 * Exécution manuelle (ou via une tâche planifiée) de la politique de rétention :
 * anonymisation des devis inactifs depuis 3 ans + purge des sessions expirées.
 *
 *   npm run retention -w backend
 */
import { prisma } from "../src/lib/prisma";
import { runRetention } from "../src/services/retention.service";

runRetention()
  .then(({ anonymized, sessions }) => {
    console.log(
      `✅ ${anonymized} devis anonymisé(s), ${sessions} session(s) expirée(s) supprimée(s).`,
    );
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
