import ExcelJS from "exceljs";
import type { QuoteRequest } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildQuoteTemplate, defaultLines, quoteTemplateFilename } from "./quote-template";
import { buildQuotesExport } from "./quotes-export";

const quote = (overrides: Partial<QuoteRequest> = {}): QuoteRequest => ({
  id: "q1",
  reference: "BLT-2026-000012",
  firstName: "Céline",
  lastName: "Mavoungou",
  companyName: "Congo Agro Services",
  email: "celine@example.com",
  phone: "+242060000011",
  whatsapp: null,
  serviceType: "MARITIME",
  operationType: "IMPORT",
  originCountry: "Brésil",
  originCity: "Santos",
  destCountry: "République du Congo",
  destCity: "Pointe-Noire",
  cargoNature: "Denrées périssables / sous température dirigée",
  cargoDescription: "Viande congelée",
  weightKg: 26000,
  volumeCbm: 67,
  packageCount: 1800,
  containerNumber: "MRKU7736120",
  targetDate: null,
  isUrgent: true,
  additionalNotes: null,
  consentAt: new Date("2026-09-01T08:00:00Z"),
  status: "QUOTED",
  createdAt: new Date("2026-09-01T08:00:00Z"),
  updatedAt: new Date("2026-09-02T08:00:00Z"),
  internalNotes: "NOTE CONFIDENTIELLE — marge 12 %",
  reviewedAt: new Date("2026-09-01T10:00:00Z"),
  quotedAt: new Date("2026-09-02T08:00:00Z"),
  anonymizedAt: null,
  ...overrides,
});

async function read(buffer: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return wb;
}

function allText(ws: ExcelJS.Worksheet) {
  const parts: string[] = [];
  ws.eachRow((row) =>
    row.eachCell((cell) => {
      const v = cell.value as { richText?: { text: string }[] } | string | number | null;
      if (v && typeof v === "object" && "richText" in v && v.richText)
        parts.push(v.richText.map((t) => t.text).join(""));
      else if (v !== null && v !== undefined)
        parts.push(String(typeof v === "object" ? JSON.stringify(v) : v));
    }),
  );
  return parts.join("\n");
}

describe("modèle de devis (client)", () => {
  it("pré-remplit client, référence et opération", async () => {
    const ws = (await read(await buildQuoteTemplate(quote()))).getWorksheet("Devis")!;
    const text = allText(ws);
    expect(text).toContain("PROPOSITION DE DEVIS");
    expect(text).toContain("Céline Mavoungou");
    expect(text).toContain("Congo Agro Services");
    expect(text).toContain("BLT-2026-000012");
    expect(text).toContain("Santos, Brésil");
    expect(text).toContain("Port de Pointe-Noire");
    expect(text).toContain("MRKU7736120");
  });

  it("n'expose jamais les notes internes au client", async () => {
    const ws = (await read(await buildQuoteTemplate(quote()))).getWorksheet("Devis")!;
    expect(allText(ws)).not.toContain("CONFIDENTIELLE");
  });

  it("calcule montants et totaux par formules (prestations, TVA, débours)", async () => {
    const ws = (await read(await buildQuoteTemplate(quote()))).getWorksheet("Devis")!;
    const formulas: string[] = [];
    ws.eachRow((row) => row.eachCell((c) => c.formula && formulas.push(c.formula)));
    expect(formulas.some((f) => /^IF\(OR\(D\d+="",E\d+=""\),"",D\d+\*E\d+\)$/.test(f))).toBe(true);
    expect(formulas.some((f) => f.startsWith("SUMIF(") && f.includes('"Prestation"'))).toBe(true);
    expect(formulas.some((f) => f.startsWith("SUMIF(") && f.includes('"Débours"'))).toBe(true);
    expect(formulas.some((f) => /^ROUND\(F\d+\*B\d+,0\)$/.test(f))).toBe(true);
    expect(formulas.some((f) => /^E12\+30$/.test(f))).toBe(true);
  });

  it("adapte les lignes au service et au sens de l'opération", () => {
    expect(
      defaultLines({ serviceType: "MARITIME", operationType: "IMPORT" }).map((l) => l.label),
    ).toContain("Sortie du port et mise à disposition");
    expect(
      defaultLines({ serviceType: "MARITIME", operationType: "EXPORT" }).map((l) => l.label),
    ).toContain("Mise à bord");
    expect(
      defaultLines({ serviceType: "AERIEN", operationType: "IMPORT" }).map((l) => l.label),
    ).toContain("Réception du fret à l'aéroport de Pointe-Noire");
    expect(
      defaultLines({ serviceType: "DEDOUANEMENT", operationType: "EXPORT" }).some(
        (l) => l.type === "Débours",
      ),
    ).toBe(true);
  });

  it("nomme le fichier avec la référence et le client (sans accents)", () => {
    expect(quoteTemplateFilename(quote({ lastName: "N'Goma Élégant" }))).toBe(
      "Devis-BLT-2026-000012-N-Goma-Elegant.xlsx",
    );
    expect(quoteTemplateFilename(quote({ anonymizedAt: new Date() }))).toBe(
      "Devis-BLT-2026-000012.xlsx",
    );
  });
});

describe("export de suivi (interne)", () => {
  it("crée une feuille filtrable et une synthèse", async () => {
    const wb = await read(
      await buildQuotesExport(
        [
          quote(),
          quote({ id: "q2", reference: "BLT-2026-000013", status: "PENDING", isUrgent: false }),
        ],
        "Toutes les demandes",
      ),
    );
    const ws = wb.getWorksheet("Demandes")!;
    expect(ws.getRow(5).getCell(1).value).toBe("Référence");
    expect(ws.getRow(6).getCell(1).value).toBe("BLT-2026-000012");
    expect(ws.getRow(6).getCell(3).value).toBe("Devis envoyé");
    expect(ws.getRow(6).getCell(2).value).toBeInstanceOf(Date); // vraie date Excel
    expect(ws.autoFilter).toBeTruthy();
    expect(ws.views[0]).toMatchObject({ state: "frozen", ySplit: 5 });
    expect(allText(ws)).toContain("NOTE CONFIDENTIELLE"); // usage interne : notes incluses

    const summary = wb.getWorksheet("Synthèse")!;
    expect(allText(summary)).toContain("Synthèse — 2 demandes");
  });

  it("calcule les délais de traitement en heures", async () => {
    const ws = (await read(await buildQuotesExport([quote()], "x"))).getWorksheet("Demandes")!;
    const header = ws.getRow(5);
    const col = (name: string) => {
      let index = 0;
      header.eachCell((c, i) => c.value === name && (index = i));
      return index;
    };
    expect(ws.getRow(6).getCell(col("Délai prise en charge (h)")).value).toBe(2);
    expect(ws.getRow(6).getCell(col("Délai envoi devis (h)")).value).toBe(24);
  });
});
