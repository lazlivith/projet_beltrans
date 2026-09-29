import type { QuoteRequest } from "@prisma/client";
import { Resend } from "resend";
import { SERVICE_LABELS } from "@beltrans/shared";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { clientConfirmationEmail, teamAlertEmail } from "./templates";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const from = env.EMAIL_FROM;
const teamRecipients = env.QUOTE_NOTIFICATION_EMAILS;

async function sendClientConfirmation(q: QuoteRequest) {
  if (!resend) return "skipped: RESEND_API_KEY absent";
  const { subject, html, text } = clientConfirmationEmail(q);
  const { error } = await resend.emails.send({ from, to: q.email, subject, html, text });
  if (error) throw new Error(`Resend (client) : ${error.message}`);
  return "sent";
}

async function sendTeamAlert(q: QuoteRequest) {
  if (!resend) return "skipped: RESEND_API_KEY absent";
  const { subject, html, text } = teamAlertEmail(q);
  const { error } = await resend.emails.send({
    from,
    to: teamRecipients,
    replyTo: q.email,
    subject,
    html,
    text,
  });
  if (error) throw new Error(`Resend (équipe) : ${error.message}`);
  return "sent";
}

/**
 * Alerte WhatsApp de l'équipe via la Cloud API Meta (optionnelle).
 * Un message initié par l'entreprise exige un modèle approuvé ; paramètres attendus :
 * {{1}} référence · {{2}} client · {{3}} service · {{4}} trajet.
 */
async function sendTeamWhatsApp(q: QuoteRequest) {
  const token = env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const to = env.WHATSAPP_TEAM_NUMBER;
  if (!token || !phoneNumberId || !to) return "skipped: WhatsApp API non configurée";

  const params = [
    q.reference,
    `${q.firstName} ${q.lastName}${q.companyName ? ` (${q.companyName})` : ""}`,
    SERVICE_LABELS[q.serviceType],
    `${q.originCity} → ${q.destCity}`,
  ];

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: env.WHATSAPP_TEMPLATE_NAME,
        language: { code: env.WHATSAPP_TEMPLATE_LANG },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`WhatsApp API ${res.status} : ${await res.text()}`);
  return "sent";
}

/**
 * Envoi des notifications (CDC §3.1 étape 4), exécuté APRÈS la réponse HTTP.
 * Un échec n'impacte pas le prospect : le devis est déjà persisté en base.
 */
export async function dispatchQuoteNotifications(q: QuoteRequest) {
  const channels = ["email:client", "email:team", "whatsapp:team"] as const;
  const results = await Promise.allSettled([
    sendClientConfirmation(q),
    sendTeamAlert(q),
    sendTeamWhatsApp(q),
  ]);

  results.forEach((result, i) => {
    const channel = channels[i];
    if (result.status === "rejected") {
      logger.error({ err: result.reason, reference: q.reference, channel }, "notification : échec");
    } else if (result.value !== "sent") {
      logger.warn({ reference: q.reference, channel }, `notification : ${result.value}`);
    }
  });
}
