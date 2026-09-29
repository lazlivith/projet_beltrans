import { Router } from "express";
import {
  adminLoginSchema,
  adminQuoteListQuerySchema,
  adminQuotePatchSchema,
  adminStatsQuerySchema,
} from "@beltrans/shared";
import { clearSessionCookie, readCookie, SESSION_COOKIE, setSessionCookie } from "../lib/cookies";
import { logger } from "../lib/logger";
import { limitAdminLogin } from "../middleware/rate-limit";
import { requireAdmin, requireTrustedOrigin } from "../middleware/require-admin";
import {
  describeFilters,
  getQuote,
  getStats,
  listQuotes,
  listQuotesForExport,
  updateQuote,
} from "../services/admin-quotes.service";
import { login, logout } from "../services/auth.service";
import { buildQuoteTemplate, quoteTemplateFilename } from "../services/excel/quote-template";
import { buildQuotesExport } from "../services/excel/quotes-export";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** En-tête de téléchargement (nom de fichier ASCII + variante UTF-8 RFC 5987). */
function attachment(filename: string) {
  const ascii = filename.normalize("NFD").replace(/[^ -~]/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export const adminRouter = Router();

adminRouter.use(requireTrustedOrigin);

// ── Authentification ──

adminRouter.post("/auth/login", async (req, res) => {
  const ip = req.ip ?? "unknown";
  const limit = await limitAdminLogin(ip);
  if (!limit.success) {
    const retryAfter = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
    res
      .status(429)
      .set("Retry-After", String(retryAfter))
      .json({ error: "Trop de tentatives. Réessayez dans quelques minutes." });
    return;
  }

  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: "Identifiants invalides." });
    return;
  }

  const session = await login(parsed.data.email, parsed.data.password);
  if (!session) {
    logger.warn({ ip }, "admin : échec de connexion");
    // Message volontairement identique que l'e-mail existe ou non
    res.status(401).json({ error: "E-mail ou mot de passe incorrect." });
    return;
  }

  setSessionCookie(res, session.token, session.expiresAt);
  logger.info({ email: session.email }, "admin : connexion");
  res.json({ email: session.email });
});

adminRouter.post("/auth/logout", async (req, res) => {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) await logout(token);
  clearSessionCookie(res);
  res.status(204).end();
});

// ── Routes protégées ──

adminRouter.use(requireAdmin);

adminRouter.get("/auth/me", (req, res) => {
  res.json({ email: req.admin!.email });
});

adminRouter.get("/stats", async (req, res) => {
  const parsed = adminStatsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(422).json({ error: "Période invalide." });
    return;
  }
  res.json(await getStats(parsed.data));
});

adminRouter.get("/quotes", async (req, res) => {
  const parsed = adminQuoteListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res
      .status(422)
      .json({ error: "Filtres invalides.", fieldErrors: parsed.error.flatten().fieldErrors });
    return;
  }
  const { page, pageSize, ...filters } = parsed.data;
  res.json(await listQuotes(filters, page, pageSize));
});

/** Export de suivi (Excel) : mêmes filtres que la liste. */
adminRouter.get("/quotes/export.xlsx", async (req, res) => {
  const parsed = adminQuoteListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(422).json({ error: "Filtres invalides." });
    return;
  }
  const { page: _page, pageSize: _pageSize, ...filters } = parsed.data;
  const quotes = await listQuotesForExport(filters);
  const file = await buildQuotesExport(quotes, describeFilters(filters));
  const date = new Date().toISOString().slice(0, 10);
  logger.info({ admin: req.admin!.email, filters, count: quotes.length }, "admin : export Excel");
  res
    .set("Content-Type", XLSX_TYPE)
    .set("Content-Disposition", attachment(`Suivi-devis-BELTRANS-${date}.xlsx`))
    .send(file);
});

/** Modèle de devis Excel à compléter et renvoyer au client (sans notes internes). */
adminRouter.get("/quotes/:id/devis.xlsx", async (req, res) => {
  const quote = await getQuote(req.params.id);
  if (!quote) {
    res.status(404).json({ error: "Devis introuvable." });
    return;
  }
  const file = await buildQuoteTemplate(quote);
  logger.info(
    { admin: req.admin!.email, reference: quote.reference },
    "admin : modèle de devis généré",
  );
  res
    .set("Content-Type", XLSX_TYPE)
    .set("Content-Disposition", attachment(quoteTemplateFilename(quote)))
    .send(file);
});

adminRouter.get("/quotes/:id", async (req, res) => {
  const quote = await getQuote(req.params.id);
  if (!quote) {
    res.status(404).json({ error: "Devis introuvable." });
    return;
  }
  res.json(quote);
});

adminRouter.patch("/quotes/:id", async (req, res) => {
  const parsed = adminQuotePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: "Modification invalide." });
    return;
  }
  const quote = await updateQuote(req.params.id, parsed.data);
  if (!quote) {
    res.status(404).json({ error: "Devis introuvable." });
    return;
  }
  logger.info(
    { admin: req.admin!.email, reference: quote.reference, status: parsed.data.status },
    "admin : devis mis à jour",
  );
  res.json(quote);
});
