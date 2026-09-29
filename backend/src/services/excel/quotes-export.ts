import ExcelJS from "exceljs";
import type { QuoteRequest } from "@prisma/client";
import {
  company,
  OPERATION_LABELS,
  QUOTE_STATUSES,
  SERVICE_LABELS,
  STATUS_LABELS,
  type QuoteStatusValue,
} from "@beltrans/shared";
import { addLogo, border, COLORS, DATETIME, fill, font, toLocalExcelDate } from "./theme";

/** Couleurs de statut (fond clair + texte foncé : lisible à l'écran et à l'impression). */
const STATUS_STYLE: Record<QuoteStatusValue, { bg: string; fg: string }> = {
  PENDING: { bg: "FFFBF0D0", fg: "FF7A5A12" },
  UNDER_REVIEW: { bg: "FFE3EBFB", fg: "FF0D3FA6" },
  QUOTED: { bg: "FFDDF3E6", fg: "FF1F7A45" },
  REJECTED: { bg: "FFFBE3E1", fg: "FFB42318" },
  ARCHIVED: { bg: "FFEEF0F4", fg: "FF4A5572" },
};

const hoursBetween = (from: Date, to: Date | null) =>
  to ? Math.round(((to.getTime() - from.getTime()) / 3_600_000) * 10) / 10 : null;

type Column = {
  header: string;
  width: number;
  value: (q: QuoteRequest) => ExcelJS.CellValue;
  numFmt?: string;
  align?: "left" | "center" | "right";
};

const COLUMNS: Column[] = [
  { header: "Référence", width: 17, value: (q) => q.reference },
  {
    header: "Date de la demande",
    width: 17,
    value: (q) => toLocalExcelDate(q.createdAt),
    numFmt: DATETIME,
  },
  { header: "Statut", width: 16, value: (q) => STATUS_LABELS[q.status], align: "center" },
  { header: "Urgent", width: 8, value: (q) => (q.isUrgent ? "Oui" : ""), align: "center" },
  { header: "Service", width: 16, value: (q) => SERVICE_LABELS[q.serviceType] },
  { header: "Opération", width: 10, value: (q) => OPERATION_LABELS[q.operationType] },
  { header: "Prénom", width: 14, value: (q) => q.firstName },
  { header: "Nom", width: 16, value: (q) => q.lastName },
  { header: "Société", width: 24, value: (q) => q.companyName },
  {
    header: "E-mail",
    width: 30,
    value: (q) => (q.email ? { text: q.email, hyperlink: `mailto:${q.email}` } : ""),
  },
  { header: "Téléphone", width: 16, value: (q) => q.phone },
  { header: "WhatsApp", width: 16, value: (q) => q.whatsapp },
  { header: "Origine", width: 24, value: (q) => `${q.originCity}, ${q.originCountry}` },
  { header: "Destination", width: 24, value: (q) => `${q.destCity}, ${q.destCountry}` },
  { header: "Marchandise", width: 28, value: (q) => q.cargoNature },
  { header: "Description", width: 34, value: (q) => q.cargoDescription },
  { header: "Poids (kg)", width: 11, value: (q) => q.weightKg, numFmt: "#,##0", align: "right" },
  {
    header: "Volume (m³)",
    width: 11,
    value: (q) => q.volumeCbm,
    numFmt: "#,##0.0",
    align: "right",
  },
  { header: "Colis", width: 8, value: (q) => q.packageCount, numFmt: "#,##0", align: "right" },
  { header: "N° conteneur", width: 15, value: (q) => q.containerNumber },
  {
    header: "Prise en charge",
    width: 17,
    value: (q) => toLocalExcelDate(q.reviewedAt),
    numFmt: DATETIME,
  },
  {
    header: "Devis envoyé",
    width: 17,
    value: (q) => toLocalExcelDate(q.quotedAt),
    numFmt: DATETIME,
  },
  {
    header: "Délai prise en charge (h)",
    width: 13,
    value: (q) => hoursBetween(q.createdAt, q.reviewedAt),
    numFmt: "0.0",
    align: "right",
  },
  {
    header: "Délai envoi devis (h)",
    width: 13,
    value: (q) => hoursBetween(q.createdAt, q.quotedAt),
    numFmt: "0.0",
    align: "right",
  },
  { header: "Notes internes", width: 70, value: (q) => q.internalNotes },
];

const TABLE_TOP = 5; // ligne des en-têtes

/**
 * Export de suivi (usage interne) : feuille « Demandes » filtrable + feuille « Synthèse ».
 */
