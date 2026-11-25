import { describe, expect, it } from "vitest";
import { planTierChanges, statusChangeError, toFormDateTime, type ExistingTier } from "./edit";

const ga: ExistingTier = { id: "t1", name: "GA", quantity: 100, quantitySold: 40, hasOrders: true };
const vip: ExistingTier = { id: "t2", name: "VIP", quantity: 20, quantitySold: 0, hasOrders: false };

describe("planTierChanges", () => {
  it("updates kept tiers, creates new ones and removes unsold ones", () => {
    const r = planTierChanges([ga, vip], [
      { id: "t1", name: "General", priceCents: 3000, quantity: 120 },
      { name: "Early bird", priceCents: 1500, quantity: 10 },
    ]);
    expect(r).toEqual({
      ok: true,
      plan: {
        update: [{ id: "t1", name: "General", priceCents: 3000, quantity: 120, minQuantity: 40 }],
        create: [{ name: "Early bird", priceCents: 1500, quantity: 10 }],
        remove: [{ id: "t2", name: "VIP" }],
      },
    });
  });

  it("refuses to drop quantity below what is sold", () => {
    const r = planTierChanges([ga], [{ id: "t1", name: "GA", priceCents: 2500, quantity: 39 }]);
    expect(r.ok).toBe(false);
  });

  it("allows quantity equal to what is sold", () => {
    expect(planTierChanges([ga], [{ id: "t1", name: "GA", priceCents: 2500, quantity: 40 }]).ok).toBe(true);
  });

  it("refuses to remove a tier with orders", () => {
    const r = planTierChanges([ga, vip], [{ id: "t2", name: "VIP", priceCents: 9000, quantity: 20 }]);
    expect(r).toEqual({ ok: false, errors: ["GA can't be removed because tickets have already been ordered."] });
  });

  it("refuses a tier id from another event, or the same id twice", () => {
    expect(planTierChanges([vip], [{ id: "other", name: "X", priceCents: 0, quantity: 1 }]).ok).toBe(false);
    expect(
      planTierChanges([vip], [
        { id: "t2", name: "A", priceCents: 0, quantity: 1 },
        { id: "t2", name: "B", priceCents: 0, quantity: 1 },
      ]).ok,
    ).toBe(false);
  });
});

describe("statusChangeError", () => {
  it("blocks cancelled events and unpublishing with sales", () => {
    expect(statusChangeError("CANCELLED", "PUBLISHED", 0)).not.toBeNull();
    expect(statusChangeError("PUBLISHED", "DRAFT", 3)).not.toBeNull();
  });
  it("allows the normal cases", () => {
    expect(statusChangeError("PUBLISHED", "DRAFT", 0)).toBeNull();
    expect(statusChangeError("DRAFT", "PUBLISHED", 0)).toBeNull();
    expect(statusChangeError("PUBLISHED", "PUBLISHED", 10)).toBeNull();
  });
});

describe("toFormDateTime", () => {
  it("round-trips through the form's local date and time", () => {
    const start = new Date(2026, 11, 5, 19, 30);
    const end = new Date(2026, 11, 5, 23, 5);
    const f = toFormDateTime(start, end);
    expect(f).toEqual({ date: "2026-12-05", startTime: "19:30", endTime: "23:05" });
    expect(new Date(`${f.date}T${f.startTime}`).getTime()).toBe(start.getTime());
  });
});
