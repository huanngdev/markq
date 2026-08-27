import "server-only";

import { timingSafeEqual } from "node:crypto";

function configuredToken() {
  const token = process.env.MARKQ_ADMIN_TOKEN?.trim();
  return token && token.length >= 32 ? token : null;
}

export function isAdminEnabled() {
  return configuredToken() !== null;
}

export function isAdminRequest(request: Request) {
  const expected = configuredToken();
  const authorization = request.headers.get("authorization");
  if (!expected || !authorization?.startsWith("Bearer ")) return false;
  const provided = authorization.slice("Bearer ".length);
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}
