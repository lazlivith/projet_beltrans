import ExcelJS from "exceljs";
import type { QuoteRequest } from "@prisma/client";
import {
  company,
  formatPhone,
  HOME_CITY,
  homeHub,
  OPERATION_LABELS,
  SERVICE_LABELS,
} from "@beltrans/shared";
import {
  addLogo,
  border,
  bottomBorder,
  COLORS,
  DATE,
  FCFA,
  fill,
  font,
  toLocalExcelDate,
} from "./theme";

type Line = { label: string; type: "Prestation" | "Débours" };

/** Lignes pré-remplies selon le service et le sens de l'opération (modifiables dans Excel). */
export function defaultLines(q: Pick<QuoteRequest, "serviceType" | "operationType">): Line[] {
  const isImport = q.operationType === "IMPORT";
  const common: Line = { label: "Frais de dossier et coordination", type: "Prestation" };

  switch (q.serviceType) {
    case "AERIEN":
      return isImport
        ? [
            common,
            { label: "Réception du fret à l'aéroport de Pointe-Noire", type: "Prestation" },
            { label: "Honoraires de dédouanement import", type: "Prestation" },
            { label: "Frais aéroportuaires et magasinage (sur justificatifs)", type: "Débours" },
            { label: "Droits et taxes de douane (sur justificatifs)", type: "Débours" },
          ]
        : [
            common,
            { label: "Formalités douanières export", type: "Prestation" },
            { label: "Remise du fret à la compagnie aérienne", type: "Prestation" },
            { label: "Frais aéroportuaires (sur justificatifs)", type: "Débours" },
          ];
    case "DEDOUANEMENT":
      return [
        common,
        {
          label: `Honoraires de dédouanement ${isImport ? "import" : "export"}`,
          type: "Prestation",
        },
        { label: "Droits et taxes de douane (sur justificatifs)", type: "Débours" },
      ];
    default: // MARITIME (et valeurs historiques)
      return isImport
        ? [
            common,
            { label: "Formalités portuaires (échange B/L, bon à enlever)", type: "Prestation" },
            { label: "Honoraires de dédouanement import", type: "Prestation" },
            { label: "Frais portuaires et de manutention (sur justificatifs)", type: "Débours" },
            { label: "Droits et taxes de douane (sur justificatifs)", type: "Débours" },
            { label: "Sortie du port et mise à disposition", type: "Prestation" },
          ]
        : [
            common,
            { label: "Formalités douanières export", type: "Prestation" },
            { label: "Mise à bord", type: "Prestation" },
            { label: "Frais portuaires et de manutention (sur justificatifs)", type: "Débours" },
          ];
  }
}

const EXTRA_LINES = 3;
const VALIDITY_DAYS = 30;
const DEFAULT_VAT = 0.18;

function clientName(q: QuoteRequest) {
  return q.anonymizedAt ? "Client (données anonymisées)" : `${q.firstName} ${q.lastName}`.trim();
}

/** Nom de fichier lisible : Devis-BLT-2026-000012-Moukala.xlsx */
export function quoteTemplateFilename(q: QuoteRequest) {
  const name = (q.anonymizedAt ? "" : q.lastName)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `Devis-${q.reference}${name ? `-${name}` : ""}.xlsx`;
}

/**
 * Modèle de devis à retourner au client (A4, aux couleurs BELTRANS) :
 * informations pré-remplies, lignes de prestations à chiffrer, calculs automatiques.
 * Aucune note interne n'y figure.
 */
