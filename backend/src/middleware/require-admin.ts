import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { readCookie, SESSION_COOKIE } from "../lib/cookies";
import { getSessionAdmin } from "../services/auth.service";

declare module "express-serve-static-core" {
  interface Request {
    admin?: { id: string; email: string };
  }
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Défense CSRF en profondeur (en plus du cookie SameSite=Lax) : toute requête qui modifie
 * des données doit provenir d'une origine autorisée (le frontend).
 */
export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin || !env.CORS_ORIGINS.includes(origin)) {
    res.status(403).json({ error: "Origine non autorisée." });
    return;
  }
  next();
}

/** Accès réservé à un administrateur connecté (session valide en base). */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = readCookie(req, SESSION_COOKIE);
  const admin = token ? await getSessionAdmin(token) : null;
  if (!admin) {
    res.status(401).json({ error: "Authentification requise." });
    return;
  }
  req.admin = admin;
  res.set("Cache-Control", "no-store"); // données personnelles : jamais en cache
  next();
}
