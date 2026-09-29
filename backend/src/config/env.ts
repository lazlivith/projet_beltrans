import "dotenv/config";
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined));

const csv = (fallback: string) =>
  z
    .string()
    .default(fallback)
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );

/**
 * Configuration validée au démarrage : le serveur refuse de démarrer si une variable
 * obligatoire manque ou est mal formée (fail fast).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  /** Origines autorisées à appeler l'API (URL du frontend). */
  CORS_ORIGINS: csv("http://localhost:3000"),
  /** Réglage Express "trust proxy" : nombre de proxys devant l'API (0 = accès direct). */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL est obligatoire"),

  TURNSTILE_SECRET_KEY: optional,
  UPSTASH_REDIS_REST_URL: optional,
  UPSTASH_REDIS_REST_TOKEN: optional,

  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default("BELTRANS <devis@beltrans.com>"),
  QUOTE_NOTIFICATION_EMAILS: csv("contact@beltrans.com"),

  WHATSAPP_ACCESS_TOKEN: optional,
  WHATSAPP_PHONE_NUMBER_ID: optional,
  WHATSAPP_TEAM_NUMBER: optional,
  WHATSAPP_TEMPLATE_NAME: z.string().default("new_quote_alert"),
  WHATSAPP_TEMPLATE_LANG: z.string().default("fr"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Configuration invalide :", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