export async function buildQuoteTemplate(q: QuoteRequest, issuedAt = new Date()) {
  const wb = new ExcelJS.Workbook();
  wb.creator = company.name;
  wb.title = `Devis ${q.reference}`;
  wb.company = company.legalName;
  wb.created = issuedAt;

  const ws = wb.addWorksheet("Devis", {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.2, footer: 0.3 },
    },
    headerFooter: {
      oddFooter: `&L&8&K4A5572${company.name} ${company.legalForm} — RCCM ${company.rccm}&R&8&K4A5572Devis ${q.reference} · page &P/&N`,
    },
  });

  // A : marge · B désignation · C type · D quantité · E prix unitaire · F montant · G : marge
  ws.columns = [
    { width: 2 },
    { width: 44 },
    { width: 13 },
    { width: 9 },
    { width: 17 },
    { width: 19 },
    { width: 2 },
  ];

  const cell = (ref: string) => ws.getCell(ref);
  const label = (ref: string, text: string) => {
    const c = cell(ref);
    c.value = text;
    c.font = font({ size: 8.5, bold: true, color: { argb: COLORS.goldDeep } });
  };

  // ── En-tête : logo + coordonnées ──
  ws.getRow(1).height = 8;
  for (const r of [2, 3, 4, 5]) ws.getRow(r).height = 17;
  const logo = addLogo(wb);
  if (logo !== null)
    ws.addImage(logo, { tl: { col: 1, row: 1.1 }, ext: { width: 190, height: 68 } });

  const headerLines: [string, Partial<ExcelJS.Font>][] = [
    [`${company.name} ${company.legalForm}`, font({ size: 13, bold: true })],
    [company.legalName, font({ size: 9, color: { argb: COLORS.muted } })],
    [
      `RCCM ${company.rccm} · Agrément CEMAC ${company.cemacAgreement}`,
      font({ size: 9, color: { argb: COLORS.muted } }),
    ],
    [
      `${company.address.locality}, ${company.address.countryName} · ${company.phoneDisplay} · ${company.email}`,
      font({ size: 9, color: { argb: COLORS.muted } }),
    ],
  ];
  headerLines.forEach(([text, f], i) => {
    const row = 2 + i;
    ws.mergeCells(`C${row}:F${row}`);
    const c = cell(`C${row}`);
    c.value = text;
    c.font = f;
    c.alignment = { horizontal: "right", vertical: "middle" };
  });

  // ── Bandeau titre ──
  ws.getRow(6).height = 10;
  ws.mergeCells("B7:F7");
  const title = cell("B7");
  title.value = "PROPOSITION DE DEVIS";
  title.font = font({ size: 16, bold: true, color: { argb: COLORS.white } });
  title.fill = fill(COLORS.ink);
  title.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  ws.getRow(7).height = 32;
  ws.mergeCells("B8:F8");
  cell("B8").fill = fill(COLORS.gold);
  ws.getRow(8).height = 4;

  // ── Client / Références du devis ──
  ws.getRow(9).height = 12;
  label("B10", "CLIENT");
  label("D10", "DEVIS");
  const clientLines = [
    [clientName(q), true],
    [q.companyName ?? "", false],
    [q.anonymizedAt ? "" : q.email, false],
    [
      q.anonymizedAt
        ? ""
        : [
            formatPhone(q.phone),
            q.whatsapp && q.whatsapp !== q.phone ? `WhatsApp ${formatPhone(q.whatsapp)}` : "",
          ]
            .filter(Boolean)
            .join(" · "),
      false,
    ],
  ] as const;
  clientLines.forEach(([text, bold], i) => {
    const c = cell(`B${11 + i}`);
    c.value = text;
    c.font = font({ size: bold ? 11 : 10, bold });
  });

  const issued = toLocalExcelDate(issuedAt)!;
  const refs: [string, ExcelJS.CellValue, string?][] = [
    ["N° de devis", q.reference],
    ["Date d'émission", issued, DATE],
    ["Valable jusqu'au", { formula: `E12+${VALIDITY_DAYS}` }, DATE],
    ["Demande reçue le", toLocalExcelDate(q.createdAt), DATE],
  ];
  refs.forEach(([text, value, numFmt], i) => {
    const row = 11 + i;
    const l = cell(`D${row}`);
    l.value = text;
    l.font = font({ size: 9, color: { argb: COLORS.muted } });
    ws.mergeCells(`E${row}:F${row}`);
    const v = cell(`E${row}`);
    v.value = value;
    v.font = font({ bold: i === 0 });
    v.alignment = { horizontal: "right" };
    if (numFmt) v.numFmt = numFmt;
  });

  // ── Détails de l'opération ──
  const detailsTop = 16;
  ws.mergeCells(`B${detailsTop}:F${detailsTop}`);
  const dh = cell(`B${detailsTop}`);
  dh.value = "DÉTAILS DE L'OPÉRATION";
  dh.font = font({ size: 9, bold: true, color: { argb: COLORS.ink } });
  dh.fill = fill(COLORS.surface);
  dh.alignment = { indent: 1, vertical: "middle" };
  ws.getRow(detailsTop).height = 20;

  const service = SERVICE_LABELS[q.serviceType];
  const op = OPERATION_LABELS[q.operationType];
  const measures = [
    q.weightKg ? `${q.weightKg.toLocaleString("fr-FR")} kg` : null,
    q.volumeCbm ? `${q.volumeCbm.toLocaleString("fr-FR")} m³` : null,
    q.packageCount ? `${q.packageCount} colis` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const details: [string, string, string, string][] = [
    ["Service", `${service} — ${op}`, "Point de passage", homeHub(q.serviceType)],
    [
      "Provenance",
      `${q.originCity}, ${q.originCountry}`,
      "Destination",
      `${q.destCity}, ${q.destCountry}`,
    ],
    ["Marchandise", q.cargoNature, "Poids / volume", measures || "—"],
    ["Description", q.cargoDescription ?? "—", "N° conteneur", q.containerNumber ?? "—"],
  ];
  details.forEach(([l1, v1, l2, v2], i) => {
    const row = detailsTop + 1 + i;
    ws.getRow(row).height = 18;
    const a = cell(`B${row}`);
    a.value = {
      richText: [
        { text: `${l1}  `, font: font({ size: 9, color: { argb: COLORS.muted } }) },
        { text: v1, font: font() },
      ],
    };
    ws.mergeCells(`C${row}:D${row}`);
    ws.mergeCells(`E${row}:F${row}`);
    const b = cell(`E${row}`);
    b.value = {
      richText: [
        { text: `${l2}  `, font: font({ size: 9, color: { argb: COLORS.muted } }) },
        { text: v2, font: font() },
      ],
    };
    for (const ref of [`B${row}`, `E${row}`]) cell(ref).border = bottomBorder();
    cell(`C${row}`).border = bottomBorder();
  });

  // ── Tableau des prestations ──
  const headerRow = detailsTop + 6;
  const headers = ["Désignation", "Type", "Qté", "Prix unitaire", "Montant"];
  headers.forEach((text, i) => {
    const c = ws.getRow(headerRow).getCell(2 + i);
    c.value = text;
    c.font = font({ bold: true, color: { argb: COLORS.white } });
    c.fill = fill(COLORS.ink);
    c.alignment = {
      horizontal: i === 0 ? "left" : i === 1 ? "center" : "right",
      vertical: "middle",
      indent: i === 0 ? 1 : 0,
    };
    c.border = border(COLORS.ink);
  });
  ws.getRow(headerRow).height = 22;

  const lines = [...defaultLines(q), ...Array.from({ length: EXTRA_LINES }, () => null)];
  const first = headerRow + 1;
  const last = first + lines.length - 1;

  lines.forEach((line, i) => {
    const r = first + i;
    const row = ws.getRow(r);
    row.height = 20;
    const zebra = i % 2 === 1 ? COLORS.surface : COLORS.white;

    const designation = row.getCell(2);
    designation.value = line?.label ?? "";
    designation.alignment = { indent: 1, vertical: "middle", wrapText: true };

    const type = row.getCell(3);
    type.value = line?.type ?? "Prestation";
    type.alignment = { horizontal: "center", vertical: "middle" };
    type.dataValidation = { type: "list", allowBlank: false, formulae: ['"Prestation,Débours"'] };

    const qty = row.getCell(4);
    qty.value = line ? 1 : null;
    qty.alignment = { horizontal: "right", vertical: "middle" };
    qty.numFmt = "0.##";

    const unit = row.getCell(5);
    unit.numFmt = FCFA;
    unit.alignment = { horizontal: "right", vertical: "middle" };

    const amount = row.getCell(6);
    amount.value = { formula: `IF(OR(D${r}="",E${r}=""),"",D${r}*E${r})` };
    amount.numFmt = FCFA;
    amount.alignment = { horizontal: "right", vertical: "middle" };
    amount.font = font({ bold: true });

    for (let col = 2; col <= 6; col++) {
      const c = row.getCell(col);
      c.border = border();
      c.font = { ...font(), ...(col === 6 ? { bold: true } : {}) };
      // Cellules à saisir (désignation libre, quantité, prix) surlignées
      c.fill = fill(col === 5 || (!line && col <= 4) ? COLORS.input : zebra);
    }
  });
  cell(`E${first}`).note =
    "Saisissez le prix unitaire en FCFA : le montant et les totaux se calculent automatiquement.";

  // ── Totaux ──
  const range = (col: string) => `${col}${first}:${col}${last}`;
  let r = last + 2;
  const totalRow = (
    text: string,
    formula: string,
    options: { strong?: boolean; rateCell?: boolean } = {},
  ) => {
    const row = ws.getRow(r);
    row.height = options.strong ? 26 : 20;
    ws.mergeCells(`C${r}:E${r}`);
    const l = cell(`C${r}`);
    l.value = text;
    l.alignment = { horizontal: "right", vertical: "middle" };
    const v = cell(`F${r}`);
    v.value = { formula };
    v.numFmt = FCFA;
    v.alignment = { horizontal: "right", vertical: "middle" };
    if (options.strong) {
      for (const ref of [`C${r}`, `F${r}`]) cell(ref).fill = fill(COLORS.ink);
      l.font = font({ size: 11, bold: true, color: { argb: COLORS.white } });
      v.font = font({ size: 12, bold: true, color: { argb: COLORS.gold } });
    } else {
      l.font = font({ color: { argb: COLORS.muted } });
      v.font = font({ bold: true });
      v.border = bottomBorder();
    }
    return r++;
  };

  const htRow = totalRow("Total prestations HT", `SUMIF(${range("C")},"Prestation",${range("F")})`);
  // Taux de TVA modifiable (colonne B de la même ligne) — à valider selon les prestations
  const vatRow = totalRow("TVA sur prestations", `ROUND(F${htRow}*B${r},0)`);
  const vatRate = cell(`B${vatRow}`);
  vatRate.value = DEFAULT_VAT;
  vatRate.numFmt = '"Taux de TVA : "0%';
  vatRate.alignment = { horizontal: "right", vertical: "middle" };
  vatRate.font = font({ size: 9, color: { argb: COLORS.muted } });
  vatRate.fill = fill(COLORS.input);
  vatRate.note =
    "Taux de TVA modifiable. À vérifier selon la nature des prestations (les débours ne sont pas soumis à la TVA).";
  const deboursRow = totalRow(
    "Débours (refacturés à l'identique)",
    `SUMIF(${range("C")},"Débours",${range("F")})`,
  );
  totalRow("TOTAL À PAYER", `F${htRow}+F${vatRow}+F${deboursRow}`, { strong: true });

  // ── Conditions ──
  r += 1;
  label(`B${r}`, "CONDITIONS");
  r += 1;
  const conditions = [
    `Devis valable ${VALIDITY_DAYS} jours à compter de sa date d'émission. Montants exprimés en francs CFA (XAF).`,
    "Les débours (droits et taxes de douane, frais portuaires ou aéroportuaires réglementaires) sont refacturés à l'identique sur justificatifs.",
    "Tarifs établis sur la base des informations transmises ; les frais réels (magasinage, surestaries, contrôles) peuvent entraîner un ajustement.",
    `Intervention de ${company.name} ${q.serviceType === "AERIEN" ? "à l'aéroport" : "au port"} de ${HOME_CITY} ; le transport international reste à la charge du client ou de son fournisseur.`,
  ];
  for (const text of conditions) {
    ws.mergeCells(`B${r}:F${r}`);
    const c = cell(`B${r}`);
    c.value = `•  ${text}`;
    c.font = font({ size: 9, color: { argb: COLORS.muted } });
    c.alignment = { wrapText: true, vertical: "top" };
    ws.getRow(r).height = text.length > 105 ? 26 : 15;
    r++;
  }
  ws.mergeCells(`B${r}:F${r}`);
  const payment = cell(`B${r}`);
  payment.value = "•  Conditions de paiement : à préciser";
  payment.font = font({ size: 9 });
  payment.fill = fill(COLORS.input);
  payment.note = "Précisez les modalités (acompte, délai, moyen de paiement) avant l'envoi.";
  ws.getRow(r).height = 20;

  // ── Signatures ──
  r += 2;
  label(`B${r}`, "BON POUR ACCORD — LE CLIENT");
  label(`E${r}`, `POUR ${company.name}`);
  r += 1;
  const signTop = r;
  ws.mergeCells(`B${signTop}:C${signTop + 3}`);
  ws.mergeCells(`E${signTop}:F${signTop + 3}`);
  for (const ref of [`B${signTop}`, `E${signTop}`]) {
    const c = cell(ref);
    c.value = ref.startsWith("B") ? "Date, signature et cachet :" : "Le responsable :";
    c.font = font({ size: 8.5, italic: true, color: { argb: COLORS.muted } });
    c.alignment = { vertical: "top", indent: 1 };
    c.border = border();
  }
  for (let i = 0; i < 4; i++) ws.getRow(signTop + i).height = 18;
  r = signTop + 5;

  // ── Pied de page ──
  ws.mergeCells(`B${r}:F${r}`);
  const footer = cell(`B${r}`);
  footer.value = `${company.legalName} (${company.name} ${company.legalForm}) · ${company.address.locality}, ${company.address.countryName} · ${company.phoneDisplay} · ${company.email}`;
  footer.font = font({ size: 8, color: { argb: COLORS.muted } });
  footer.alignment = { horizontal: "center" };
  footer.border = { top: { style: "thin", color: { argb: COLORS.gold } } };

  ws.pageSetup.printArea = `A1:G${r}`;
  return Buffer.from(await wb.xlsx.writeBuffer());
}
