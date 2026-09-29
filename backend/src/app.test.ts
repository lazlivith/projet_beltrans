import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./services/quote.service", () => {
  let seq = 0;
  return {
    createQuoteRequest: vi.fn(async (data: Record<string, unknown>) => ({
      ...data,
      id: "test",
      reference: `BLT-2026-${String(++seq).padStart(6, "0")}`,
    })),
  };
});
vi.mock("./services/notifications", () => ({
  dispatchQuoteNotifications: vi.fn(async () => undefined),
}));

const { createApp } = await import("./app");
const { resetMemoryRateLimit } = await import("./middleware/rate-limit");
const { createQuoteRequest } = await import("./services/quote.service");

const app = createApp();

const valid = {
  serviceType: "AERIEN",
  operationType: "EXPORT",
  originCountry: "République du Congo",
  originCity: "Brazzaville",
  destCountry: "France",
  destCity: "Paris",
  cargoNature: "Autre",
  containerNumber: "MSCU1234567",
  firstName: "Jean",
  lastName: "Mabiala",
  email: "jean@example.com",
  phone: "06 603 06 53",
  consent: true,
};

describe("API devis", () => {
  beforeEach(() => resetMemoryRateLimit());

  it("GET /health répond ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("rejette un JSON invalide (400)", async () => {
    const res = await request(app)
      .post("/api/v1/quotes")
      .set("Content-Type", "application/json")
      .send("{oops");
    expect(res.status).toBe(400);
  });

  it("renvoie les erreurs par champ (422)", async () => {
    const res = await request(app)
      .post("/api/v1/quotes")
      .send({ ...valid, phone: "12" });
    expect(res.status).toBe(422);
    expect(res.body.fieldErrors.phone).toBeDefined();
  });

  it("refuse le honeypot", async () => {
    const res = await request(app)
      .post("/api/v1/quotes")
      .send({ ...valid, website: "x" });
    expect(res.status).toBe(422);
  });

  it("crée le devis (201) avec données normalisées", async () => {
    const res = await request(app).post("/api/v1/quotes").send(valid);
    expect(res.status).toBe(201);
    expect(res.body.reference).toMatch(/^BLT-\d{4}-\d{6}$/);
    expect(res.body.whatsappUrl).toContain("wa.me/242066030653");
    const saved = vi.mocked(createQuoteRequest).mock.calls.at(-1)?.[0];
    expect(saved?.phone).toBe("+242066030653");
    expect(saved?.containerNumber).toBeUndefined(); // hors maritime
    expect(saved).not.toHaveProperty("consent");
  });

  it("limite à 3 soumissions par heure (429)", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await request(app).post("/api/v1/quotes").send(valid)).status).toBe(201);
    }
    const res = await request(app).post("/api/v1/quotes").send(valid);
    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBeDefined();
  });

  it("autorise l'origine du frontend (CORS)", async () => {
    const res = await request(app).get("/health").set("Origin", "http://localhost:3000");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("répond 404 en JSON sur une route inconnue", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
  });
});
