import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("getCalendarConnectionSummary", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("nigdy nie rzuca wyjątku, gdy brakuje SUPABASE_SERVICE_ROLE_KEY (regresja: to wywalało render /lab/szkola i /lab/szkola/kalendarz)", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { getCalendarConnectionSummary } = await import("./calendarConnectionStatus");

    const result = await getCalendarConnectionSummary("fake-user-id");

    expect(result.connection).toBeNull();
    expect(result.adminConfigured).toBe(false);
  });

  it("zwraca adminConfigured=true i connection=null, gdy tabela nie istnieje (migracja 009/010 jeszcze nieuruchomiona)", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key-for-test";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    vi.doMock("@supabase/supabase-js", () => ({
      createClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: { message: "relation does not exist" } }),
              }),
            }),
          }),
        }),
      }),
    }));

    const { getCalendarConnectionSummary } = await import("./calendarConnectionStatus");
    const result = await getCalendarConnectionSummary("fake-user-id");

    expect(result.connection).toBeNull();
    expect(result.adminConfigured).toBe(true);
  });
});

describe("isCalendarConnectionActive", () => {
  it("zwraca false dla null", async () => {
    const { isCalendarConnectionActive } = await import("./calendarConnectionStatus");
    expect(isCalendarConnectionActive(null)).toBe(false);
  });

  it("dla ics_url wymaga masked_ics_url", async () => {
    const { isCalendarConnectionActive } = await import("./calendarConnectionStatus");
    expect(
      isCalendarConnectionActive({
        connection_type: "ics_url",
        masked_ics_url: null,
      } as never),
    ).toBe(false);
    expect(
      isCalendarConnectionActive({
        connection_type: "ics_url",
        masked_ics_url: "https://example.com/.../••••••••/basic.ics",
      } as never),
    ).toBe(true);
  });

  it("dla google_oauth wymaga calendar_id", async () => {
    const { isCalendarConnectionActive } = await import("./calendarConnectionStatus");
    expect(isCalendarConnectionActive({ connection_type: "google_oauth", calendar_id: null } as never)).toBe(false);
    expect(isCalendarConnectionActive({ connection_type: "google_oauth", calendar_id: "abc" } as never)).toBe(true);
  });
});
