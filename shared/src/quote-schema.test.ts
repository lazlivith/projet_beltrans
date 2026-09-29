import { describe, expect, it } from "vitest";
import { formatQuoteReference, QUOTE_REFERENCE_PATTERN } from "./reference";
import { quoteApiSchema, quoteFormSchema } from "./quote-schema";

const valid = {
  serviceType: "MARITIME",
  operationType: "IMPORT",
  isUrgent: false,
  originCountry: "Chine",
  originCity: "Shanghai",
  destCountry: "République du Congo",
  destCity: "Pointe-Noire",
  targetDate: "",
  cargoNature: "Marchandises générales",
  cargoDescription: "",
  weightKg: "12500",
  volumeCbm: "",
  packageCount: "40",
  containerNumber: "mscu 123456-7",
  firstName: "Jean",
  lastName: "Mabiala",
  companyName: "",
  email: "Jean.Mabiala@Example.com ",
  phone: "06 603 06 53",
  whatsapp: "",
  additionalNotes: "",
  consent: true,
};

describe("formatQuoteReference", () => {
  it("produit le format BLT-YYYY-XXXXXX", () => {
    expect(formatQuoteReference(2026, 1042)).toBe("BLT-2026-001042");
    expect(formatQuoteReference(2026, 1042)).toMatch(QUOTE_REFERENCE_PATTERN);
  });

  it("refuse une séquence hors limites", () => {
    expect(() => formatQuoteReference(2026, 0)).toThrow(RangeError);
    expect(() => formatQuoteReference(2026, 1_000_000)).toThrow(RangeError);
  });
});

describe("quoteFormSchema", () => {
  it("normalise téléphone (E.164), e-mail, nombres et conteneur", () => {
    const out = quoteFormSchema.parse(valid);
    expect(out.phone).toBe("+242066030653");
    expect(out.email).toBe("jean.mabiala@example.com");
    expect(out.weightKg).toBe(12500);
    expect(out.packageCount).toBe(40);
    expect(out.volumeCbm).toBeUndefined();
    expect(out.containerNumber).toBe("MSCU1234567");
    expect(out.companyName).toBeUndefined();
  });

  it("ignore le numéro de conteneur hors maritime", () => {
    const out = quoteFormSchema.parse({ ...valid, serviceType: "AERIEN" });
    expect(out.containerNumber).toBeUndefined();
  });

  it("rejette un téléphone invalide", () => {
    const res = quoteFormSchema.safeParse({ ...valid, phone: "123" });
    expect(res.success).toBe(false);
    expect(res.error?.flatten().fieldErrors.phone).toBeDefined();
  });

  it("rejette un conteneur au mauvais format", () => {
    const res = quoteFormSchema.safeParse({ ...valid, containerNumber: "ABC123" });
    expect(res.error?.flatten().fieldErrors.containerNumber).toBeDefined();
  });

  it("exige le consentement", () => {
    const res = quoteFormSchema.safeParse({ ...valid, consent: false });
    expect(res.error?.flatten().fieldErrors.consent).toBeDefined();
  });

  it("rejette une date passée", () => {
    const res = quoteFormSchema.safeParse({ ...valid, targetDate: "2020-01-01" });
    expect(res.error?.flatten().fieldErrors.targetDate).toBeDefined();
  });

  it("accepte un numéro international", () => {
    const out = quoteFormSchema.parse({ ...valid, whatsapp: "+33 6 12 34 56 78" });
    expect(out.whatsapp).toBe("+33612345678");
  });
});

describe("périmètre Pointe-Noire", () => {
  it("impose Pointe-Noire comme arrivée à l'import", () => {
    const out = quoteFormSchema.parse({ ...valid, destCountry: "Gabon", destCity: "Libreville" });
    expect(out.destCountry).toBe("République du Congo");
    expect(out.destCity).toBe("Pointe-Noire");
    expect(out.originCountry).toBe("Chine");
  });

  it("impose Pointe-Noire comme départ à l'export", () => {
    const out = quoteFormSchema.parse({
      ...valid,
      operationType: "EXPORT",
      originCountry: "Gabon",
      originCity: "Libreville",
      destCountry: "France",
      destCity: "Le Havre",
    });
    expect(out.originCountry).toBe("République du Congo");
    expect(out.originCity).toBe("Pointe-Noire");
    expect(out.destCountry).toBe("France");
  });

  it("refuse les opérations et services hors périmètre", () => {
    expect(quoteFormSchema.safeParse({ ...valid, operationType: "TRANSIT" }).success).toBe(false);
    expect(quoteFormSchema.safeParse({ ...valid, serviceType: "TERRESTRE" }).success).toBe(false);
    expect(quoteFormSchema.safeParse({ ...valid, serviceType: "MULTIMODAL" }).success).toBe(false);
  });
});

describe("quoteApiSchema", () => {
  it("rejette un honeypot rempli", () => {
    expect(quoteApiSchema.safeParse({ ...valid, website: "spam" }).success).toBe(false);
  });
});
