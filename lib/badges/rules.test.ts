import { describe, expect, it } from "vitest";
import { qualifyingBadges } from "./rules";

const start = new Date("2026-12-20T00:00:00Z");
const base = { eventsAttended: 1, orderedAt: new Date("2026-12-15T00:00:00Z"), eventStartsAt: start, tierName: "General admission" };

describe("qualifyingBadges", () => {
  it("gives First Event on the first check-in", () => {
    expect(qualifyingBadges(base)).toEqual(["first-event"]);
  });

  it("gives Early Bird only for orders more than 14 days ahead", () => {
    expect(qualifyingBadges({ ...base, orderedAt: new Date("2026-12-06T00:00:00Z") })).not.toContain("early-bird");
    expect(qualifyingBadges({ ...base, orderedAt: new Date("2026-12-05T23:59:00Z") })).toContain("early-bird");
  });

  it("gives 5 Events Attended from the fifth distinct event", () => {
    expect(qualifyingBadges({ ...base, eventsAttended: 4 })).not.toContain("five-events");
    expect(qualifyingBadges({ ...base, eventsAttended: 5 })).toContain("five-events");
  });

  it("gives VIP for a tier named VIP, not for words that only contain it", () => {
    expect(qualifyingBadges({ ...base, tierName: "VIP" })).toContain("vip");
    expect(qualifyingBadges({ ...base, tierName: "Backstage vip pass" })).toContain("vip");
    expect(qualifyingBadges({ ...base, tierName: "Vipers fan club" })).not.toContain("vip");
  });
});
