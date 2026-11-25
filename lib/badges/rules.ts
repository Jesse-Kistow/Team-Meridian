// Badge definitions and award rules (US-901, US-902). Pure, so they're unit tested.
// The keys match prisma/seed.ts. The Badge rows are created on first award if the
// seed hasn't run, so a fresh database works without seeding.

export type BadgeKey = "first-event" | "early-bird" | "five-events" | "vip";

export type BadgeDefinition = { key: BadgeKey; name: string; description: string };

export const BADGES: BadgeDefinition[] = [
  { key: "first-event", name: "First Event", description: "Attended your first event." },
  { key: "early-bird", name: "Early Bird", description: "Bought a ticket more than 14 days ahead." },
  { key: "five-events", name: "5 Events Attended", description: "Checked in to five events." },
  { key: "vip", name: "VIP", description: "Bought a VIP ticket." },
];

export const EARLY_BIRD_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export type CheckInFacts = {
  /** Distinct events this attendee has been checked in to, including this one. */
  eventsAttended: number;
  /** When the order for the scanned ticket was placed. */
  orderedAt: Date;
  /** When the event starts. */
  eventStartsAt: Date;
  /** The scanned ticket's tier name. */
  tierName: string;
};

/** Every badge these facts qualify for. Already-earned ones are filtered out by the database. */
export function qualifyingBadges(f: CheckInFacts): BadgeKey[] {
  const keys: BadgeKey[] = [];
  if (f.eventsAttended >= 1) keys.push("first-event");
  if (f.eventStartsAt.getTime() - f.orderedAt.getTime() > EARLY_BIRD_DAYS * DAY_MS) keys.push("early-bird");
  if (f.eventsAttended >= 5) keys.push("five-events");
  if (/\bvip\b/i.test(f.tierName)) keys.push("vip");
  return keys;
}

export const badgeDefinition = (key: BadgeKey) => BADGES.find((b) => b.key === key)!;
