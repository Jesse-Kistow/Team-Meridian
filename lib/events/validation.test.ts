import { describe, expect, it } from "vitest";
import { parseEventInput } from "./validation";

const valid = {
  title: "  After Hours  ",
  description: "Late-night DJ sets.",
  category: "Music",
  venue: "The Glasshouse",
  city: "Brooklyn, NY",
  imageUrl: "",
  startsAt: "2026-12-05T00:00:00.000Z",
  endsAt: "2026-12-05T04:00:00.000Z",
  rewardBadges: true,
  tiers: [{ name: "GA", priceCents: 2500, quantity: 100 }],
};

describe("parseEventInput", () => {
  it("accepts a valid payload and trims text", () => {
    const r = parseEventInput(valid, { requireTiers: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.title).toBe("After Hours");
    expect(r.data.imageUrl).toBeNull();
    expect(r.data.startsAt).toEqual(new Date("2026-12-05T00:00:00.000Z"));
    expect(r.data.tiers).toEqual([{ name: "GA", priceCents: 2500, quantity: 100 }]);
    expect(r.data).not.toHaveProperty("rewardBadges");
  });

  it("rejects missing required fields", () => {
    const r = parseEventInput({ ...valid, title: " ", venue: undefined }, { requireTiers: false });
    expect(r).toEqual({ ok: false, errors: expect.arrayContaining(["Event name is required.", "Venue is required."]) });
  });

  it("requires the end to be after the start", () => {
    const r = parseEventInput({ ...valid, endsAt: valid.startsAt }, { requireTiers: false });
    expect(r).toEqual({ ok: false, errors: ["End time must be after the start time."] });
  });

  it("rejects unparseable dates", () => {
    const r = parseEventInput({ ...valid, startsAt: "not a date" }, { requireTiers: false });
    expect(r.ok).toBe(false);
  });

  it("rejects negative prices, fractional cents and zero quantity", () => {
    for (const tier of [
      { name: "A", priceCents: -1, quantity: 1 },
      { name: "A", priceCents: 10.5, quantity: 1 },
      { name: "A", priceCents: 100, quantity: 0 },
      { name: "A", priceCents: "100", quantity: 1 },
    ]) {
      expect(parseEventInput({ ...valid, tiers: [tier] }, { requireTiers: true }).ok).toBe(false);
    }
  });

  it("allows a free tier", () => {
    expect(parseEventInput({ ...valid, tiers: [{ name: "Free", priceCents: 0, quantity: 10 }] }, { requireTiers: true }).ok).toBe(true);
  });

  it("needs a tier to publish but not to save a draft", () => {
    expect(parseEventInput({ ...valid, tiers: [] }, { requireTiers: false }).ok).toBe(true);
    expect(parseEventInput({ ...valid, tiers: [] }, { requireTiers: true })).toEqual({
      ok: false,
      errors: ["Add at least one ticket tier before publishing."],
    });
  });

  it("only accepts http(s) image URLs", () => {
    expect(parseEventInput({ ...valid, imageUrl: "javascript:alert(1)" }, { requireTiers: true }).ok).toBe(false);
    const r = parseEventInput({ ...valid, imageUrl: "https://example.com/a.jpg" }, { requireTiers: true });
    expect(r.ok && r.data.imageUrl).toBe("https://example.com/a.jpg");
  });

  it("rejects non-object input", () => {
    expect(parseEventInput(null, { requireTiers: false }).ok).toBe(false);
    expect(parseEventInput("x", { requireTiers: false }).ok).toBe(false);
  });
});