export async function buildQuotesExport(
  quotes: QuoteRequest[],
  filtersLabel: string,
  generatedAt = new Date(),
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = company.name;
  wb.title = "Suivi des demandes de devis";
  wb.created = generatedAt;

  // ── Feuille « Demandes » ──
  const ws = wb.addWorksheet("Demandes", {
    views: [{ state: "frozen", xSplit: 1, ySplit: TABLE_TOP, showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    properties: { tabColor: { argb: COLORS.ink } },
  });
  ws.columns = COLUMNS.map((c) => ({ width: c.width }));

  const logo = addLogo(wb);
  if (logo !== null)
    ws.addImage(logo, { tl: { col: 0.1, row: 0.15 }, ext: { width: 125, height: 45 } });
  ws.getRow(1).height = 20;
  ws.getRow(2).height = 20;

  ws.mergeCells("C1:J1");
  const title = ws.getCell("C1");
  title.value = "Suivi des demandes de devis";
  title.font = font({ size: 15, bold: true });
  title.alignment = { vertical: "middle" };

  ws.mergeCells("C2:J2");
  const subtitle = ws.getCell("C2");
  const stamp = generatedAt.toLocaleString("fr-FR", {
    timeZone: "Africa/Brazzaville",
    dateStyle: "long",
    timeStyle: "short",
  });
  subtitle.value = `${quotes.length} demande${quotes.length > 1 ? "s" : ""} · ${filtersLabel} · export du ${stamp}`;
  subtitle.font = font({ size: 9, color: { argb: COLORS.muted } });

  // Liseré doré sous l'en-tête
  const accent = ws.getRow(3);
  accent.height = 4;
  for (let col = 1; col <= COLUMNS.length; col++) accent.getCell(col).fill = fill(COLORS.gold);

  const header = ws.getRow(TABLE_TOP);
  header.height = 32;
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = font({ bold: true, color: { argb: COLORS.white } });
    cell.fill = fill(COLORS.ink);
    cell.alignment = { vertical: "middle", horizontal: c.align ?? "left", wrapText: true };
    cell.border = border(COLORS.ink);
  });

  quotes.forEach((q, index) => {
    const row = ws.getRow(TABLE_TOP + 1 + index);
    row.height = 18;
    const zebra = index % 2 === 1 ? COLORS.surface : COLORS.white;
    COLUMNS.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      cell.value = c.value(q) ?? null;
      cell.font = font();
      cell.fill = fill(zebra);
      cell.border = { bottom: { style: "hair", color: { argb: COLORS.line } } };
      cell.alignment = { vertical: "middle", horizontal: c.align ?? "left" };
      if (c.numFmt) cell.numFmt = c.numFmt;
    });
    row.getCell(1).font = font({ bold: true, color: { argb: COLORS.brand } });
    const status = row.getCell(3);
    status.fill = fill(STATUS_STYLE[q.status].bg);
    status.font = font({ bold: true, color: { argb: STATUS_STYLE[q.status].fg } });
    if (q.isUrgent) {
      const urgent = row.getCell(4);
      urgent.fill = fill(COLORS.goldPale);
      urgent.font = font({ bold: true, color: { argb: COLORS.goldDeep } });
    }
    const email = row.getCell(10);
    if (q.email) email.font = font({ color: { argb: COLORS.brand }, underline: true });
  });

  if (quotes.length) {
    ws.autoFilter = {
      from: { row: TABLE_TOP, column: 1 },
      to: { row: TABLE_TOP + quotes.length, column: COLUMNS.length },
    };
  }

  // ── Feuille « Synthèse » ──
  const summary = wb.addWorksheet("Synthèse", {
    views: [{ showGridLines: false }],
    properties: { tabColor: { argb: COLORS.gold } },
  });
  summary.columns = [{ width: 2 }, { width: 30 }, { width: 14 }, { width: 14 }];

  let r = 2;
  const heading = (text: string) => {
    const cell = summary.getCell(`B${r}`);
    cell.value = text;
    cell.font = font({ size: r === 2 ? 15 : 11, bold: true });
    r += r === 2 ? 2 : 1;
  };
  const tableHeader = (labels: string[]) => {
    labels.forEach((text, i) => {
      const cell = summary.getRow(r).getCell(2 + i);
      cell.value = text;
      cell.font = font({ bold: true, color: { argb: COLORS.white } });
      cell.fill = fill(COLORS.ink);
      cell.alignment = { horizontal: i === 0 ? "left" : "right" };
    });
    r++;
  };
  const line = (labelText: string, count: number, style?: { bg: string; fg: string }) => {
    const row = summary.getRow(r);
    row.getCell(2).value = labelText;
    row.getCell(3).value = count;
    row.getCell(4).value = quotes.length ? count / quotes.length : 0;
    row.getCell(4).numFmt = "0%";
    for (let col = 2; col <= 4; col++) {
      const cell = row.getCell(col);
      cell.font = font(style && col === 2 ? { bold: true, color: { argb: style.fg } } : {});
      cell.border = { bottom: { style: "hair", color: { argb: COLORS.line } } };
      if (col > 2) cell.alignment = { horizontal: "right" };
    }
    if (style) row.getCell(2).fill = fill(style.bg);
    r++;
  };

  heading(`Synthèse — ${quotes.length} demande${quotes.length > 1 ? "s" : ""}`);
  heading("Par statut");
  tableHeader(["Statut", "Demandes", "Part"]);
  for (const s of QUOTE_STATUSES)
    line(STATUS_LABELS[s], quotes.filter((q) => q.status === s).length, STATUS_STYLE[s]);

  r++;
  heading("Par service");
  tableHeader(["Service", "Demandes", "Part"]);
  const services = [...new Set(quotes.map((q) => q.serviceType))];
  for (const s of services)
    line(SERVICE_LABELS[s], quotes.filter((q) => q.serviceType === s).length);

  r++;
  heading("Délais moyens");
  const avg = (values: (number | null)[]) => {
    const list = values.filter((v): v is number => v !== null);
    return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
  };
  const delays: [string, number | null][] = [
    ["Prise en charge (heures)", avg(quotes.map((q) => hoursBetween(q.createdAt, q.reviewedAt)))],
    ["Envoi du devis (heures)", avg(quotes.map((q) => hoursBetween(q.createdAt, q.quotedAt)))],
  ];
  for (const [text, value] of delays) {
    const row = summary.getRow(r);
    row.getCell(2).value = text;
    row.getCell(3).value = value === null ? "—" : Math.round(value * 10) / 10;
    row.getCell(3).numFmt = "0.0";
    row.getCell(3).alignment = { horizontal: "right" };
    for (const col of [2, 3]) row.getCell(col).font = font();
    r++;
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
