// Pure helpers that turn database rows into the shapes the organizer screens
// expect (see components/organizer/types.ts). No Prisma or Next imports, so
// these are unit tested directly.
import type { DailySales, EventStatus, EventSummary, OrganizerEventRow, TierRow } from "../../components/organizer/types";

// Events don't store a time zone yet, so dates and times are shown in this one.
// The Create Event form sends times from the organizer's browser as UTC instants;
// formatting on the server in a fixed zone keeps labels stable between renders.
export const DISPLAY_TIME_ZONE = "America/New_York";

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatDateLabel(d: Date, timeZone = DISPLAY_TIME_ZONE): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone });
}

export function formatTimeLabel(d: Date, timeZone = DISPLAY_TIME_ZONE): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });
}

/** yyyy-mm-dd for the calendar day `d` falls on in `timeZone`. */
export function dayKey(d: Date, timeZone = DISPLAY_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(d);
}

export function isLive(event: { status: EventStatus; startsAt: Date; endsAt: Date }, now: Date): boolean {
  return event.status === "PUBLISHED" && event.startsAt <= now && now < event.endsAt;
}

type TierCounts = { quantity: number; quantitySold: number };

export function tierTotals(tiers: TierCounts[]): { sold: number; capacity: number } {
  return tiers.reduce((acc, t) => ({ sold: acc.sold + t.quantitySold, capacity: acc.capacity + t.quantity }), { sold: 0, capacity: 0 });
}

export type EventListRecord = {
  id: string;
  title: string;
  venue: string;
  city: string;
  startsAt: Date;
  status: EventStatus;
  tiers: TierCounts[];
};

export function toOrganizerEventRow(e: EventListRecord, timeZone = DISPLAY_TIME_ZONE): OrganizerEventRow {
  const { sold, capacity } = tierTotals(e.tiers);
  return {
    id: e.id,
    title: e.title,
    venueLabel: `${e.venue} · ${e.city}`,
    dateLabel: formatDateLabel(e.startsAt, timeZone),
    timeLabel: formatTimeLabel(e.startsAt, timeZone),
    status: e.status,
    sold,
    capacity,
  };
}

// ---- Event dashboard ----

export type DashboardEventRecord = {
  id: string;
  title: string;
  venue: string;
  imageUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  status: EventStatus;
  tiers: ({ id: string; name: string } & TierCounts)[];
};

/** One line of a PAID order for this event. */
export type PaidItem = { tierId: string; quantity: number; unitPriceCents: number; orderedAt: Date };

export type DashboardData = {
  event: EventSummary;
  grossCents: number;
  grossChangePct: number | null;
  sold: number;
  capacity: number;
  daily: DailySales[];
  tiers: TierRow[];
  checkedIn: number;
};

/** Tickets sold per day for the last `days` days (oldest first), labelled by day of month. */
export function dailySales(items: PaidItem[], now: Date, days = 7, timeZone = DISPLAY_TIME_ZONE): DailySales[] {
  const buckets = new Map<string, DailySales>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const label = d.toLocaleDateString("en-US", { day: "numeric", timeZone });
    buckets.set(dayKey(d, timeZone), { label, count: 0 });
  }
  for (const item of items) {
    const bucket = buckets.get(dayKey(item.orderedAt, timeZone));
    if (bucket) bucket.count += item.quantity;
  }
  return [...buckets.values()];
}

/** Gross for the last 7 days vs the 7 before, as a whole percent. Null when there's nothing to compare with. */
export function weeklyGrossChangePct(items: PaidItem[], now: Date): number | null {
  const weekAgo = now.getTime() - 7 * DAY_MS;
  const twoWeeksAgo = now.getTime() - 14 * DAY_MS;
  let thisWeek = 0;
  let lastWeek = 0;
  for (const item of items) {
    const t = item.orderedAt.getTime();
    const cents = item.quantity * item.unitPriceCents;
    if (t > weekAgo && t <= now.getTime()) thisWeek += cents;
    else if (t > twoWeeksAgo && t <= weekAgo) lastWeek += cents;
  }
  if (lastWeek === 0) return null;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

export function toDashboardData(
  event: DashboardEventRecord,
  paidItems: PaidItem[],
  checkedIn: number,
  now: Date,
  timeZone = DISPLAY_TIME_ZONE,
): DashboardData {
  const grossByTier = new Map<string, number>();
  for (const item of paidItems) {
    grossByTier.set(item.tierId, (grossByTier.get(item.tierId) ?? 0) + item.quantity * item.unitPriceCents);
  }
  const { sold, capacity } = tierTotals(event.tiers);
  return {
    event: {
      id: event.id,
      title: event.title,
      dateLabel: formatDateLabel(event.startsAt, timeZone),
      locationLabel: event.venue,
      imageUrl: event.imageUrl,
      status: event.status,
      isLive: isLive(event, now),
    },
    grossCents: [...grossByTier.values()].reduce((a, b) => a + b, 0),
    grossChangePct: weeklyGrossChangePct(paidItems, now),
    sold,
    capacity,
    daily: dailySales(paidItems, now, 7, timeZone),
    tiers: event.tiers.map((t) => ({
      id: t.id,
      name: t.name,
      sold: t.quantitySold,
      capacity: t.quantity,
      grossCents: grossByTier.get(t.id) ?? 0,
    })),
    checkedIn,
  };
}
