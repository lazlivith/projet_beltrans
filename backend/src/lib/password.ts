import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Hachage de mot de passe avec scrypt (natif Node.js, sans dépendance compilée).
 * Format stocké : scrypt$N$r$p$selBase64$hashBase64 — les paramètres voyagent avec le hash,
 * ce qui permet de les durcir plus tard sans invalider les comptes existants.
 */
const PARAMS = { N: 2 ** 15, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

function derive(password: string, salt: Buffer, opts: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password.normalize("NFKC"),
      salt,
      KEY_LENGTH,
      { ...opts, maxmem: MAX_MEM },
      (err, key) => (err ? reject(err) : resolve(key)),
    ),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, PARAMS);
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, N, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !N || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await derive(password, Buffer.from(salt, "base64"), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  // Comparaison à temps constant (pas de fuite d'information par le temps de réponse)
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Règle minimale pour le compte admin. */
export function passwordPolicyError(password: string) {
  if (password.length < 12) return "Le mot de passe doit contenir au moins 12 caractères.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
    return "Le mot de passe doit contenir des lettres et des chiffres.";
  return null;
}
