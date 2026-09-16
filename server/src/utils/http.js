export function sendError(response, status, code, message, details) {
  const error = { code, message };
  if (details && Object.keys(details).length) error.details = details;
  response.status(status).json({ error });
}

export function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}
