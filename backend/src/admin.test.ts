import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const VALID_TOKEN = "session-valide";

vi.mock("./services/auth.service", () => ({
  login: vi.fn(async (email: string, password: string) =>
    email === "admin@beltrans.com" && password === "Bon-mot-de-passe-1"
      ? { token: VALID_TOKEN, expiresAt: new Date(Date.now() + 3_600_000), email }
      : null,
  ),
  logout: vi.fn(async () => undefined),
  getSessionAdmin: vi.fn(async (token: string) =>
    token === VALID_TOKEN ? { id: "admin-1", email: "admin@beltrans.com" } : null,
  ),
}));

vi.mock("./services/admin-quotes.service", () => ({
  listQuotes: vi.fn(async (_f: unknown, page: number, pageSize: number) => ({
    items: [],
    total: 0,
    page,
    pageSize,
  })),
  getQuote: vi.fn(async (id: string) =>
    id === "q1"
      ? {
          id: "q1",
          reference: "BLT-2026-000001",
          firstName: "Jean",
          lastName: "Mabiala",
          companyName: null,
          email: "jean@example.com",
          phone: "+242060000010",
          whatsapp: null,
          serviceType: "MARITIME",
          operationType: "IMPORT",
          originCountry: "Chine",
          originCity: "Shanghai",
          destCountry: "République du Congo",
          destCity: "Pointe-Noire",
          cargoNature: "Marchandises générales",
          cargoDescription: null,
          weightKg: null,
          volumeCbm: null,
          packageCount: null,
          containerNumber: null,
          createdAt: new Date("2026-09-01T08:00:00Z"),
          anonymizedAt: null,
        }
      : null,
  ),
  updateQuote: vi.fn(async (id: string, patch: object) =>
    id === "q1" ? { id: "q1", reference: "BLT-2026-000001", ...patch } : null,
  ),
  getStats: vi.fn(async () => ({ total: 0 })),
  listQuotesForExport: vi.fn(async () => []),
  describeFilters: vi.fn(() => "Toutes les demandes"),
}));

const { createApp } = await import("./app");
const { resetMemoryRateLimit } = await import("./middleware/rate-limit");
const { listQuotes } = await import("./services/admin-quotes.service");

const app = createApp();
const ORIGIN = "http://localhost:3000";
const cookie = `beltrans_admin=${VALID_TOKEN}`;

describe("API admin — authentification", () => {
  beforeEach(() => resetMemoryRateLimit());

  it("refuse l'accès sans session (401)", async () => {
    const res = await request(app).get("/api/v1/admin/quotes");
    expect(res.status).toBe(401);
  });

  it("refuse une session invalide (401)", async () => {
    const res = await request(app).get("/api/v1/admin/quotes").set("Cookie", "beltrans_admin=faux");
    expect(res.status).toBe(401);
  });

  it("connecte avec un cookie httpOnly limité aux routes admin", async () => {
    const res = await request(app)
      .post("/api/v1/admin/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "Admin@Beltrans.com", password: "Bon-mot-de-passe-1" });
    expect(res.status).toBe(200);
    const setCookie = String(res.headers["set-cookie"]);
    expect(setCookie).toContain(`beltrans_admin=${VALID_TOKEN}`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Path=/api/v1/admin");
  });

  it("répond de façon identique à un mauvais mot de passe (401)", async () => {
    const res = await request(app)
      .post("/api/v1/admin/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "admin@beltrans.com", password: "mauvais" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("E-mail ou mot de passe incorrect.");
  });

  it("bloque la force brute après 5 tentatives (429)", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/v1/admin/auth/login")
        .set("Origin", ORIGIN)
        .send({ email: "admin@beltrans.com", password: "mauvais" });
    }
    const res = await request(app)
      .post("/api/v1/admin/auth/login")
      .set("Origin", ORIGIN)
      .send({ email: "admin@beltrans.com", password: "Bon-mot-de-passe-1" });
    expect(res.status).toBe(429);
  });

  it("rejette une modification venant d'une origine inconnue (CSRF, 403)", async () => {
    const res = await request(app)
      .patch("/api/v1/admin/quotes/q1")
      .set("Cookie", cookie)
      .set("Origin", "https://site-malveillant.example")
      .send({ status: "QUOTED" });
    expect(res.status).toBe(403);
  });
});

describe("API admin — devis", () => {
  it("liste avec filtres validés et en-tête no-store", async () => {
    const res = await request(app)
      .get("/api/v1/admin/quotes?status=PENDING&q=BLT&page=2&pageSize=10")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(vi.mocked(listQuotes)).toHaveBeenLastCalledWith({ status: "PENDING", q: "BLT" }, 2, 10);
  });

  it("rejette un filtre invalide (422)", async () => {
    const res = await request(app).get("/api/v1/admin/quotes?status=INCONNU").set("Cookie", cookie);
    expect(res.status).toBe(422);
  });

  it("met à jour le statut d'un devis", async () => {
    const res = await request(app)
      .patch("/api/v1/admin/quotes/q1")
      .set("Cookie", cookie)
      .set("Origin", ORIGIN)
      .send({ status: "QUOTED", internalNotes: "Envoyé par e-mail" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("QUOTED");
  });

  it("rejette une modification vide ou invalide (422) et un devis inconnu (404)", async () => {
    const base = () =>
      request(app).patch("/api/v1/admin/quotes/q1").set("Cookie", cookie).set("Origin", ORIGIN);
    expect((await base().send({})).status).toBe(422);
    expect((await base().send({ status: "PAYE" })).status).toBe(422);
    const res = await request(app)
      .patch("/api/v1/admin/quotes/inconnu")
      .set("Cookie", cookie)
      .set("Origin", ORIGIN)
      .send({ status: "QUOTED" });
    expect(res.status).toBe(404);
  });

  it("exporte le suivi en Excel (.xlsx) téléchargeable", async () => {
    const res = await request(app).get("/api/v1/admin/quotes/export.xlsx").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("spreadsheetml.sheet");
    expect(res.headers["content-disposition"]).toMatch(
      /attachment; filename="Suivi-devis-BELTRANS-/,
    );
  });

  it("génère le modèle de devis Excel d'une demande", async () => {
    const res = await request(app)
      .get("/api/v1/admin/quotes/q1/devis.xlsx")
      .set("Cookie", cookie)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on("data", (c: Buffer) => chunks.push(c));
        r.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("Devis-BLT-2026-000001");
    expect((res.body as Buffer).subarray(0, 2).toString()).toBe("PK"); // archive xlsx valide
  });

  it("répond 404 pour le modèle d'un devis inconnu", async () => {
    const res = await request(app)
      .get("/api/v1/admin/quotes/inconnu/devis.xlsx")
      .set("Cookie", cookie);
    expect(res.status).toBe(404);
  });
});
