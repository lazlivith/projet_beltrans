import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env, isProduction } from "../config/env";
import { logger } from "../lib/logger";

type RateLimitResult = { success: boolean; reset: number };
type Duration = `${number} ${"s" | "m" | "h"}`;

const UNIT_MS = { s: 1_000, m: 60_000, h: 3_600_000 } as const;

function toMs(window: Duration) {
  const [amount, unit] = window.split(" ") as [string, keyof typeof UNIT_MS];
  return Number(amount) * UNIT_MS[unit];
}

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
    : null;

if (!redis && isProduction) {
  logger.warn("Upstash non configuré : rate limit en mémoire (non partagé entre instances).");
}

// Repli mémoire : suffisant pour une instance unique, pas pour plusieurs répliques.
const memoryStores = new Set<Map<string, number[]>>();

/** Fenêtre glissante : `limit` requêtes par `window` et par clé (IP…). */
function createRateLimiter(prefix: string, limit: number, window: Duration) {
  const windowMs = toMs(window);
  const upstash = redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, window), prefix })
    : null;
  const memory = new Map<string, number[]>();
  memoryStores.add(memory);

  return async (key: string): Promise<RateLimitResult> => {
    if (upstash) {
      const { success, reset } = await upstash.limit(key);
      return { success, reset };
    }
    const now = Date.now();
    const hits = (memory.get(key) ?? []).filter((t) => now - t < windowMs);
    const success = hits.length < limit;
    if (success) hits.push(now);
    memory.set(key, hits);
    return { success, reset: (hits[0] ?? now) + windowMs };
  };
}

/** Max 3 soumissions de devis / heure / IP (CDC §3.1 étape 2). */
export const limitQuoteSubmission = createRateLimiter("beltrans:quotes", 3, "1 h");

/** Anti force brute : 5 tentatives de connexion admin / 15 min / IP. */
export const limitAdminLogin = createRateLimiter("beltrans:admin-login", 5, "15 m");

/** Réservé aux tests. */
export function resetMemoryRateLimit() {
  for (const store of memoryStores) store.clear();
}
