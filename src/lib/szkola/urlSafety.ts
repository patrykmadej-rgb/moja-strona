import "server-only";
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_URL_LENGTH = 2048;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export class UnsafeUrlError extends Error {}

/** `webcal://...` -> `https://...` (reszta adresu bez zmian). Nic więcej nie modyfikuje. */
export function normalizeIcsUrl(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith("webcal://")) {
    return `https://${trimmed.slice("webcal://".length)}`;
  }
  return trimmed;
}

/** Walidacja formatu — bez sprawdzania DNS/SSRF (patrz `assertPublicHttpUrl` do tego). */
export function parseIcsUrlOrThrow(rawUrl: string): URL {
  if (!rawUrl) {
    throw new UnsafeUrlError("Adres kalendarza jest wymagany.");
  }
  if (rawUrl.length > MAX_URL_LENGTH) {
    throw new UnsafeUrlError("Adres kalendarza jest zbyt długi.");
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("To nie jest poprawny adres URL.");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new UnsafeUrlError("Dozwolone są tylko adresy http:// lub https:// (albo webcal://, które zamieniamy na https://).");
  }

  if (!url.hostname) {
    throw new UnsafeUrlError("Adres kalendarza musi zawierać nazwę hosta.");
  }

  return url;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inIpv4Range(ip: string, base: string, prefixLength: number): boolean {
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt === null || baseInt === null) return false;
  const mask = prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

const IPV4_PRIVATE_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, w tym metadata endpoint 169.254.169.254
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4], // multicast i dalej
];

function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return IPV4_PRIVATE_RANGES.some(([base, prefix]) => inIpv4Range(ip, base, prefix));
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7 unique local
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
      return true; // fe80::/10 link-local
    }
    // Adresy IPv4-mapped (::ffff:a.b.c.d) — sprawdź osadzony adres IPv4.
    const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateOrReservedIp(mapped[1]);
    return false;
  }
  return true; // nierozpoznany format — odrzuć ostrożnościowo
}

/**
 * Zabezpieczenie przed SSRF: sprawdza protokół i hostname, a następnie
 * faktycznie rozwiązuje DNS i odrzuca, jeśli JAKIKOLWIEK zwrócony adres IP
 * jest prywatny/loopback/link-local/metadata. To nie eliminuje w 100%
 * ataku typu DNS-rebinding (zmiana adresu IP między tą walidacją a
 * właściwym fetchem) — pełna ochrona wymagałaby przypięcia zweryfikowanego
 * adresu IP bezpośrednio do żądania HTTP. Dla jednoosobowego, prywatnego
 * panelu to świadomy kompromis: blokuje wszystkie oczywiste wektory
 * (localhost, sieci prywatne, endpoint metadanych chmury), a nie jest
 * next-gen ochroną klasy publicznego SaaS.
 */
export async function assertPublicHttpUrl(url: URL): Promise<void> {
  // URL.hostname zwraca adresy IPv6 w nawiasach (np. "[::1]") — trzeba je
  // zdjąć przed sprawdzeniem isIP/isPrivateOrReservedIp, inaczej literały
  // IPv6 (także publiczne) błędnie trafiają do gałęzi DNS lookup.
  const rawHostname = url.hostname.toLowerCase();
  const hostname =
    rawHostname.startsWith("[") && rawHostname.endsWith("]") ? rawHostname.slice(1, -1) : rawHostname;

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new UnsafeUrlError("Adresy localhost nie są dozwolone.");
  }

  if (isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new UnsafeUrlError("Adresy IP prywatne/zastrzeżone nie są dozwolone.");
    }
    return;
  }

  let addresses: { address: string }[];
  try {
    addresses = await dnsLookup(hostname, { all: true });
  } catch {
    throw new UnsafeUrlError("Nie udało się rozwiązać adresu hosta.");
  }

  if (addresses.length === 0) {
    throw new UnsafeUrlError("Adres hosta nie wskazuje na żaden serwer.");
  }

  for (const { address } of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new UnsafeUrlError("Adres kalendarza wskazuje na sieć prywatną lub zastrzeżoną — niedozwolone.");
    }
  }
}

/** `https://calendar.google.com/.../••••••••/basic.ics` — nigdy nie pokazuj pełnego prywatnego adresu. */
export function maskIcsUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const lastSegment = segments.at(-1) ?? "";
    return `${url.protocol}//${url.host}/.../••••••••/${lastSegment}`;
  } catch {
    return "••••••••";
  }
}
