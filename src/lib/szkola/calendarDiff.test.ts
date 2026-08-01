import { describe, expect, it } from "vitest";
import { diffEventFields, type ComparableEventFields } from "./calendarDiff";

function baseEvent(overrides: Partial<ComparableEventFields> = {}): ComparableEventFields {
  return {
    title: "Zjazd VI",
    description: null,
    location: "Warszawa",
    start_at: "2027-05-07T00:00:00+00:00",
    end_at: "2027-05-10T00:00:00+00:00",
    timezone: "Europe/Warsaw",
    status: "confirmed",
    organizer_email: null,
    attachments: null,
    recurrence: null,
    ...overrides,
  };
}

describe("diffEventFields", () => {
  it("does not report a false 'moved' change when start_at/end_at represent the same instant in a different string format", () => {
    const previous = baseEvent({ start_at: "2027-05-07T00:00:00+00:00", end_at: "2027-05-10T00:00:00+00:00" });
    const incoming = baseEvent({ start_at: "2027-05-07T00:00:00.000Z", end_at: "2027-05-10T00:00:00.000Z" });

    expect(diffEventFields(previous, incoming)).toEqual([]);
  });

  it("still reports a real date change when the instant actually differs", () => {
    const previous = baseEvent({ start_at: "2027-05-07T00:00:00+00:00" });
    const incoming = baseEvent({ start_at: "2027-05-08T00:00:00+00:00" });

    const changes = diffEventFields(previous, incoming);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ field_name: "start_at", old_value: "2027-05-07T00:00:00+00:00", new_value: "2027-05-08T00:00:00+00:00" });
  });

  it("still reports non-date field changes normally", () => {
    const previous = baseEvent({ title: "Zjazd VI" });
    const incoming = baseEvent({ title: "Zjazd VI (zmiana sali)" });

    const changes = diffEventFields(previous, incoming);
    expect(changes).toEqual([{ field_name: "title", old_value: "Zjazd VI", new_value: "Zjazd VI (zmiana sali)" }]);
  });

  it("returns no changes for two byte-identical events", () => {
    const event = baseEvent();
    expect(diffEventFields(event, { ...event })).toEqual([]);
  });

  it("returns [] when previous is null (new event, handled separately as 'created')", () => {
    expect(diffEventFields(null, baseEvent())).toEqual([]);
  });

  it("treats an invalid/unparsable date string as a real change rather than silently ignoring it", () => {
    const previous = baseEvent({ start_at: "not-a-date" });
    const incoming = baseEvent({ start_at: "2027-05-07T00:00:00+00:00" });

    const changes = diffEventFields(previous, incoming);
    expect(changes).toHaveLength(1);
    expect(changes[0].field_name).toBe("start_at");
  });
});
