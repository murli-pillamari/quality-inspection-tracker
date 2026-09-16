import { Router } from "express";
import { asyncRoute, sendError } from "../utils/http.js";
import { validateInspection, validateSapWebhook } from "../validation.js";

export function createSapWebhookRouter(inspectionsRepository) {
  const router = Router();

  router.post("/", asyncRoute((request, response) => {
    const { errors: webhookErrors, value: webhook } = validateSapWebhook(request.body);
    if (Object.keys(webhookErrors).length) {
      return sendError(response, 400, "VALIDATION_ERROR", "Invalid SAP webhook payload.", webhookErrors);
    }

    const { errors, value } = validateInspection(webhook.inspection);
    if (Object.keys(errors).length) {
      return sendError(response, 400, "VALIDATION_ERROR", "Invalid inspection data.", errors);
    }

    return response.status(201).json({
      data: inspectionsRepository.create(value),
      meta: { source: "SAP", eventId: webhook.eventId }
    });
  }));

  return router;
}