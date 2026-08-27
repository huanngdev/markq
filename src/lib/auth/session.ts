import "server-only";

import { cookies } from "next/headers";

const sessionCookieName = "markq_session";
const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getSessionUserId() {
  const value = (await cookies()).get(sessionCookieName)?.value;
  return value && sessionIdPattern.test(value) ? value : null;
}

export async function requireSessionUserId() {
  const existing = await getSessionUserId();
  if (existing) return existing;

  const userId = crypto.randomUUID();
  (await cookies()).set(sessionCookieName, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return userId;
}
