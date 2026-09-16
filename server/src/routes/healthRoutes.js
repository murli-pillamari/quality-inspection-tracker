import { Router } from "express";

export function createHealthRouter() {
  const router = Router();
  router.get("/health", (request, response) => response.json({ data: { status: "ok" } }));
  return router;
}
