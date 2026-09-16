import express from "express";
import { createInspectionsRepository } from "./repositories/inspectionsRepository.js";
import { createHealthRouter } from "./routes/healthRoutes.js";
import { createInspectionRouter } from "./routes/inspectionRoutes.js";
import { createSapWebhookRouter } from "./routes/sapWebhookRoutes.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { requireSession } from "./auth.js";
import { sendError } from "./utils/http.js";

export function createApp(database) {
  const app = express();

  app.use((request, response, next) => {
    response.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    if (request.method === "OPTIONS") return response.sendStatus(204);
    return next();
  });
  app.use(express.json({ limit: "1mb" }));

  const inspectionsRepository = createInspectionsRepository(database);
  app.use("/api", createHealthRouter());
  app.use("/api/auth", createAuthRouter());
  app.use("/api/inspections", requireSession, createInspectionRouter(inspectionsRepository));
  app.use("/api/sap-webhook", createSapWebhookRouter(inspectionsRepository));

  app.use((request, response) => sendError(response, 404, "NOT_FOUND", "Route not found."));
  app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && "body" in error) {
      return sendError(response, 400, "INVALID_JSON", "Request body must contain valid JSON.");
    }
    if (error.type === "entity.too.large") {
      return sendError(response, 400, "BODY_TOO_LARGE", "Request body is too large.");
    }
    console.error(error);
    return sendError(response, 500, "INTERNAL_ERROR", "An unexpected error occurred.");
  });

  return app;
}
