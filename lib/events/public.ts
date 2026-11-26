// lib/events/public.ts
// Loads PUBLISHED events for the public event page and checkout.
import "server-only";
import { prisma } from "@/lib/prisma";
import { releaseExpiredOrders } from "@/lib/orders";

// Events don't store a time zone yet, so dates and times are shown in this one
// (the same zone the organizer screens use).
export const DISPLAY_TIME_ZONE = "America/New_York";

const fmt = (d: Date, options: Intl.DateTimeFormatOptions) =>
  d.toLocaleString("en-US", { timeZone: DISPLAY_TIME_ZONE, ...options });

export const longDate = (d: Date) => fmt(d, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
export const shortDate = (d: Date) => fmt(d, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
export const time = (d: Date) => fmt(d, { hour: "numeric", minute: "2-digit" });

/** A published event with its tiers, or null. Releases expired holds first so "remaining" is current. */
export async function getPublishedEvent(id: string) {
  await releaseExpiredOrders({ eventId: id });
  return prisma.event.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      tiers: { orderBy: { priceCents: "asc" } },
      organizer: { select: { id: true, name: true, organizationName: true } },
    },
  });
}

type TierLike = { quantity: number; quantitySold: number; salesStart: Date | null; salesEnd: Date | null };

/** Tickets a buyer can take right now (0 outside the tier's sales window). */
export function remainingNow(tier: TierLike, now = new Date()) {
  if (tier.salesStart && tier.salesStart > now) return 0;
  if (tier.salesEnd && tier.salesEnd < now) return 0;
  return Math.max(tier.quantity - tier.quantitySold, 0);
}
