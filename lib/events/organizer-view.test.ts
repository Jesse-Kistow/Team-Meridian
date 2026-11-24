import { describe, expect, it } from "vitest";
import { dailySales, isLive, toDashboardData, toOrganizerEventRow, weeklyGrossChangePct, type PaidItem } from "./organizer-view";

// 7:00 PM in New York on Oct 23, 2026 (EDT, UTC-4)
const start = new Date("2026-10-23T23:00:00.000Z");
const end = new Date("2026-10-24T03:00:00.000Z");

describe("toOrganizerEventRow", () => {
  it("maps an event and sums tier counts", () => {
    const row = toOrganizerEventRow({
      id: "e1",
      title: "After Hours",
      venue: "The Glasshouse",
      city: "Brooklyn, NY",
      startsAt: start,
      status: "PUBLISHED",
      tiers: [
        { quantity: 50, quantitySold: 50 },
        { quantity: 200, quantitySold: 160 },
      ],
    });
    expect(row).toEqual({
      id: "e1",
      title: "After Hours",
      venueLabel: "The Glasshouse · Brooklyn, NY",
      dateLabel: "Oct 23, 2026",
      timeLabel: "7:00 PM",
      status: "PUBLISHED",
      sold: 210,
      capacity: 250,
    });
  });

  it("handles events with no tiers", () => {
    const row = toOrganizerEventRow({ id: "e2", title: "x", venue: "v", city: "c", startsAt: start, status: "DRAFT", tiers: [] });
    expect([row.sold, row.capacity]).toEqual([0, 0]);
  });
});

describe("isLive", () => {
  const e = { status: "PUBLISHED" as const, startsAt: start, endsAt: end };
  it("is live only while a published event is running", () => {
    expect(isLive(e, new Date("2026-10-24T00:00:00Z"))).toBe(true);
    expect(isLive(e, new Date("2026-10-23T22:59:00Z"))).toBe(false);
    expect(isLive(e, end)).toBe(false);
    expect(isLive({ ...e, status: "DRAFT" }, new Date("2026-10-24T00:00:00Z"))).toBe(false);
  });
});

const now = new Date("2026-10-23T16:00:00.000Z"); // noon in New York
const item = (iso: string, quantity: number, unitPriceCents = 1000, tierId = "t1"): PaidItem => ({
  tierId,
  quantity,
  unitPriceCents,
  orderedAt: new Date(iso),
});

describe("dailySales", () => {
  it("buckets the last 7 days by New York calendar day, oldest first", () => {
    const daily = dailySales(
      [
        item("2026-10-23T03:30:00Z", 2), // Oct 22, 11:30 PM in New York
        item("2026-10-23T05:00:00Z", 3), // Oct 23, 1 AM in New York
        item("2026-10-17T15:00:00Z", 1),
        item("2026-10-01T15:00:00Z", 9), // too old
      ],
      now,
    );
    expect(daily.map((d) => d.label)).toEqual(["17", "18", "19", "20", "21", "22", "23"]);
    expect(daily.map((d) => d.count)).toEqual([1, 0, 0, 0, 0, 2, 3]);
  });
});

describe("weeklyGrossChangePct", () => {
  it("compares the last 7 days with the 7 before", () => {
    expect(weeklyGrossChangePct([item("2026-10-22T12:00:00Z", 3), item("2026-10-12T12:00:00Z", 2)], now)).toBe(50);
  });
  it("is null with no sales in the previous week", () => {
    expect(weeklyGrossChangePct([item("2026-10-22T12:00:00Z", 3)], now)).toBeNull();
  });
});

describe("toDashboardData", () => {
  it("builds the dashboard props from rows", () => {
    const data = toDashboardData(
      {
        id: "e1",
        title: "After Hours",
        venue: "The Glasshouse",
        imageUrl: null,
        startsAt: start,
        endsAt: end,
        status: "PUBLISHED",
        tiers: [
          { id: "t1", name: "Early bird", quantity: 50, quantitySold: 5 },
          { id: "t2", name: "VIP", quantity: 10, quantitySold: 1 },
        ],
      },
      [item("2026-10-22T12:00:00Z", 5, 2500, "t1"), item("2026-10-22T13:00:00Z", 1, 6000, "t2")],
      4,
      now,
    );
    expect(data.event).toEqual({
      id: "e1",
      title: "After Hours",
      dateLabel: "Oct 23, 2026",
      locationLabel: "The Glasshouse",
      imageUrl: null,
      status: "PUBLISHED",
      isLive: false,
    });
    expect(data.grossCents).toBe(18500);
    expect([data.sold, data.capacity, data.checkedIn]).toEqual([6, 60, 4]);
    expect(data.tiers).toEqual([
      { id: "t1", name: "Early bird", sold: 5, capacity: 50, grossCents: 12500 },
      { id: "t2", name: "VIP", sold: 1, capacity: 10, grossCents: 6000 },
    ]);
    expect(data.daily.at(-2)).toEqual({ label: "22", count: 6 });
  });
});
