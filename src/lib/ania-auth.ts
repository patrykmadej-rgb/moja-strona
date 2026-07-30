import { createHash, timingSafeEqual } from "crypto";

export const ANIA_AUTH_COOKIE = "ania_auth";
const ANIA_AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dni

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function getAniaAuthCookieValue(): string {
  return createHash("sha256").update(`ania-auth:${process.env.ANIA_PIN}`).digest("hex");
}

export function isAniaPinValid(pin: string): boolean {
  const expected = process.env.ANIA_PIN;
  if (!expected) return false;
  return safeCompare(pin, expected);
}

export function isAniaAuthCookieValid(cookieValue: string | undefined): boolean {
  if (!cookieValue || !process.env.ANIA_PIN) return false;
  return safeCompare(cookieValue, getAniaAuthCookieValue());
}

export const ANIA_AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ANIA_AUTH_COOKIE_MAX_AGE,
};

export function createAniaAuthCookie() {
  return { name: ANIA_AUTH_COOKIE, value: getAniaAuthCookieValue(), ...ANIA_AUTH_COOKIE_OPTIONS };
}
