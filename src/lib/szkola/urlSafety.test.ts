import { describe, expect, it, vi } from "vitest";
import { assertPublicHttpUrl, maskIcsUrl, normalizeIcsUrl, parseIcsUrlOrThrow } from "./urlSafety";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async (hostname: string) => {
    if (hostname === "calendar.example.com") return [{ address: "93.184.216.34", family: 4 }];
    if (hostname === "rebind.example.com") return [{ address: "127.0.0.1", family: 4 }];
    if (hostname === "nonexistent.invalid") throw new Error("ENOTFOUND");
    return [{ address: "203.0.113.10", family: 4 }];
  }),
}));

describe("normalizeIcsUrl", () => {
  it("zamienia webcal:// na https://", () => {
    expect(normalizeIcsUrl("webcal://example.com/cal.ics")).toBe("https://example.com/cal.ics");
  });

  it("nie zmienia adresu https://", () => {
    expect(normalizeIcsUrl("https://example.com/cal.ics")).toBe("https://example.com/cal.ics");
  });

  it("przycina białe znaki", () => {
    expect(normalizeIcsUrl("  webcal://example.com/a.ics  ")).toBe("https://example.com/a.ics");
  });
});

describe("parseIcsUrlOrThrow", () => {
  it("akceptuje poprawny adres https", () => {
    expect(() => parseIcsUrlOrThrow("https://calendar.example.com/basic.ics")).not.toThrow();
  });

  it("odrzuca pusty adres", () => {
    expect(() => parseIcsUrlOrThrow("")).toThrow();
  });

  it("odrzuca niepoprawny URL", () => {
    expect(() => parseIcsUrlOrThrow("to nie jest url")).toThrow();
  });

  it("odrzuca file://", () => {
    expect(() => parseIcsUrlOrThrow("file:///etc/passwd")).toThrow();
  });

  it("odrzuca ftp://", () => {
    expect(() => parseIcsUrlOrThrow("ftp://example.com/a.ics")).toThrow();
  });

  it("odrzuca zbyt długi adres", () => {
    const long = `https://example.com/${"a".repeat(3000)}`;
    expect(() => parseIcsUrlOrThrow(long)).toThrow();
  });
});

describe("assertPublicHttpUrl (ochrona SSRF)", () => {
  it("odrzuca localhost", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("http://localhost/cal.ics"))).rejects.toThrow();
  });

  it("odrzuca 127.0.0.1 (loopback)", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("http://127.0.0.1/cal.ics"))).rejects.toThrow();
  });

  it("odrzuca 0.0.0.0", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("http://0.0.0.0/cal.ics"))).rejects.toThrow();
  });

  it("odrzuca adres z prywatnego zakresu 10.0.0.0/8", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("http://10.0.0.5/cal.ics"))).rejects.toThrow();
  });

  it("odrzuca adres z prywatnego zakresu 192.168.0.0/16", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("http://192.168.1.1/cal.ics"))).rejects.toThrow();
  });

  it("odrzuca adres z prywatnego zakresu 172.16.0.0/12", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("http://172.16.5.5/cal.ics"))).rejects.toThrow();
  });

  it("odrzuca link-local / endpoint metadanych chmury 169.254.169.254", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("http://169.254.169.254/latest/meta-data/"))).rejects.toThrow();
  });

  it("odrzuca IPv6 loopback ::1", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("http://[::1]/cal.ics"))).rejects.toThrow();
  });

  it("odrzuca IPv6 unique-local fc00::/7", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("http://[fd00::1]/cal.ics"))).rejects.toThrow();
  });

  it("przepuszcza publiczny hostname (zmockowany DNS)", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("https://calendar.example.com/basic.ics"))).resolves.not.toThrow();
  });

  it("przepuszcza publiczny adres IP", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("http://93.184.216.34/cal.ics"))).resolves.not.toThrow();
  });

  it("odrzuca hostname, który rozwiązuje się na adres prywatny (DNS rebinding)", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("https://rebind.example.com/basic.ics"))).rejects.toThrow();
  });

  it("odrzuca hostname, którego nie da się rozwiązać", async () => {
    await expect(assertPublicHttpUrl(parseIcsUrlOrThrow("https://nonexistent.invalid/basic.ics"))).rejects.toThrow();
  });
});

describe("maskIcsUrl", () => {
  it("maskuje adres zgodnie z przykładem ze specyfikacji", () => {
    const masked = maskIcsUrl("https://calendar.google.com/calendar/ical/abc123secret/private-xyz/basic.ics");
    expect(masked).toBe("https://calendar.google.com/.../••••••••/basic.ics");
    expect(masked).not.toContain("abc123secret");
    expect(masked).not.toContain("private-xyz");
  });

  it("nigdy nie zawiera pełnego oryginalnego adresu", () => {
    const original = "https://example.com/very/secret/path/basic.ics";
    const masked = maskIcsUrl(original);
    expect(masked).not.toBe(original);
    expect(masked).not.toContain("secret");
  });
});
