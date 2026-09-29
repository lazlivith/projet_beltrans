import { Router } from "express";
import { prisma } from "../lib/prisma";

export const healthRouter = Router();

/** Liveness : le process répond. */
healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

/** Readiness : la base de données est joignable. */
healthRouter.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "up" });
  } catch {
    res.status(503).json({ status: "error", database: "down" });
  }
});
