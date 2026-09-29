import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/password";

const SESSION_DAYS = 7;

/** Seul le SHA-256 du jeton est stocké : une fuite de la base ne permet pas d'usurper une session. */
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Hash factice : on vérifie toujours un mot de passe, même si l'e-mail est inconnu,
// pour que le temps de réponse ne révèle pas l'existence d'un compte.
let dummyHash: Promise<string> | null = null;

export async function login(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  dummyHash ??= hashPassword("dummy-password-for-timing");
  const valid = await verifyPassword(password, admin?.passwordHash ?? (await dummyHash));
  if (!admin || !valid) return null;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.adminSession.create({ data: { id: hashToken(token), adminId: admin.id, expiresAt } }),
    prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } }),
  ]);
  return { token, expiresAt, email: admin.email };
}

export async function getSessionAdmin(token: string) {
  const session = await prisma.adminSession.findUnique({
    where: { id: hashToken(token) },
    include: { admin: { select: { id: true, email: true } } },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.admin;
}

export async function logout(token: string) {
  await prisma.adminSession.deleteMany({ where: { id: hashToken(token) } });
}

/** Crée ou met à jour le compte admin (script CLI). Révoque les sessions existantes. */
export async function upsertAdmin(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });
  await prisma.adminSession.deleteMany({ where: { adminId: admin.id } });
  return admin;
}

export async function purgeExpiredSessions(now = new Date()) {
  const { count } = await prisma.adminSession.deleteMany({ where: { expiresAt: { lte: now } } });
  return count;
}
