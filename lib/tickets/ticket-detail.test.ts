import { describe, expect, it } from "vitest";
import { showsQr, ticketState, type TicketStateInput } from "./ticket-detail";

const now = new Date("2026-11-25T12:00:00Z");
const base: TicketStateInput = { status: "VALID", orderStatus: "PAID", eventStatus: "PUBLISHED", eventEndsAt: new Date("2026-12-01T00:00:00Z") };

describe("ticketState", () => {
  it("is VALID for a paid, unused ticket to a future event", () => {
    expect(ticketState(base, now)).toBe("VALID");
    expect(showsQr("VALID")).toBe(true);
  });
  it("is USED once scanned, ENDED after the event", () => {
    expect(ticketState({ ...base, status: "USED" }, now)).toBe("USED");
    expect(ticketState({ ...base, eventEndsAt: new Date("2026-11-25T11:00:00Z") }, now)).toBe("ENDED");
  });
  it("is CANCELLED for cancelled tickets, refunded orders or cancelled events", () => {
    expect(ticketState({ ...base, status: "CANCELLED" }, now)).toBe("CANCELLED");
    expect(ticketState({ ...base, orderStatus: "REFUNDED" }, now)).toBe("CANCELLED");
    expect(ticketState({ ...base, eventStatus: "CANCELLED", status: "USED" }, now)).toBe("CANCELLED");
  });
  it("hides the QR for anything but VALID", () => {
    expect(["USED", "CANCELLED", "ENDED"].map((s) => showsQr(s as never))).toEqual([false, false, false]);
  });
});
