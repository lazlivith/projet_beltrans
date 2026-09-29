import { env, isProduction } from "../config/env";
import { logger } from "./logger";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

if (!env.TURNSTILE_SECRET_KEY && isProduction) {
  logger.warn("TURNSTILE_SECRET_KEY absent : protection anti-spam désactivée en production.");
}

/**
 * Vérifie le jeton Cloudflare Turnstile.
 * Sans clé secrète, la vérification est ignorée afin de ne jamais bloquer la capture
 * de leads ; la clé est obligatoire en production (cf. README).
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) logger.warn({ codes: data["error-codes"] }, "turnstile : échec");
    return data.success === true;
  } catch (err) {
    logger.error({ err }, "turnstile : erreur réseau");
    return false;
  }
}
