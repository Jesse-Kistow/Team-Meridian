import { describe, expect, it } from "vitest";
import { cardDateLabel, categoryPills, firstParam, fromPriceCents, toEventCard } from "./discover";

describe("cardDateLabel", () => {
  it("formats in the display time zone, minutes only when needed", () => {
    expect(cardDateLabel(new Date("2026-10-24T18:00:00Z"))).toBe("SAT, OCT 24 · 2 PM");
    expect(cardDateLabel(new Date("2026-10-24T18:30:00Z"))).toBe("SAT, OCT 24 · 2:30 PM");
  });
});

describe("categoryPills", () => {
  it("dedupes case-insensitively and keeps the first label", () => {
    expect(categoryPills(["Music", "food", "music ", "Food", ""])).toEqual([
      { key: "music", label: "Music" },
      { key: "food", label: "food" },
    ]);
  });
});

describe("fromPriceCents / toEventCard", () => {
  it("uses the cheapest tier, or null with no tiers", () => {
    expect(fromPriceCents([{ priceCents: 2500 }, { priceCents: 1800 }])).toBe(1800);
    expect(fromPriceCents([])).toBeNull();
  });
  it("maps a row to a card", () => {
    const card = toEventCard({
      id: "e1",
      title: "After Hours",
      venue: "The Glasshouse",
      city: "Brooklyn, NY",
      imageUrl: null,
      startsAt: new Date("2026-10-23T23:00:00Z"),
      tiers: [{ priceCents: 3500 }],
    });
    expect(card).toEqual({
      id: "e1",
      title: "After Hours",
      dateLabel: "FRI, OCT 23 · 7 PM",
      locationLabel: "The Glasshouse",
      fromPriceCents: 3500,
      imageUrl: null,
    });
  });
});

describe("firstParam", () => {
  it("handles missing, repeated and long values", () => {
    expect(firstParam(undefined)).toBe("");
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam(" x ".repeat(100), 5)).toBe("x  x");
  });
});
