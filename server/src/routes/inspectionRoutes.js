import { Router } from "express";
import { asyncRoute, sendError } from "../utils/http.js";
import { validateInspection, validateListFilters, validateResolution } from "../validation.js";

export function createInspectionRouter(inspectionsRepository) {
  const router = Router();

  router.post("/", asyncRoute((request, response) => {
    const { errors, value } = validateInspection(request.body);
    if (Object.keys(errors).length) return sendError(response, 400, "VALIDATION_ERROR", "Invalid inspection data.", errors);
    return response.status(201).json({ data: inspectionsRepository.create(value) });
  }));

  router.get("/", asyncRoute((request, response) => {
    const { errors, value } = validateListFilters(new URLSearchParams(request.query));
    if (Object.keys(errors).length) return sendError(response, 400, "VALIDATION_ERROR", "Invalid list filters.", errors);

    const inspections = inspectionsRepository.list(value);
    return response.json({
      data: inspections,
      meta: { count: inspections.length, sortBy: value.sortBy, sortOrder: value.sortOrder }
    });
  }));

  router.get("/summary", asyncRoute((request, response) => {
    return response.json({ data: inspectionsRepository.summary() });
  }));

  router.patch("/:id/resolve", asyncRoute((request, response) => {
    const id = Number(request.params.id);
    const { errors, value } = validateResolution(request.body);
    if (Object.keys(errors).length) return sendError(response, 400, "VALIDATION_ERROR", "A resolution note is required.", errors);

    const inspection = inspectionsRepository.findById(id);
    if (!inspection) return sendError(response, 404, "NOT_FOUND", "Inspection not found.");
    if (inspection.status === "Resolved") return sendError(response, 409, "ALREADY_RESOLVED", "Inspection is already resolved.");
    return response.json({ data: inspectionsRepository.resolve(id, value.resolutionNote) });
  }));

  return router;
}
