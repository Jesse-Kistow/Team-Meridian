import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { toDashboardData, toOrganizerEventRow } from "./organizer-view";

/**
 * The signed-in organizer's database row, or null for anyone else.
 * The middleware already keeps attendees off /organizer pages; this is the
 * server-side check for pages and actions, based on Clerk's public metadata.
 */
export async function getCurrentOrganizer() {
  const user = await getCurrentDbUser();
  return user?.role === "ORGANIZER" ? user : null;
}

export async function getOrganizerEventRows(organizerId: string) {
  const events = await prisma.event.findMany({
    where: { organizerId },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      title: true,
      venue: true,
      city: true,
      startsAt: true,
      status: true,
      tiers: { select: { quantity: true, quantitySold: true } },
    },
  });
  return events.map((e) => toOrganizerEventRow(e));
}

/** Dashboard data for one event, or null if it doesn't exist or isn't this organizer's. */
export async function getOrganizerEventDashboard(eventId: string, organizerId: string, now = new Date()) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId },
    select: {
      id: true,
      title: true,
      venue: true,
      imageUrl: true,
      startsAt: true,
      endsAt: true,
      status: true,
      tiers: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, quantity: true, quantitySold: true },
      },
    },
  });
  if (!event) return null;

  const [items, checkedIn] = await Promise.all([
    prisma.orderItem.findMany({
      where: { order: { eventId: event.id, status: "PAID" } },
      select: { tierId: true, quantity: true, unitPriceCents: true, order: { select: { createdAt: true } } },
    }),
    prisma.checkIn.count({ where: { eventId: event.id } }),
  ]);

  const paidItems = items.map((i) => ({
    tierId: i.tierId,
    quantity: i.quantity,
    unitPriceCents: i.unitPriceCents,
    orderedAt: i.order.createdAt,
  }));
  return toDashboardData(event, paidItems, checkedIn, now);
}
