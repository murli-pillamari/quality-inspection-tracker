import { randomUUID } from "node:crypto";

const sessions = new Map();
const sessionCookie = "quality_tracker_session";

function getCredentials() {
  return {
    username: process.env.AUTH_USERNAME ?? "admin",
    password: process.env.AUTH_PASSWORD ?? "admin"
  };
}

function readSessionId(request) {
  const cookies = request.headers.cookie?.split(";").map((cookie) => cookie.trim()) ?? [];
  return cookies.find((cookie) => cookie.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1);
}

export function createSession(username) {
  const sessionId = randomUUID();
  sessions.set(sessionId, { username });
  return sessionId;
}

export function authenticateUser(username, password) {
  const credentials = getCredentials();
  return username === credentials.username && password === credentials.password;
}

export function clearSession(request) {
  const sessionId = readSessionId(request);
  if (sessionId) sessions.delete(sessionId);
}

export function getSession(request) {
  const sessionId = readSessionId(request);
  return sessionId ? sessions.get(sessionId) : null;
}

export function setSessionCookie(response, sessionId) {
  response.set("Set-Cookie", `${sessionCookie}=${sessionId}; HttpOnly; SameSite=Lax; Path=/`);
}

export function clearSessionCookie(response) {
  response.set("Set-Cookie", `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

export function requireSession(request, response, next) {
  if (!getSession(request)) {
    return response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication is required." } });
  }
  return next();
}