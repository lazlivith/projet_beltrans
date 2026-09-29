import type { Request, Response } from "express";
import { isProduction } from "../config/env";

export const SESSION_COOKIE = "beltrans_admin";
/** Le cookie n'est envoyé qu'aux routes admin de l'API. */
const COOKIE_PATH = "/api/v1/admin";

export function readCookie(req: Request, name: string) {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name)
      return decodeURIComponent(part.slice(index + 1).trim());
  }
  return undefined;
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true, // inaccessible au JavaScript de la page (protection XSS)
    secure: isProduction, // HTTPS uniquement en production
    sameSite: "lax", // non envoyé par les requêtes cross-site (protection CSRF)
    path: COOKIE_PATH,
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  });
}
