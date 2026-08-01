import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Szyfrowanie tokenów OAuth Google Calendar przed zapisem do
 * school_calendar_connections (AES-256-GCM). Klucz z CALENDAR_TOKEN_ENCRYPTION_KEY
 * (32 bajty zakodowane w base64 — np. `openssl rand -base64 32`).
 *
 * Format zapisanego ciągu: `<iv-base64>:<authTag-base64>:<ciphertext-base64>`.
 * Serwer jest jedynym miejscem, które zna klucz — bez niego zaszyfrowana
 * wartość w bazie jest bezużyteczna, nawet przy wycieku samej bazy danych.
 */

const ALGORITHM = "aes-256-gcm";

/** Odróżnia "brak/zła konfiguracja klucza szyfrowania" od innych błędów (np. uszkodzonych danych). */
export class CalendarEncryptionConfigError extends Error {}

function getKey(): Buffer {
  const raw = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new CalendarEncryptionConfigError(
      "Brak CALENDAR_TOKEN_ENCRYPTION_KEY w zmiennych środowiskowych — integracja z kalendarzem wymaga konfiguracji.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new CalendarEncryptionConfigError(
      "CALENDAR_TOKEN_ENCRYPTION_KEY musi być 32-bajtowym kluczem zakodowanym w base64 (np. `openssl rand -base64 32`).",
    );
  }
  return key;
}

export function encryptToken(plainText: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptToken(encoded: string): string {
  const key = getKey();
  const parts = encoded.split(":");
  if (parts.length !== 3) {
    throw new Error("Nieprawidłowy format zaszyfrowanego tokenu.");
  }
  const [ivB64, authTagB64, cipherTextB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const cipherText = Buffer.from(cipherTextB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString("utf8");
}
