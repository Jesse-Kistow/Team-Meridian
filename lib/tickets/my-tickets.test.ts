import { describe, expect, it } from "vitest";
import { shortTicketCode } from "./display";
import { pastOutcome, toMyTickets, type TicketRecord } from "./my-tickets";

const now = new Date("2026-11-25T12:00:00Z");

function ticket(id: string, over: Partial<TicketRecord> & { start?: string; end?: string; eventId?: string } = {}): TicketRecord {
  const { start = "2026-12-05T00:00:00Z", end = "2026-12-05T04:00:00Z", eventId = "e1", ...rest } = over;
  return {
    id,
    status: "VALID",
    orderId: "o1",
    order: { status: "PAID" },
    tier: { id: "t1", name: "GA" },
    event: {
      id: eventId,
      title: `Event ${eventId}`,
      venue: "The Glasshouse",
      city: "Brooklyn, NY",
      imageUrl: null,
      startsAt: new Date(start),
      endsAt: new Date(end),
      status: "PUBLISHED",
    },
    ...rest,
  };
}

describe("shortTicketCode", () => {
  it("uses the end of the row id, never the secret code", () => {
    expect(shortTicketCode("cmabc123xyz789")).toBe("EA-XYZ789");
  });
});

describe("toMyTickets", () => {
  it("groups tickets from the same order and tier into one card", () => {
    const { upcoming, past } = toMyTickets([ticket("a1"), ticket("a2")], "Maya", now);
    expect(past).toEqual([]);
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]).toMatchObject({
      id: "a1",
      ticketCount: 2,
      status: "CONFIRMED",
      holderName: "Maya",
      ticketCode: "EA-A1",
      href: "/my-tickets/a1",
      dateLabel: "Fri, Dec 4, 2026 · 7:00 PM",
      locationLabel: "The Glasshouse, Brooklyn, NY",
    });
  });

  it("sorts upcoming soonest first and past most recent first", () => {
    const tickets = [
      ticket("late", { orderId: "o2", eventId: "e2", start: "2027-01-10T00:00:00Z", end: "2027-01-10T03:00:00Z" }),
      ticket("soon", { orderId: "o3", eventId: "e3" }),
      ticket("old", { orderId: "o4", eventId: "e4", start: "2026-08-01T00:00:00Z", end: "2026-08-01T03:00:00Z" }),
      ticket("recent", { orderId: "o5", eventId: "e5", start: "2026-11-01T00:00:00Z", end: "2026-11-01T03:00:00Z" }),
    ];
    const { upcoming, past } = toMyTickets(tickets, "Maya", now);
    expect(upcoming.map((t) => t.id)).toEqual(["soon", "late"]);
    expect(past.map((t) => t.id)).toEqual(["recent", "old"]);
    expect(past[0]).toMatchObject({ month: "OCT", day: "31", timeLabel: "8:00 PM · 1 ticket" });
  });

  it("keeps an event that is happening right now in upcoming", () => {
    const live = ticket("live", { start: "2026-11-25T10:00:00Z", end: "2026-11-25T14:00:00Z" });
    expect(toMyTickets([live], "Maya", now).upcoming).toHaveLength(1);
  });

  it("marks cancelled events and refunded orders as cancelled", () => {
    const cancelled = ticket("c", { order: { status: "REFUNDED" } });
    expect(toMyTickets([cancelled], "Maya", now).upcoming[0].status).toBe("CANCELLED");
  });
});

describe("pastOutcome", () => {
  it("maps USED to ATTENDED, VALID to MISSED and CANCELLED to CANCELLED", () => {
    expect(pastOutcome([ticket("a", { status: "USED" }), ticket("b")])).toBe("ATTENDED");
    expect(pastOutcome([ticket("a")])).toBe("MISSED");
    expect(pastOutcome([ticket("a", { status: "CANCELLED" })])).toBe("CANCELLED");
  });
});
