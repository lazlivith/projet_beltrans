import type { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "../lib/logger";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Ressource introuvable." });
};

/** Erreurs de parsing du body (JSON invalide, trop volumineux) + filet de sécurité 500. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const type = (err as { type?: string }).type;
  if (type === "entity.parse.failed") {
    res.status(400).json({ error: "Corps de requête JSON invalide." });
    return;
  }
  if (type === "entity.too.large") {
    res.status(413).json({ error: "Requête trop volumineuse." });
    return;
  }
  logger.error({ err, path: req.path }, "erreur non gérée");
  res.status(500).json({ error: "Une erreur technique est survenue." });
};
