import { Router } from "express";
import { quoteApiSchema, quoteWhatsappMessage, whatsappLink } from "@beltrans/shared";
import { logger } from "../lib/logger";
import { verifyTurnstile } from "../lib/turnstile";
import { limitQuoteSubmission } from "../middleware/rate-limit";
import { dispatchQuoteNotifications } from "../services/notifications";
import { createQuoteRequest } from "../services/quote.service";

export const quotesRouter = Router();

/**
 * POST /api/v1/quotes — pipeline CDC §3.1 :
 * validation Zod → Turnstile → rate limit (3/h/IP) → persistance + référence → notifications async.
 */
quotesRouter.post("/", async (req, res) => {
  const parsed = quoteApiSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      error: "Certains champs sont invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { turnstileToken, website, consent: _consent, ...data } = parsed.data;
  if (website) {
    res.status(400).json({ error: "Requête refusée." });
    return;
  }

  const ip = req.ip ?? "unknown";
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    res.status(403).json({ error: "La vérification anti-spam a échoué. Merci de réessayer." });
    return;
  }

  const limit = await limitQuoteSubmission(ip);
  if (!limit.success) {
    const retryAfter = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
    res
      .status(429)
      .set("Retry-After", String(retryAfter))
      .json({ error: "Trop de demandes envoyées. Contactez-nous directement sur WhatsApp." });
    return;
  }

  let quote;
  try {
    quote = await createQuoteRequest(data);
  } catch (err) {
    logger.error({ err }, "devis : échec de persistance");
    res
      .status(500)
      .json({ error: "Une erreur technique est survenue. Merci de nous contacter sur WhatsApp." });
    return;
  }

  res.status(201).json({
    reference: quote.reference,
    whatsappUrl: whatsappLink(quoteWhatsappMessage(quote.reference)),
  });

  // Notifications après la réponse : le devis est déjà persisté, un échec d'envoi est seulement journalisé.
  void dispatchQuoteNotifications(quote).catch((err) =>
    logger.error({ err, reference: quote.reference }, "notifications : échec global"),
  );
});
