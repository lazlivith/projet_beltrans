import type { QuoteRequest } from "@prisma/client";
import {
  company,
  OPERATION_LABELS,
  quoteWhatsappMessage,
  SERVICE_LABELS,
  whatsappLink,
} from "@beltrans/shared";

const COLORS = {
  ink: "#04102b",
  brand: "#0d3fa6",
  gold: "#d4a843",
  muted: "#4a5572",
  line: "#e6e9f2",
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Row = [label: string, value: string | number | null | undefined];

function summaryRows(q: QuoteRequest): Row[] {
  return [
    ["Service", SERVICE_LABELS[q.serviceType]],
    ["Opération", OPERATION_LABELS[q.operationType]],
    ["Urgent", q.isUrgent ? "Oui" : "Non"],
    ["Origine", `${q.originCity}, ${q.originCountry}`],
    ["Destination", `${q.destCity}, ${q.destCountry}`],
    [
      "Date souhaitée",
      q.targetDate ? q.targetDate.toLocaleDateString("fr-FR", { timeZone: "UTC" }) : null,
    ],
    ["Marchandise", q.cargoNature],
    ["Description", q.cargoDescription],
    ["Poids (kg)", q.weightKg],
    ["Volume (m³)", q.volumeCbm],
    ["Nombre de colis", q.packageCount],
    ["N° conteneur", q.containerNumber],
  ];
}

function contactRows(q: QuoteRequest): Row[] {
  return [
    ["Nom", `${q.firstName} ${q.lastName}`],
    ["Société", q.companyName],
    ["E-mail", q.email],
    ["Téléphone", q.phone],
    ["WhatsApp", q.whatsapp],
    ["Notes", q.additionalNotes],
  ];
}

function table(rows: Row[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
${rows
  .filter(([, v]) => v !== null && v !== undefined && v !== "")
  .map(
    ([label, value]) => `<tr>
  <td style="padding:8px 12px;border-bottom:1px solid ${COLORS.line};color:${COLORS.muted};width:38%;vertical-align:top">${escapeHtml(label)}</td>
  <td style="padding:8px 12px;border-bottom:1px solid ${COLORS.line};color:${COLORS.ink};white-space:pre-line">${escapeHtml(String(value))}</td>
</tr>`,
  )
  .join("\n")}
</table>`;
}

function button(href: string, label: string, bg: string, color = "#ffffff") {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;margin:4px 8px 4px 0">${escapeHtml(label)}</a>`;
}

function layout(title: string, body: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f4f6fb;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:${COLORS.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:${COLORS.ink};padding:20px 24px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.04em">BEL<span style="color:${COLORS.gold}">TRANS</span></td></tr>
<tr><td style="padding:24px">${body}</td></tr>
<tr><td style="padding:16px 24px;background:#f4f6fb;color:${COLORS.muted};font-size:12px;line-height:1.6">
${escapeHtml(company.legalName)} · RCCM ${escapeHtml(company.rccm)} · Agrément CEMAC ${escapeHtml(company.cemacAgreement)}<br>
${escapeHtml(company.phoneDisplay)} · ${escapeHtml(company.email)}
</td></tr></table></td></tr></table></body></html>`;
}

/** E-mail de confirmation envoyé au prospect. */
export function clientConfirmationEmail(q: QuoteRequest) {
  const subject = `Votre demande de devis ${q.reference} — BELTRANS`;
  const html = layout(
    subject,
    `<p style="font-size:16px;margin:0 0 12px">Bonjour ${escapeHtml(q.firstName)},</p>
<p style="line-height:1.6;margin:0 0 16px">Nous avons bien reçu votre demande de devis. Un conseiller BELTRANS l'étudie et revient vers vous dans les meilleurs délais.</p>
<p style="margin:0 0 20px;padding:14px 16px;background:#f4f6fb;border-left:4px solid ${COLORS.gold};font-size:15px">Référence : <strong style="font-family:Consolas,monospace">${escapeHtml(q.reference)}</strong></p>
<h2 style="font-size:15px;margin:0 0 8px;color:${COLORS.brand}">Récapitulatif</h2>
${table(summaryRows(q))}
<p style="line-height:1.6;margin:20px 0 12px">Une urgence ? Contactez-nous directement en rappelant votre référence :</p>
${button(whatsappLink(quoteWhatsappMessage(q.reference)), "Écrire sur WhatsApp", "#1f8f4e")}
${button(`tel:${company.phone}`, `Appeler le ${company.phoneDisplay}`, COLORS.brand)}`,
  );
  const text = `Bonjour ${q.firstName},\n\nNous avons bien reçu votre demande de devis (référence ${q.reference}). Un conseiller BELTRANS revient vers vous rapidement.\n\nUrgence : WhatsApp ${company.phoneDisplay} — ${company.email}`;
  return { subject, html, text };
}

/** Alerte envoyée à l'équipe commerciale, avec actions directes vers le client. */
export function teamAlertEmail(q: QuoteRequest) {
  const urgent = q.isUrgent ? "🔴 URGENT — " : "";
  const subject = `${urgent}Nouveau devis ${q.reference} · ${SERVICE_LABELS[q.serviceType]} · ${q.originCountry} → ${q.destCountry}`;
  const clientWhatsapp = q.whatsapp ?? q.phone;
  const html = layout(
    subject,
    `<p style="margin:0 0 16px;font-size:16px"><strong>${escapeHtml(q.reference)}</strong>${q.isUrgent ? ` <span style="background:#c62828;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">URGENT</span>` : ""}</p>
<div style="margin:0 0 20px">
${button(`mailto:${q.email}?subject=${encodeURIComponent(`Votre devis ${q.reference} — BELTRANS`)}`, "Répondre par e-mail", COLORS.brand)}
${button(whatsappLink(`Bonjour ${q.firstName}, BELTRANS vous contacte au sujet de votre demande ${q.reference}.`, clientWhatsapp), "WhatsApp client", "#1f8f4e")}
${button(`tel:${q.phone}`, "Appeler", COLORS.ink)}
</div>
<h2 style="font-size:15px;margin:0 0 8px;color:${COLORS.brand}">Client</h2>
${table(contactRows(q))}
<h2 style="font-size:15px;margin:20px 0 8px;color:${COLORS.brand}">Demande</h2>
${table(summaryRows(q))}`,
  );
  const text = `Nouveau devis ${q.reference}\n${q.firstName} ${q.lastName} — ${q.email} — ${q.phone}\n${SERVICE_LABELS[q.serviceType]} / ${OPERATION_LABELS[q.operationType]} : ${q.originCity}, ${q.originCountry} → ${q.destCity}, ${q.destCountry}`;
  return { subject, html, text };
}
