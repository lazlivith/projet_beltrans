/**
 * Crée (ou réinitialise) le compte de l'espace admin.
 *
 *   npm run admin:create -w backend -- contact@beltrans.com
 *
 * Le mot de passe est demandé de façon masquée (ou lu dans ADMIN_PASSWORD pour un usage
 * automatisé). Réinitialiser un mot de passe déconnecte toutes les sessions ouvertes.
 */
import { createInterface } from "node:readline";
import { adminLoginSchema } from "@beltrans/shared";
import { passwordPolicyError } from "../src/lib/password";
import { prisma } from "../src/lib/prisma";
import { upsertAdmin } from "../src/services/auth.service";

function askHidden(question: string) {
  return new Promise<string>((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { _writeToOutput: (s: string) => void };
    let muted = false;
    const write = output._writeToOutput.bind(rl);
    output._writeToOutput = (s: string) => (muted ? write(s.includes("\n") ? "\n" : "") : write(s));
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const email = process.argv[2];
  const parsedEmail = adminLoginSchema.shape.email.safeParse(email);
  if (!parsedEmail.success) {
    console.error("Usage : npm run admin:create -w backend -- adresse@email.com");
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await askHidden("Mot de passe (12 caractères min., lettres et chiffres) : ");
    const confirm = await askHidden("Confirmez le mot de passe : ");
    if (password !== confirm) {
      console.error("❌ Les mots de passe ne correspondent pas.");
      process.exit(1);
    }
  }

  const policyError = passwordPolicyError(password);
  if (policyError) {
    console.error(`❌ ${policyError}`);
    process.exit(1);
  }

  const admin = await upsertAdmin(parsedEmail.data, password);
  console.log(`✅ Compte admin prêt : ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
