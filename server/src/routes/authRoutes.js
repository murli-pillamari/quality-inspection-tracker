import { Router } from "express";
import { authenticateUser, clearSession, clearSessionCookie, createSession, getSession, setSessionCookie } from "../auth.js";
import { asyncRoute, sendError } from "../utils/http.js";

export function createAuthRouter() {
  const router = Router();

  router.post("/login", asyncRoute((request, response) => {
    const { username, password } = request.body ?? {};
    if (!authenticateUser(username, password)) {
      return sendError(response, 401, "INVALID_CREDENTIALS", "Invalid username or password.");
    }

    setSessionCookie(response, createSession(username));
    return response.json({ data: { username } });
  }));

  router.get("/session", (request, response) => {
    const session = getSession(request);
    if (!session) return sendError(response, 401, "UNAUTHORIZED", "Authentication is required.");
    return response.json({ data: session });
  });

  router.post("/logout", (request, response) => {
    clearSession(request);
    clearSessionCookie(response);
    return response.status(204).send();
  });

  return router;
}