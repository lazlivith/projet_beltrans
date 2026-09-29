import { describe, expect, it } from "vitest";
import { computeStats, weekStart } from "./admin-quotes.service";
import { retentionCutoff } from "./retention.service";

const d = (iso: string) => new Date(iso);

describe("weekStart", () => {
  it("renvoie le lundi de la semaine (heure de Pointe-Noire)", () => {
    expect(weekStart(d("2026-09-24T10:00:00Z"))).toBe("2026-09-21"); // jeudi → lundi
    expect(weekStart(d("2026-09-21T00:30:00Z"))).toBe("2026-09-21"); // lundi
    // Dimanche 23h30 UTC = lundi 00h30 à Pointe-Noire
    expect(weekStart(d("2026-09-27T23:30:00Z"))).toBe("2026-09-28");
  });
});

describe("computeStats", () => {
  const rows = [
    {
      status: "QUOTED" as const,
      serviceType: "MARITIME",
      isUrgent: true,
      createdAt: d("2026-09-01T08:00:00Z"),
      reviewedAt: d("2026-09-01T10:00:00Z"), // +2 h
      quotedAt: d("2026-09-02T08:00:00Z"), // +24 h
    },
    {
      status: "UNDER_REVIEW" as const,
      serviceType: "AERIEN",
      isUrgent: false,
      createdAt: d("2026-09-02T08:00:00Z"),
      reviewedAt: d("2026-09-02T12:00:00Z"), // +4 h
      quotedAt: null,
    },
    {
      status: "PENDING" as const,
      serviceType: "MARITIME",
      isUrgent: false,
      createdAt: d("2026-09-16T08:00:00Z"),
      reviewedAt: null,
      quotedAt: null,
    },
  ];

  it("calcule volumes, taux de devis et délais moyens", () => {
    const stats = computeStats(rows);
    expect(stats.total).toBe(3);
    expect(stats.urgent).toBe(1);
    expect(stats.byStatus).toEqual({
      PENDING: 1,
      UNDER_REVIEW: 1,
      QUOTED: 1,
      REJECTED: 0,
      ARCHIVED: 0,
    });
    expect(stats.byService).toEqual({ MARITIME: 2, AERIEN: 1 });
    expect(stats.quotedRate).toBeCloseTo(1 / 3);
    expect(stats.avgReviewHours).toBe(3);
    expect(stats.avgQuoteHours).toBe(24);
  });

  it("produit des semaines continues, y compris sans demande", () => {
    expect(computeStats(rows).weekly).toEqual([
      { week: "2026-08-31", count: 2 },
      { week: "2026-09-07", count: 0 },
      { week: "2026-09-14", count: 1 },
    ]);
  });

  it("gère une période vide", () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.quotedRate).toBeNull();
    expect(stats.avgQuoteHours).toBeNull();
    expect(stats.weekly).toEqual([]);
  });
});

describe("rétention", () => {
  it("fixe la limite à 3 ans avant la date du jour", () => {
    expect(retentionCutoff(d("2026-09-24T00:00:00Z")).toISOString()).toBe(
      "2023-09-24T00:00:00.000Z",
    );
  });
});
