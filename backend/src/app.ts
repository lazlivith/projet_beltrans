import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { errorHandler, notFound } from "./middleware/error-handler";
import { adminRouter } from "./routes/admin";
import { healthRouter } from "./routes/health";
import { quotesRouter } from "./routes/quotes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // Nombre de proxys de confiance (Nginx, Cloudflare, Render…) pour obtenir la vraie IP client.
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      methods: ["GET", "POST", "PATCH"],
      allowedHeaders: ["Content-Type"],
      // Cookie de session admin (httpOnly) transmis par le frontend
      credentials: true,
      exposedHeaders: ["Content-Disposition"],
      maxAge: 86_400,
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url?.startsWith("/health") ?? false },
    }),
  );

  app.use("/health", healthRouter);
  app.use("/api/v1/quotes", quotesRouter);
  app.use("/api/v1/admin", adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
